from datetime import datetime, timezone

def success_response(data, count=None):
    meta = {"timestamp": datetime.now(timezone.utc).isoformat()}
    if count is not None:
        meta["count"] = count
    
    return {
        "status": "success",
        "data": data,
        "meta": meta
    }

def error_response(message="An error occurred", status_code=400):
    return {
        "status": "error",
        "message": message
    }, status_code
