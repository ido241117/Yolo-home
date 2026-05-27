def send_feed_data(feed_key, value):
    return {
        "success": True,
        "skipped": True,
        "feed_key": feed_key,
        "value": value,
        "message": "Hardware commands are handled by NestJS.",
    }
