def test_dashboard_and_mutation_endpoints(client):
    analytics_response = client.get('/api/analytics')
    assert analytics_response.status_code == 200
    assert analytics_response.get_json()['status'] == 'success'

    inventory_response = client.get('/api/inventory')
    assert inventory_response.status_code == 200
    assert inventory_response.get_json()['data']['pantryBreakdown']

    settings_response = client.put('/api/settings', json={'autoOrderTaking': True, 'maxHoldTime': '5 minutes'})
    assert settings_response.status_code == 200
    assert settings_response.get_json()['data']['settings']['autoOrderTaking'] is True

    discount_response = client.post('/api/rewards/discounts', json={'name': 'Pytest Discount', 'type': 'Percentage', 'value': '12', 'conditions': 'All customers', 'usageLimit': '10'})
    assert discount_response.status_code == 201

    combo_response = client.post('/api/combos', json={'name': 'Pytest Combo', 'items': ['Classic Burger', 'Fries'], 'price': 14.5, 'discount': 10, 'targetAudience': 'Testers'})
    assert combo_response.status_code == 201

    holiday_response = client.post('/api/holidays', json={'name': 'Pytest Holiday', 'date': '2026-12-31', 'openingTime': '09:00', 'closingTime': '20:00', 'promotion': 'Test event promo'})
    assert holiday_response.status_code == 201
