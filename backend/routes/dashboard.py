from collections import Counter
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request

from backend.services.app_state import (
    add_discount,
    add_or_update_holiday,
    append_chat_message,
    delete_discount,
    delete_holiday,
    get_combo_catalog,
    get_discount_catalog,
    get_holiday_events,
    get_inventory_snapshot,
    get_repeat_customer_recommendations,
    get_settings,
    get_transcripts,
    save_settings,
    upsert_combo,
)
from backend.services.data_loader import load_call_logs, load_customers, load_menu_items, load_orders
from backend.utils.response import error_response, success_response


dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api')


def _error(message: str, status_code: int = 400):
    payload, code = error_response(message, status_code)
    return jsonify(payload), code


@dashboard_bp.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    try:
        orders = load_orders()
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)
        recent_orders = [order for order in orders if datetime.fromisoformat(order['timestamp']) >= start_date]

        total_orders = len(recent_orders)
        revenue = sum(order['price'] for order in recent_orders)
        avg_order_value = revenue / total_orders if total_orders else 0

        weekly_orders_lookup = Counter()
        for offset in range(7):
            weekly_orders_lookup[(start_date + timedelta(days=offset)).strftime('%a')] = 0
        for order in recent_orders:
            weekly_orders_lookup[datetime.fromisoformat(order['timestamp']).strftime('%a')] += 1
        weekly_orders = [{'name': day, 'orders': count} for day, count in weekly_orders_lookup.items()]

        order_types = Counter()
        for order in recent_orders:
            raw_order_type = (order.get('order_type') or 'takeout').lower()
            label = 'Delivery' if raw_order_type == 'delivery' else 'Takeout'
            order_types[label] += 1

        type_total = sum(order_types.values()) or 1
        regional_activity = [
            {'name': label, 'value': round(count / type_total * 100)}
            for label, count in order_types.items()
        ]

        inventory = get_inventory_snapshot()
        takeout_percentage = next((item['value'] for item in regional_activity if item['name'] == 'Takeout'), 0)
        delivery_percentage = next((item['value'] for item in regional_activity if item['name'] == 'Delivery'), 0)

        return jsonify(
            success_response(
                {
                    'kpis': {
                        'totalOrders': total_orders,
                        'totalRevenue': round(revenue, 2),
                        'avgOrderValue': round(avg_order_value, 2),
                        'takeoutPercentage': takeout_percentage,
                        'deliveryPercentage': delivery_percentage,
                    },
                    'weekly_orders': weekly_orders,
                    'regional_activity': regional_activity,
                    'pantry_breakdown': inventory['pantryBreakdown'],
                    'menu_performance': inventory['menuPerformance'],
                }
            )
        )
    except Exception as exc:
        return _error(str(exc), 500)


@dashboard_bp.route('/analytics', methods=['GET'])
def get_analytics():
    try:
        call_logs = load_call_logs()
        orders = load_orders()

        end_time = datetime.now()
        start_time = end_time - timedelta(hours=14)
        recent_calls = [call for call in call_logs if datetime.fromisoformat(call['timestamp']) >= start_time]

        volume_lookup = Counter()
        for offset in range(14):
            volume_lookup[(start_time + timedelta(hours=offset)).strftime('%H:00')] = 0
        for call in recent_calls:
            volume_lookup[datetime.fromisoformat(call['timestamp']).strftime('%H:00')] += 1
        volume = [{'time': label, 'calls': count} for label, count in volume_lookup.items()]

        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)
        week_orders = [order for order in orders if datetime.fromisoformat(order['timestamp']) >= start_date]
        peaks_lookup = {
            (start_date + timedelta(days=offset)).strftime('%a'): {'morning': 0, 'evening': 0}
            for offset in range(7)
        }
        for order in week_orders:
            timestamp = datetime.fromisoformat(order['timestamp'])
            day = timestamp.strftime('%a')
            if 6 <= timestamp.hour < 16:
                peaks_lookup[day]['morning'] += 1
            elif 16 <= timestamp.hour <= 23:
                peaks_lookup[day]['evening'] += 1
        peaks = [{'day': day, **bucket} for day, bucket in peaks_lookup.items()]

        trends = []
        for index in range(4):
            week_start = end_date - timedelta(days=(index + 1) * 7)
            week_end = end_date - timedelta(days=index * 7)
            bucket = [order for order in orders if week_start <= datetime.fromisoformat(order['timestamp']) < week_end]
            trends.insert(
                0,
                {
                    'name': f'Week {4 - index}',
                    'orders': len(bucket),
                    'revenue': round(sum(order['price'] for order in bucket), 2),
                },
            )

        total_calls = len(call_logs)
        completed_calls = sum(1 for call in call_logs if int(call.get('call_duration', 0)) >= 90 or call.get('order_value'))
        avg_duration_seconds = round(
            sum(int(call.get('call_duration', 0)) for call in call_logs) / total_calls, 1
        ) if total_calls else 0
        revenue_from_calls = round(
            sum(float(call['order_value']) for call in call_logs if call.get('order_value')), 2
        )

        return jsonify(
            success_response(
                {
                    'volume': volume,
                    'peaks': peaks,
                    'trends': trends,
                    'kpis': {
                        'totalCalls': total_calls,
                        'completedCalls': completed_calls,
                        'avgCallDurationSeconds': avg_duration_seconds,
                        'linkedOrderRevenue': revenue_from_calls,
                    },
                }
            )
        )
    except Exception as exc:
        return _error(str(exc), 500)


@dashboard_bp.route('/orders', methods=['GET'])
def get_orders():
    try:
        orders = load_orders()
        recent_orders = [
            {
                'id': order['order_id'],
                'items': order['items'],
                'price': order['price'],
                'time': datetime.fromisoformat(order['timestamp']).strftime('%H:%M'),
            }
            for order in orders[:50]
        ]
        return jsonify(success_response({'orders': recent_orders}, count=len(recent_orders)))
    except Exception as exc:
        return _error(str(exc), 500)


@dashboard_bp.route('/inventory', methods=['GET'])
def get_inventory():
    try:
        inventory = get_inventory_snapshot()
        return jsonify(success_response(inventory))
    except Exception as exc:
        return _error(str(exc), 500)


@dashboard_bp.route('/transcripts', methods=['GET'])
def list_transcripts():
    try:
        calls = get_transcripts()
        return jsonify(success_response({'calls': calls}, count=len(calls)))
    except Exception as exc:
        return _error(str(exc), 500)


@dashboard_bp.route('/transcripts/<int:call_id>', methods=['GET'])
def get_transcript(call_id: int):
    try:
        transcript = next((call for call in get_transcripts() if int(call['id']) == call_id), None)
        if transcript is None:
            return _error('Transcript not found', 404)
        return jsonify(success_response({'call': transcript}))
    except Exception as exc:
        return _error(str(exc), 500)


@dashboard_bp.route('/rewards', methods=['GET'])
def get_rewards():
    try:
        customers = []
        for customer in load_customers():
            tier = customer.get('tier', 'Bronze')
            call_count = int(customer.get('visit_count', 0))
            next_threshold = {'Bronze': 10, 'Silver': 20, 'Gold': 30, 'Platinum': call_count}
            discount = {'Bronze': 5, 'Silver': 10, 'Gold': 15, 'Platinum': 20}.get(tier, 5)
            customers.append(
                {
                    'id': customer['customer_id'],
                    'name': customer['name'],
                    'phone': customer.get('phone') or f"{customer['email'].split('@')[0]}@chefai.local",
                    'callCount': call_count,
                    'tier': tier,
                    'discount': discount,
                    'autoApply': True,
                    'nextTierCalls': max(0, next_threshold[tier] - call_count),
                    'points': int(customer.get('points', 0)),
                    'totalSpent': float(customer.get('total_spent', 0)),
                }
            )

        customers.sort(key=lambda entry: entry['points'], reverse=True)
        discounts = get_discount_catalog()
        return jsonify(success_response({'customers': customers[:20], 'discounts': discounts}))
    except Exception as exc:
        return _error(str(exc), 500)


@dashboard_bp.route('/rewards/discounts', methods=['POST'])
def create_discount():
    payload = request.get_json(silent=True) or {}
    if not payload.get('name') or not payload.get('value'):
        return _error('Discount name and value are required', 400)
    try:
        discount = add_discount(payload)
        return jsonify(success_response({'discount': discount})), 201
    except Exception as exc:
        return _error(str(exc), 500)


@dashboard_bp.route('/rewards/discounts/<int:discount_id>', methods=['DELETE'])
def remove_discount(discount_id: int):
    try:
        deleted = delete_discount(discount_id)
        if not deleted:
            return _error('Discount not found', 404)
        return jsonify(success_response({'deleted': True, 'id': discount_id}))
    except Exception as exc:
        return _error(str(exc), 500)


@dashboard_bp.route('/combos', methods=['GET'])
def get_combos():
    try:
        combos = get_combo_catalog()
        repeat_customers = get_repeat_customer_recommendations()
        available_items = sorted({item['name'] for item in load_menu_items()})
        return jsonify(
            success_response(
                {
                    'combos': combos,
                    'repeatCustomers': repeat_customers,
                    'availableItems': available_items,
                }
            )
        )
    except Exception as exc:
        return _error(str(exc), 500)


@dashboard_bp.route('/combos', methods=['POST'])
def create_combo():
    payload = request.get_json(silent=True) or {}
    if not payload.get('name') or not payload.get('items'):
        return _error('Combo name and at least one item are required', 400)
    try:
        combo = upsert_combo(payload)
        return jsonify(success_response({'combo': combo})), 201
    except Exception as exc:
        return _error(str(exc), 500)


@dashboard_bp.route('/combos/<int:combo_id>', methods=['PATCH'])
def update_combo(combo_id: int):
    payload = request.get_json(silent=True) or {}
    payload['id'] = combo_id
    try:
        combo = upsert_combo(payload)
        return jsonify(success_response({'combo': combo}))
    except Exception as exc:
        return _error(str(exc), 500)


@dashboard_bp.route('/holidays', methods=['GET'])
def get_holidays():
    try:
        events = get_holiday_events()
        return jsonify(success_response({'events': events}, count=len(events)))
    except Exception as exc:
        return _error(str(exc), 500)


@dashboard_bp.route('/holidays', methods=['POST'])
def create_holiday():
    payload = request.get_json(silent=True) or {}
    if not payload.get('date'):
        return _error('Holiday date is required', 400)
    try:
        holiday = add_or_update_holiday(payload)
        return jsonify(success_response({'event': holiday})), 201
    except Exception as exc:
        return _error(str(exc), 500)


@dashboard_bp.route('/holidays/<int:holiday_id>', methods=['PUT'])
def update_holiday(holiday_id: int):
    payload = request.get_json(silent=True) or {}
    payload['id'] = holiday_id
    try:
        holiday = add_or_update_holiday(payload)
        return jsonify(success_response({'event': holiday}))
    except Exception as exc:
        return _error(str(exc), 500)


@dashboard_bp.route('/holidays/<int:holiday_id>', methods=['DELETE'])
def remove_holiday(holiday_id: int):
    try:
        deleted = delete_holiday(holiday_id)
        if not deleted:
            return _error('Holiday not found', 404)
        return jsonify(success_response({'deleted': True, 'id': holiday_id}))
    except Exception as exc:
        return _error(str(exc), 500)


@dashboard_bp.route('/settings', methods=['GET'])
def get_app_settings():
    try:
        return jsonify(success_response({'settings': get_settings()}))
    except Exception as exc:
        return _error(str(exc), 500)


@dashboard_bp.route('/settings', methods=['PUT'])
def update_app_settings():
    payload = request.get_json(silent=True) or {}
    try:
        settings = save_settings(payload)
        return jsonify(success_response({'settings': settings}))
    except Exception as exc:
        return _error(str(exc), 500)
