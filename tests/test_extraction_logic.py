def test_transcripts_endpoint_returns_seeded_calls(client):
    response = client.get('/api/transcripts')

    assert response.status_code == 200
    body = response.get_json()
    assert body['status'] == 'success'
    assert body['data']['calls']
    first_call = body['data']['calls'][0]
    assert 'messages' in first_call
    assert first_call['messages']
