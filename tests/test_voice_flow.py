import json

from backend.services import manager_chat


class _FakeOllamaResponse:
    def __init__(self, payload: dict):
        self._payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return {"response": json.dumps(self._payload)}


def test_voice_chat_returns_direct_manager_response(client, monkeypatch):
    def fake_post(*_args, **_kwargs):
        return _FakeOllamaResponse(
            {
                "intent": "holiday_demand_patterns",
                "reply": (
                    "Valentine's Day usually brings couples in because dining out feels like a special occasion "
                    "and gives them an atmosphere they cannot easily recreate at home."
                ),
                "data": {"occasion": "Valentine's Day"},
                "recommendation": "",
            }
        )

    monkeypatch.setattr(manager_chat.requests, "post", fake_post)

    response = client.post(
        "/voice/chat",
        json={"session_id": "voice-test", "message": "why do couples come to my restaurant on valentine's day?"},
    )

    assert response.status_code == 200
    body = response.get_json()
    assert body["status"] == "success"
    assert body["data"]["response"]["intent"] == "holiday_demand_patterns"
    assert body["data"]["response"]["reply"]
    assert "The user is asking" not in body["data"]["response"]["reply"]
    assert body["data"]["response"]["recommendation"] == ""
