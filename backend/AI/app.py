import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

from ai.auto_control import process as auto_control_process
from ai.face_ai import (
    delete_registered_face,
    list_registered_faces_for_room,
    recognize_face_image,
    register_face,
    register_face_batch,
    train_face_model,
)


load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)
CORS(app)


def _body():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


@app.get("/ai/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "dadn-python-ai",
        "models": {
            "fan": os.path.exists(os.path.join(BASE_DIR, "models", "fan_model.pkl")),
            "light": os.path.exists(os.path.join(BASE_DIR, "models", "light_model.pkl")),
            "face": os.path.exists(os.path.join(BASE_DIR, "models", "face_model.pkl")),
        },
    })


@app.post("/ai/auto-control/predict")
def predict_auto_control():
    body = _body()
    sensor_data = body.get("sensor_data") or body.get("sensorData") or {
        "temperature": body.get("temperature", body.get("temp", 25.0)),
        "humidity": body.get("humidity", body.get("humi", 50.0)),
        "light": body.get("light", body.get("lux", 400)),
    }
    device_states = body.get("device_states") or body.get("deviceStates") or {
        "fan": body.get("fan", False),
        "light": body.get("lightState", body.get("led", False)),
    }
    return jsonify(auto_control_process(sensor_data, device_states))


@app.post("/ai/face/recognize")
def recognize_face():
    body = _body()
    image_file = request.files.get("image") if request.files else None
    result = recognize_face_image(
        image_data=body.get("image"),
        image_file=image_file,
        room_id=body.get("roomId"),
        open_door=bool(body.get("openDoor", False)),
    )
    return jsonify({
        **result,
        "roomId": body.get("roomId"),
    }), 200 if result.get("success") else 400


@app.post("/ai/face/register")
def register_face_label():
    body = _body()
    image_file = request.files.get("image") if request.files else None
    try:
        if isinstance(body.get("images"), list):
            result = register_face_batch(
                label=body.get("label"),
                images=body.get("images"),
                room_id=body.get("roomId"),
            )
        else:
            result = register_face(
                label=body.get("label"),
                image_data=body.get("image"),
                image_file=image_file,
                room_id=body.get("roomId"),
            )
        return jsonify({**result, "roomId": body.get("roomId")})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc), "roomId": body.get("roomId")}), 400


@app.get("/ai/face/labels")
def list_face_labels():
    room_id = request.args.get("roomId")
    return jsonify({
        "success": True,
        "roomId": room_id,
        "labels": list_registered_faces_for_room(room_id),
    })


@app.delete("/ai/face/labels/<label>")
def delete_face_label(label):
    room_id = request.args.get("roomId")
    try:
        result = delete_registered_face(label, room_id=room_id)
        return jsonify({**result, "roomId": room_id})
    except FileNotFoundError as exc:
        return jsonify({"success": False, "error": str(exc), "roomId": room_id}), 404
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc), "roomId": room_id}), 400


@app.post("/ai/face/retrain")
def retrain_faces():
    body = _body()
    try:
        result = train_face_model(room_id=body.get("roomId"))
        return jsonify({**result, "roomId": body.get("roomId")})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc), "roomId": body.get("roomId")}), 400


if __name__ == "__main__":
    port = int(os.getenv("AI_PORT", "8001"))
    host = os.getenv("AI_HOST", "0.0.0.0")
    app.run(host=host, port=port, debug=os.getenv("AI_DEBUG", "0") == "1")
