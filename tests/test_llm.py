import json

from backend.services import manager_chat


class _FakeOllamaResponse:
    def __init__(self, payload: dict):
        self._payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return {"response": json.dumps(self._payload)}


def test_chat_history_endpoint_tracks_messages(client, monkeypatch):
    session_id = "history-test"

    def fake_post(*_args, **_kwargs):
        return _FakeOllamaResponse(
            {
                "intent": "combo_recommendation",
                "reply": "Promote your strongest side-and-drink bundle during the dinner rush.",
                "data": {"combo": "Fries and Coke"},
                "recommendation": "Feature it in your phone script and menu highlights tonight.",
            }
        )

    monkeypatch.setattr(manager_chat.requests, "post", fake_post)

    chat_response = client.post("/voice/chat", json={"session_id": session_id, "message": "Which combos should I promote?"})

    assert chat_response.status_code == 200

    history_response = client.get(f"/voice/history/{session_id}")
    assert history_response.status_code == 200

    body = history_response.get_json()
    assert body["status"] == "success"
    assert len(body["data"]["messages"]) >= 2
    assert body["data"]["messages"][-1]["content"] == "Promote your strongest side-and-drink bundle during the dinner rush."
