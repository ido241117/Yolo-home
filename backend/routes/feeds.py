from flask import Blueprint, jsonify, request
from utils.adafruit import get_feeds_from_blocks, send_feed_data, get_dashboard_blocks

feeds_bp = Blueprint("feeds", __name__)


@feeds_bp.route("/feeds", methods=["GET"])
def list_feeds():
    """Returns all feeds with last_value, extracted from dashboard blocks."""
    data = get_feeds_from_blocks()
    return jsonify(data)


@feeds_bp.route("/feeds/<feed_key>/data", methods=["GET"])
def feed_data(feed_key):
    """Returns last_value only — Bong_Bong feed history is private."""
    feeds = get_feeds_from_blocks()
    match = next((f for f in feeds if f["key"] == feed_key), None)
    if not match:
        return jsonify({"error": f"Feed '{feed_key}' not found"}), 404
    return jsonify([{"value": match["last_value"]}])


@feeds_bp.route("/feeds/<feed_key>/data", methods=["POST"])
def send_data(feed_key):
    body = request.get_json()
    value = str(body.get("value", ""))
    try:
        result = send_feed_data(feed_key, value)
        return jsonify(result)
    except Exception as e:
        msg = str(e)
        if "404" in msg:
            return jsonify({
                "error": "permission_denied",
                "message": f"Không có quyền ghi vào feed '{feed_key}' của Bong_Bong. Cần API key của account đó."
            }), 403
        return jsonify({"error": "adafruit_error", "message": msg}), 502


@feeds_bp.route("/dashboard/blocks", methods=["GET"])
def dashboard_blocks():
    data = get_dashboard_blocks()
    if not isinstance(data, list):
        data = [data]
    return jsonify(data)
