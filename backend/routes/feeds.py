from flask import Blueprint, jsonify, request
from utils.adafruit import get_feeds_from_blocks, send_feed_data, get_dashboard_blocks, get_feed_history

feeds_bp = Blueprint("feeds", __name__)


@feeds_bp.route("/feeds", methods=["GET"])
def list_feeds():
    """Returns all feeds with last_value, extracted from dashboard blocks."""
    data = get_feeds_from_blocks()
    return jsonify(data)


@feeds_bp.route("/feeds/<feed_key>/data", methods=["GET"])
def feed_data(feed_key):
    """Returns historical data points for a feed from Adafruit IO."""
    limit = request.args.get("limit", 100, type=int)
    try:
        data = get_feed_history(feed_key, limit)
        # Adafruit returns a list of {id, value, created_at, ...}
        return jsonify(data if isinstance(data, list) else [])
    except Exception as e:
        msg = str(e)
        if "404" in msg:
            return jsonify({"error": "not_found", "message": f"Feed '{feed_key}' not found"}), 404
        if "401" in msg or "403" in msg:
            return jsonify({"error": "permission_denied", "message": "No access to this feed history"}), 403
        return jsonify({"error": "adafruit_error", "message": msg}), 502


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
