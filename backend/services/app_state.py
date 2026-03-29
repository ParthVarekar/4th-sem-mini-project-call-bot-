from __future__ import annotations

import json
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any, Callable

from backend.services.data_loader import (
    get_ai_structured_insights,
    load_call_logs,
    load_combo_meals,
    load_customers,
    load_holiday_schedule,
    load_menu_items,
    load_orders,
)

DATA_DIR = Path(__file__).resolve().parents[1] / 'data'

DEFAULT_SETTINGS = {
    'autoReservation': True,
    'autoOrderTaking': False,
    'aiUpselling': True,
    'callRecording': True,
    'voiceType': 'Female - Friendly (Sarah)',
    'maxHoldTime': '2 minutes',
}

DEFAULT_DISCOUNTS = [
    {
        'id': 1,
        'name': 'Loyal Customer 10%',
        'type': 'Percentage',
        'value': '10%',
        'conditions': '3+ visits/month',
        'active': True,
        'used': 58,
        'usageLimit': 120,
    },
    {
        'id': 2,
        'name': 'First Order Welcome',
        'type': 'Fixed Amount',
        'value': '$5',
        'conditions': 'New customers only',
        'active': True,
        'used': 34,
        'usageLimit': 75,
    },
    {
        'id': 3,
        'name': 'Weekend Combo Deal',
        'type': 'Percentage',
        'value': '15%',
        'conditions': 'Sat-Sun combo orders',
        'active': True,
        'used': 91,
        'usageLimit': 150,
    },
    {
        'id': 4,
        'name': 'Birthday Special',
        'type': 'Fixed Amount',
        'value': '$10',
        'conditions': 'Birthday month',
        'active': False,
        'used': 12,
        'usageLimit': 30,
    },
]


def _storage_path(name: str) -> Path:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    return DATA_DIR / name


def _read_storage(name: str, default: Any = None, seed_factory: Callable[[], Any] | None = None) -> Any:
    path = _storage_path(name)
    if path.exists():
        try:
            return json.loads(path.read_text(encoding='utf-8'))
        except json.JSONDecodeError:
            pass

    if seed_factory is not None:
        payload = seed_factory()
    elif default is not None:
        payload = default
    else:
        payload = {}

    path.write_text(json.dumps(payload, indent=2), encoding='utf-8')
    return payload


def _write_storage(name: str, payload: Any) -> Any:
    path = _storage_path(name)
    path.write_text(json.dumps(payload, indent=2), encoding='utf-8')
    return payload


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _phone_from_seed(seed: int) -> str:
    digits = str(seed).zfill(7)[-7:]
    return f'(555) {digits[:3]}-{digits[3:]}'


def _format_duration(seconds: int) -> str:
    minutes, remaining = divmod(max(0, seconds), 60)
    return f'{minutes}:{remaining:02d}'


def _tier_from_call_count(call_count: int) -> str:
    if call_count >= 30:
        return 'Platinum'
    if call_count >= 20:
        return 'Gold'
    if call_count >= 10:
        return 'Silver'
    return 'Bronze'


def build_inventory_snapshot() -> dict[str, Any]:
    orders = load_orders()
    menu_items = load_menu_items()
    menu_lookup = {item['name']: item for item in menu_items}
    item_counts: Counter[str] = Counter()
    category_counts: Counter[str] = Counter()

    for order in orders:
        for item_name in order.get('items', []):
            item_counts[item_name] += 1
            category = menu_lookup.get(item_name, {}).get('category', 'other').lower()
            category_counts[category] += 1

    total_category_events = sum(category_counts.values()) or 1

    pantry_demand = {
        'Vegetables': category_counts.get('salad', 0) + category_counts.get('wrap', 0),
        'Fruits': category_counts.get('beverage', 0) + category_counts.get('dessert', 0),
        'Meat & Dairy': category_counts.get('burger', 0) + category_counts.get('pizza', 0),
        'Dry Goods': category_counts.get('pasta', 0) + category_counts.get('appetizer', 0) + category_counts.get('side', 0),
    }

    pantry_breakdown = []
    for label, demand in pantry_demand.items():
        ratio = demand / total_category_events
        remaining = max(24, min(92, int(86 - ratio * 140)))
        pantry_breakdown.append({'label': label, 'value': remaining})

    menu_performance = []
    for name, count in item_counts.most_common(3):
        category = menu_lookup.get(name, {}).get('category', 'signature').title()
        menu_performance.append({'name': name, 'category': category, 'count': count})

    return {
        'pantryBreakdown': pantry_breakdown,
        'menuPerformance': menu_performance,
        'generatedAt': datetime.utcnow().isoformat() + 'Z',
    }


def get_inventory_snapshot() -> dict[str, Any]:
    return _read_storage('inventory_snapshot.json', seed_factory=build_inventory_snapshot)


def _call_status(log: dict[str, Any]) -> str:
    if _safe_int(log.get('call_duration')) < 90 and not log.get('order_value'):
        return 'Missed'
    return 'Completed'


def _transcript_messages(topic: str, customer_name: str, timestamp_label: str, order_value: float | None) -> list[dict[str, str]]:
    topic_normalized = (topic or 'General Inquiry').lower()

    if 'reservation' in topic_normalized:
        return [
            {'sender': 'AI', 'text': 'Hello, thanks for calling ChefAI dining support. How can I help today?', 'time': timestamp_label},
            {'sender': 'Customer', 'text': f'Hi, this is {customer_name}. I would like to make a dinner reservation.', 'time': timestamp_label},
            {'sender': 'AI', 'text': 'Absolutely. I can help lock in a table and note any special seating needs.', 'time': timestamp_label},
            {'sender': 'Customer', 'text': 'A window table this evening would be perfect if one is available.', 'time': timestamp_label},
            {'sender': 'AI', 'text': 'Done. I have placed the reservation request and flagged it for the host team.', 'time': timestamp_label},
        ]

    if 'order' in topic_normalized:
        total = f'${order_value:.2f}' if order_value else 'your usual basket value'
        return [
            {'sender': 'AI', 'text': 'ChefAI order desk here. What would you like to place today?', 'time': timestamp_label},
            {'sender': 'Customer', 'text': f'I am calling to place a delivery order, this is {customer_name}.', 'time': timestamp_label},
            {'sender': 'AI', 'text': f'Great. I have built the order and the estimated total is {total}.', 'time': timestamp_label},
            {'sender': 'Customer', 'text': 'That works for me. Please go ahead and confirm it.', 'time': timestamp_label},
            {'sender': 'AI', 'text': 'Confirmed. The kitchen has the ticket and delivery prep is underway.', 'time': timestamp_label},
        ]

    if 'complaint' in topic_normalized:
        return [
            {'sender': 'AI', 'text': 'I am sorry something went wrong. Tell me what happened and I will log it for the manager.', 'time': timestamp_label},
            {'sender': 'Customer', 'text': f'This is {customer_name}. I had an issue with my last order and want it reviewed.', 'time': timestamp_label},
            {'sender': 'AI', 'text': 'Thank you for flagging it. I have captured the concern and escalated it for follow-up.', 'time': timestamp_label},
            {'sender': 'Customer', 'text': 'I appreciate the quick response.', 'time': timestamp_label},
            {'sender': 'AI', 'text': 'You are welcome. A team member will reach out with a resolution shortly.', 'time': timestamp_label},
        ]

    return [
        {'sender': 'AI', 'text': 'ChefAI support desk here. How can I help today?', 'time': timestamp_label},
        {'sender': 'Customer', 'text': f'Hi, this is {customer_name}. I have a quick question about the restaurant.', 'time': timestamp_label},
        {'sender': 'AI', 'text': 'Happy to help. I have logged the request and shared the details with the team.', 'time': timestamp_label},
    ]


def build_transcripts() -> list[dict[str, Any]]:
    customers = load_customers()
    customer_lookup = {customer['name'].strip().lower(): customer for customer in customers}
    transcripts = []

    for log in load_call_logs()[:20]:
        customer_name = (log.get('customer_name') or 'Unknown Caller').strip()
        matched_customer = customer_lookup.get(customer_name.lower())
        call_count = matched_customer.get('visit_count') if matched_customer else (log['call_id'] % 18) + 2
        tier = matched_customer.get('tier') if matched_customer else _tier_from_call_count(call_count)
        phone_seed = matched_customer.get('customer_id') if matched_customer else log['call_id'] * 17
        timestamp = datetime.fromisoformat(log['timestamp'])
        order_value = _safe_float(log.get('order_value'), None)
        timestamp_label = timestamp.strftime('%I:%M %p').lstrip('0')

        transcripts.append(
            {
                'id': log['call_id'],
                'customer': customer_name,
                'phone': _phone_from_seed(_safe_int(phone_seed, log['call_id'])),
                'time': timestamp_label,
                'timestamp': log['timestamp'],
                'duration': _format_duration(_safe_int(log.get('call_duration'))),
                'status': _call_status(log),
                'type': log.get('call_topic') or 'Inquiry',
                'callCount': call_count,
                'tier': tier,
                'summary': f"{log.get('call_topic') or 'Inquiry'} call handled on {timestamp.strftime('%b %d')}",
                'messages': _transcript_messages(log.get('call_topic', ''), customer_name, timestamp_label, order_value),
            }
        )

    return transcripts


def get_transcripts() -> list[dict[str, Any]]:
    return _read_storage('ui_transcripts.json', seed_factory=build_transcripts)


def get_discount_catalog() -> list[dict[str, Any]]:
    return _read_storage('discounts.json', default=DEFAULT_DISCOUNTS)


def add_discount(payload: dict[str, Any]) -> dict[str, Any]:
    discounts = get_discount_catalog()
    next_id = max((item['id'] for item in discounts), default=0) + 1
    discount_type = payload.get('type', 'Percentage')
    raw_value = str(payload.get('value', '')).strip()
    formatted_value = raw_value
    if discount_type == 'Percentage' and raw_value and not raw_value.endswith('%'):
        formatted_value = f'{raw_value}%'
    if discount_type == 'Fixed Amount' and raw_value and not raw_value.startswith('$'):
        formatted_value = f'${raw_value}'

    new_discount = {
        'id': next_id,
        'name': payload.get('name', 'New Discount').strip() or 'New Discount',
        'type': discount_type,
        'value': formatted_value,
        'conditions': payload.get('conditions', 'All customers'),
        'active': bool(payload.get('active', True)),
        'used': 0,
        'usageLimit': _safe_int(payload.get('usageLimit'), 100),
    }
    discounts.append(new_discount)
    _write_storage('discounts.json', discounts)
    return new_discount


def delete_discount(discount_id: int) -> bool:
    discounts = get_discount_catalog()
    remaining = [discount for discount in discounts if _safe_int(discount.get('id')) != discount_id]
    if len(remaining) == len(discounts):
        return False
    _write_storage('discounts.json', remaining)
    return True


def _map_combo_row(row: dict[str, Any]) -> dict[str, Any]:
    return {
        'id': row['combo_id'],
        'name': row['name'],
        'items': row.get('items', []),
        'price': round(_safe_float(row.get('price')), 2),
        'discount': 15,
        'popularity': _safe_int(row.get('popularity_score'), 70) * 10,
        'revenue': int(_safe_float(row.get('price')) * max(_safe_int(row.get('popularity_score'), 1), 1) * 22),
        'timesOrdered': _safe_int(row.get('popularity_score'), 1) * 8,
        'targetAudience': 'Repeat customers',
        'active': True,
    }


def get_combo_catalog() -> list[dict[str, Any]]:
    base_combos = [_map_combo_row(combo) for combo in load_combo_meals()]
    custom_combos = _read_storage('custom_combos.json', default=[])
    merged = {combo['id']: combo for combo in base_combos}
    for combo in custom_combos:
        merged[combo['id']] = combo
    return list(sorted(merged.values(), key=lambda combo: combo['id']))


def upsert_combo(payload: dict[str, Any]) -> dict[str, Any]:
    custom_combos = _read_storage('custom_combos.json', default=[])
    existing_ids = {combo['id'] for combo in get_combo_catalog()}
    combo_id = _safe_int(payload.get('id'))
    if combo_id <= 0 or combo_id not in existing_ids:
        combo_id = max(existing_ids, default=0) + 1

    combo_record = {
        'id': combo_id,
        'name': payload.get('name', 'New Combo').strip() or 'New Combo',
        'items': [item for item in payload.get('items', []) if str(item).strip()],
        'price': round(_safe_float(payload.get('price'), 0.0), 2),
        'discount': _safe_int(payload.get('discount'), 0),
        'popularity': _safe_int(payload.get('popularity'), 72),
        'revenue': _safe_int(payload.get('revenue'), 0),
        'timesOrdered': _safe_int(payload.get('timesOrdered'), 0),
        'targetAudience': payload.get('targetAudience', 'All customers'),
        'active': bool(payload.get('active', True)),
    }

    updated = False
    for index, combo in enumerate(custom_combos):
        if _safe_int(combo.get('id')) == combo_id:
            custom_combos[index] = combo_record
            updated = True
            break

    if not updated:
        custom_combos.append(combo_record)

    _write_storage('custom_combos.json', custom_combos)
    return combo_record


def get_repeat_customer_recommendations() -> list[dict[str, Any]]:
    orders = load_orders()
    customers = {customer['customer_id']: customer for customer in load_customers()}
    customer_orders: dict[int, list[dict[str, Any]]] = {}

    for order in orders:
        customer_id = _safe_int(order.get('customer_id'))
        if customer_id <= 0:
            continue
        customer_orders.setdefault(customer_id, []).append(order)

    recommendations = []
    for customer_id, grouped_orders in sorted(customer_orders.items(), key=lambda entry: len(entry[1]), reverse=True)[:5]:
        item_counter: Counter[str] = Counter()
        revenue = 0.0
        for order in grouped_orders:
            item_counter.update(order.get('items', []))
            revenue += _safe_float(order.get('price'))

        top_items = [item for item, _count in item_counter.most_common(3)]
        recommendations.append(
            {
                'id': customer_id,
                'name': customers.get(customer_id, {}).get('name', f'Customer {customer_id}'),
                'orders': len(grouped_orders),
                'suggestedCombo': f"{top_items[0]} Combo" if top_items else 'Chef Special Combo',
                'orderHistory': top_items,
                'potentialRevenue': round(revenue * 0.15, 2),
            }
        )

    return recommendations


def _traffic_impact(label: str) -> int:
    mapping = {'Low': 25, 'Medium': 45, 'High': 72, 'Very High': 92}
    return mapping.get((label or 'Medium').title(), 40)


def _seed_holidays() -> list[dict[str, Any]]:
    holidays = []
    for index, holiday in enumerate(load_holiday_schedule(), start=1):
        impact = _traffic_impact(holiday.get('expected_traffic', 'Medium'))
        holidays.append(
            {
                'id': index,
                'title': holiday.get('event', f'Holiday {index}'),
                'date': holiday.get('date'),
                'type': 'holiday',
                'status': 'published',
                'callVolumeImpact': impact,
                'aiRecommendations': [holiday.get('staffing_tip', 'Adjust staffing for expected traffic')],
                'affectedSchedules': [
                    {
                        'time': '10:00 AM - 10:00 PM',
                        'action': 'Adjust staffing for expected traffic',
                    }
                ],
                'expectedRevenue': int(2200 * (1 + impact / 120)),
                'lastYearRevenue': int(1850 * (1 + impact / 150)),
            }
        )
    return holidays


def get_holiday_events() -> list[dict[str, Any]]:
    base_holidays = _seed_holidays()
    custom_holidays = _read_storage('custom_holidays.json', default=[])
    merged = {holiday['id']: holiday for holiday in base_holidays}
    for holiday in custom_holidays:
        merged[holiday['id']] = holiday
    return list(sorted(merged.values(), key=lambda holiday: holiday['date']))


def add_or_update_holiday(payload: dict[str, Any]) -> dict[str, Any]:
    custom_holidays = _read_storage('custom_holidays.json', default=[])
    existing_ids = {holiday['id'] for holiday in get_holiday_events()}
    holiday_id = _safe_int(payload.get('id'))
    if holiday_id <= 0 or holiday_id not in existing_ids:
        holiday_id = max(existing_ids, default=0) + 1

    opening_time = payload.get('openingTime', '10:00')
    closing_time = payload.get('closingTime', '22:00')
    promotion = payload.get('promotion', '').strip()
    event_name = payload.get('name') or payload.get('title') or 'Custom Event'

    holiday_record = {
        'id': holiday_id,
        'title': event_name,
        'date': payload.get('date'),
        'type': payload.get('type', 'custom'),
        'status': payload.get('status', 'published'),
        'callVolumeImpact': _safe_int(payload.get('callVolumeImpact'), 48),
        'aiRecommendations': [promotion] if promotion else [f'Promote {event_name} one week in advance.'],
        'affectedSchedules': [
            {
                'time': f"{opening_time} - {closing_time}",
                'action': 'Holiday hours and staffing adjustment',
            }
        ],
        'expectedRevenue': _safe_int(payload.get('expectedRevenue'), 3200),
        'lastYearRevenue': _safe_int(payload.get('lastYearRevenue'), 2600),
    }

    updated = False
    for index, holiday in enumerate(custom_holidays):
        if _safe_int(holiday.get('id')) == holiday_id:
            custom_holidays[index] = holiday_record
            updated = True
            break

    if not updated:
        custom_holidays.append(holiday_record)

    _write_storage('custom_holidays.json', custom_holidays)
    return holiday_record


def delete_holiday(holiday_id: int) -> bool:
    custom_holidays = _read_storage('custom_holidays.json', default=[])
    remaining = [holiday for holiday in custom_holidays if _safe_int(holiday.get('id')) != holiday_id]
    if len(remaining) == len(custom_holidays):
        return False
    _write_storage('custom_holidays.json', remaining)
    return True


def get_settings() -> dict[str, Any]:
    return _read_storage('settings.json', default=DEFAULT_SETTINGS)


def save_settings(payload: dict[str, Any]) -> dict[str, Any]:
    settings = get_settings()
    settings.update(payload)
    _write_storage('settings.json', settings)
    return settings


def get_chat_history(session_id: str) -> list[dict[str, Any]]:
    sessions = _read_storage('chat_sessions.json', default={})
    return sessions.get(session_id, [])


def append_chat_message(session_id: str, role: str, content: str, payload: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    sessions = _read_storage('chat_sessions.json', default={})
    history = sessions.get(session_id, [])
    history.append(
        {
            'role': role,
            'content': content,
            'payload': payload or {},
            'timestamp': datetime.utcnow().isoformat() + 'Z',
        }
    )
    sessions[session_id] = history[-20:]
    _write_storage('chat_sessions.json', sessions)
    return sessions[session_id]


def get_discount_revenue(customers: list[dict[str, Any]], discounts: list[dict[str, Any]]) -> float:
    active_discounts = [discount for discount in discounts if discount.get('active')]
    if not active_discounts:
        return 0.0
    return round(sum(customer.get('points', 0) for customer in customers[:10]) * 0.6, 2)


def get_ai_summary_cards() -> list[dict[str, Any]]:
    insights = get_ai_structured_insights() or {}
    cards = []
    for index, insight in enumerate(insights.get('structured_insights', []), start=1):
        cards.append({'id': index, **insight})
    return cards
