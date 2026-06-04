"""
Fan: DecisionTree ML (nhiệt độ, độ ẩm).

Light: DecisionTree ML trên lux («Light») và tùy chọn «Hour» (giờ trong ngày từ CSV khi train).
Khi infer có Hour: dùng giờ hiện tại máy chủ (hoặc UTC nếu LIGHT_INFER_UTC=1).

Nhãn: LIGHT_USE_ORIGINAL_OCCUPANCY_LABELS / LIGHT_NEED_ON_MAX_LUX.
"""
import os
import json
from datetime import datetime, timezone
from typing import Optional

import joblib
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(
    os.path.dirname(__file__)
)

MODEL_PATH = os.path.join(BASE_DIR, "models", "fan_model.pkl")
FEATURE_PATH = os.path.join(BASE_DIR, "models", "features.pkl")
LIGHT_MODEL_PATH = os.path.join(BASE_DIR, "models", "light_model.pkl")
LIGHT_FEATURE_PATH = os.path.join(BASE_DIR, "models", "light_features.pkl")
CUSTOM_MODEL_DIR = os.path.join(BASE_DIR, "models", "custom", "auto_control")
LATEST_BUNDLE_PATH = os.path.join(CUSTOM_MODEL_DIR, "latest.json")

_DEFAULT_MODEL_FILES = (
    MODEL_PATH,
    FEATURE_PATH,
    LIGHT_MODEL_PATH,
    LIGHT_FEATURE_PATH,
)
_FAN_FEATURES = ["Air temperature (C)", "Relative humidity (%)"]
_LIGHT_FEATURES = ["Light", "Hour"]


def _truthy_env(name: str) -> bool:
    return os.getenv(name, "").strip().lower() in ("1", "true", "yes", "on")


def _inference_now() -> datetime:
    if _truthy_env("LIGHT_INFER_UTC"):
        return datetime.now(timezone.utc)
    return datetime.now()


def _inference_hour_fraction(now: Optional[datetime] = None) -> float:
    t = now if now is not None else _inference_now()
    return (
        float(t.hour)
        + t.minute / 60.0
        + t.second / 3600.0
        + t.microsecond / (3600.0 * 1e6)
    )


def _bundle_mtime_signature():
    files = _active_model_files()
    if not all(os.path.isfile(p) for p in files):
        return None
    manifest_mtime = os.path.getmtime(LATEST_BUNDLE_PATH) if os.path.isfile(LATEST_BUNDLE_PATH) else 0
    return tuple(files) + tuple(os.path.getmtime(p) for p in files) + (manifest_mtime,)


def _active_model_files():
    try:
        with open(LATEST_BUNDLE_PATH, "r", encoding="utf-8") as f:
            latest = json.load(f)
        files = (
            latest["fan_model_path"],
            latest["fan_feature_path"],
            latest["light_model_path"],
            latest["light_feature_path"],
        )
        if all(os.path.isfile(p) for p in files):
            return files
    except Exception:
        pass
    return _DEFAULT_MODEL_FILES


_model = None
_features = None
_light_model = None
_light_features = None
_bundle_signature = None


def _ensure_models_loaded():
    global _model, _features, _light_model, _light_features, _bundle_signature

    sig = _bundle_mtime_signature()
    if sig is None:
        files = _active_model_files()
        missing = [p for p in files if not os.path.isfile(p)]
        raise FileNotFoundError(
            "Missing model file(s): "
            + ", ".join(missing)
            + ". Run train.py first."
        )

    if _model is not None and sig == _bundle_signature:
        return

    model_path, feature_path, light_model_path, light_feature_path = _active_model_files()
    _model = joblib.load(model_path)
    _features = joblib.load(feature_path)
    _light_model = joblib.load(light_model_path)
    _light_features = joblib.load(light_feature_path)
    _bundle_signature = sig


def _binary_label(value):
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        s = str(value).strip().lower()
        if s in ("1", "true", "on", "yes"):
            return 1
        if s in ("0", "false", "off", "no"):
            return 0
    return None


def retrain_from_rows(rows: list) -> dict:
    global _model, _features, _light_model, _light_features, _bundle_signature

    if not isinstance(rows, list) or not rows:
        raise ValueError("No auto-control training rows were provided")

    df = pd.DataFrame(rows)
    required = ["temperature", "humidity", "light", "hour"]
    for col in required:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")
        df[col] = pd.to_numeric(df[col], errors="coerce")

    if "desired_fan_action" not in df.columns:
        df["desired_fan_action"] = None
    if "desired_light_action" not in df.columns:
        df["desired_light_action"] = None

    df["desired_fan_action"] = df["desired_fan_action"].map(_binary_label)
    df["desired_light_action"] = df["desired_light_action"].map(_binary_label)

    fan_df = df.dropna(subset=["temperature", "humidity", "desired_fan_action"])
    light_df = df.dropna(subset=["light", "hour", "desired_light_action"])
    if fan_df.empty or light_df.empty:
        raise ValueError(
            "Need at least one labeled fan sample and one labeled light sample to retrain"
        )

    fan_model = DecisionTreeClassifier(random_state=42)
    fan_model.fit(
        fan_df[["temperature", "humidity"]].rename(columns={
            "temperature": _FAN_FEATURES[0],
            "humidity": _FAN_FEATURES[1],
        }),
        fan_df["desired_fan_action"].astype(int),
    )

    light_model = DecisionTreeClassifier(random_state=42)
    light_model.fit(
        light_df[["light", "hour"]].rename(columns={
            "light": _LIGHT_FEATURES[0],
            "hour": _LIGHT_FEATURES[1],
        }),
        light_df["desired_light_action"].astype(int),
    )

    bundle_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    bundle_dir = os.path.join(CUSTOM_MODEL_DIR, bundle_id)
    os.makedirs(bundle_dir, exist_ok=True)
    fan_model_path = os.path.join(bundle_dir, "fan_model.pkl")
    fan_feature_path = os.path.join(bundle_dir, "features.pkl")
    light_model_path = os.path.join(bundle_dir, "light_model.pkl")
    light_feature_path = os.path.join(bundle_dir, "light_features.pkl")

    joblib.dump(fan_model, fan_model_path)
    joblib.dump(_FAN_FEATURES, fan_feature_path)
    joblib.dump(light_model, light_model_path)
    joblib.dump(_LIGHT_FEATURES, light_feature_path)

    latest = {
        "bundle_id": bundle_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "fan_model_path": fan_model_path,
        "fan_feature_path": fan_feature_path,
        "light_model_path": light_model_path,
        "light_feature_path": light_feature_path,
        "samples": {
            "fan": int(len(fan_df)),
            "light": int(len(light_df)),
        },
        "default_models_preserved": True,
    }
    os.makedirs(CUSTOM_MODEL_DIR, exist_ok=True)
    with open(LATEST_BUNDLE_PATH, "w", encoding="utf-8") as f:
        json.dump(latest, f, indent=2)

    _model = None
    _features = None
    _light_model = None
    _light_features = None
    _bundle_signature = None

    return {
        "success": True,
        "bundleId": bundle_id,
        "bundleDir": bundle_dir,
        "samples": latest["samples"],
        "latestManifest": LATEST_BUNDLE_PATH,
        "defaultModelsPreserved": True,
    }


def decide_fan(
    temperature: float,
    humidity: float,
    current_fan_state: bool
) -> dict:
    _ensure_models_loaded()

    x = pd.DataFrame(
        [[temperature, humidity]],
        columns=_features,
    )
    pred = _model.predict(x)[0]
    action = bool(pred)

    return {
        "action": "ON" if action else "OFF",
        "changed": action != current_fan_state,
        "reason": (
            f"ML prediction (temp={temperature}°C, humidity={humidity}%)"
        ),
    }


def decide_light(
    temperature: float,
    humidity: float,
    light_level: float,
    current_light_state: bool,
) -> dict:
    _ensure_models_loaded()

    row = [light_level]
    infer_now = None
    if _light_features and "Hour" in _light_features:
        infer_now = _inference_now()
        row.append(_inference_hour_fraction(infer_now))

    x = pd.DataFrame(
        [row],
        columns=_light_features,
    )
    pred = _light_model.predict(x)[0]
    action = bool(pred)

    inverted = _truthy_env("LIGHT_INVERT_OUTPUT")
    if inverted:
        action = not action

    suffix = " (output inverted)" if inverted else ""
    h_note = ""
    if infer_now is not None:
        tz_lbl = "UTC" if _truthy_env("LIGHT_INFER_UTC") else "local"
        h_note = (
            f" clock={infer_now.strftime('%H:%M:%S')} ({tz_lbl}), "
            f"hour_model={row[1]:.4f}h"
        )

    return {
        "action": "ON" if action else "OFF",
        "changed": action != current_light_state,
        "reason": (
            f"ML need-light={bool(pred)} -> "
            f"{'ON' if action else 'OFF'}"
            f"{suffix}; "
            f"lux={light_level}{h_note} "
            f"(ctx temp={temperature}°C humidity={humidity}%)"
        ),
    }


def process(sensor_data: dict, device_states: dict) -> dict:
    try:
        _ensure_models_loaded()
    except FileNotFoundError as e:
        return {
            "error": str(e),
            "fan": {
                "action": "OFF",
                "changed": False,
                "reason": "Models not available",
            },
            "light": {
                "action": "OFF",
                "changed": False,
                "reason": "Models not available",
            },
        }

    temperature = float(sensor_data.get("temperature", 25.0))
    humidity = float(sensor_data.get("humidity", 50.0))
    light_level = float(sensor_data.get("light", 400))

    fan_state = device_states.get("fan", False)
    light_state = device_states.get("light", False)

    return {
        "fan": decide_fan(temperature, humidity, fan_state),
        "light": decide_light(
            temperature,
            humidity,
            light_level,
            light_state,
        ),
    }
