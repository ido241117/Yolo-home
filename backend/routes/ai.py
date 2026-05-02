from flask import Blueprint, jsonify, request
from ai.auto_control import process as auto_control_process
from ai.recognition import recognize_face, recognize_voice

ai_bp = Blueprint("ai", __name__)


@ai_bp.route("/ai/auto-control", methods=["POST"])
def auto_control():
    body = request.get_json()
    sensor_data = body.get("sensor_data", {})
    device_states = body.get("device_states", {})
    result = auto_control_process(sensor_data, device_states)
    return jsonify(result)


@ai_bp.route("/ai/face-recognition", methods=["POST"])
def face_recognition():
    body = request.get_json()
    image_data = body.get("image", None)
    result = recognize_face(image_data)
    return jsonify(result)


@ai_bp.route("/ai/voice-recognition", methods=["POST"])
def voice_recognition():
    body = request.get_json()
    audio_data = body.get("audio", None)
    result = recognize_voice(audio_data)
    return jsonify(result)
