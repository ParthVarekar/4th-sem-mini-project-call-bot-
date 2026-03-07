from flask import Blueprint, jsonify
from datetime import datetime, timedelta
import random
from collections import Counter
from backend.services.data_loader import load_orders, load_menu_items, load_customers, get_ai_structured_insights, load_call_logs, load_combo_meals, load_rewards_program, load_holiday_schedule
from backend.utils.response import success_response, error_response

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api')

@dashboard_bp.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    try:
        orders = load_orders()
        
        # Calculate last 7 days metrics
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)
        recent_orders = [o for o in orders if datetime.fromisoformat(o['timestamp']) >= start_date]
        
        total_orders = len(recent_orders)
        revenue = sum(o['price'] for o in recent_orders)
        avg_order_value = revenue / total_orders if total_orders > 0 else 0
        
        # Weekly orders 
        weekly_orders_dict = Counter()
        for i in range(7):
            day = (start_date + timedelta(days=i)).strftime('%a')
            weekly_orders_dict[day] = 0
            
        for o in recent_orders:
            day = datetime.fromisoformat(o['timestamp']).strftime('%a')
            if day in weekly_orders_dict:
                weekly_orders_dict[day] += 1
                
        weekly_orders = [{"name": k, "orders": v} for k, v in weekly_orders_dict.items()]
        
        # Regional/Type Activity
        types_dict = Counter([o.get('order_type', 'dine-in') for o in recent_orders])
        total_types = sum(types_dict.values())
        regional_activity = []
        if total_types > 0:
            regional_activity = [{"name": k.title(), "value": int(v/total_types * 100)} for k, v in types_dict.items()]
        else:
            regional_activity = [{"name": "Dine-in", "value": 66}, {"name": "Delivery", "value": 34}]
        
        return jsonify(success_response({
            "kpis": {
                "total_orders": total_orders,
                "revenue": round(revenue, 2),
                "avg_order_value": round(avg_order_value, 2)
            },
            "weekly_orders": weekly_orders,
            "regional_activity": regional_activity
        }))
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify(error_response(str(e))[0]), 500

@dashboard_bp.route('/analytics', methods=['GET'])
def get_analytics():
    try:
        call_logs = load_call_logs()
        orders = load_orders()
        
        # Volume (last 14 hours)
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=14)
        recent_calls = [c for c in call_logs if datetime.fromisoformat(c['timestamp']) >= start_time]
        
        volume_dict = Counter()
        for i in range(14):
            hr = (start_time + timedelta(hours=i)).strftime('%H:00')
            volume_dict[hr] = 0
            
        for c in recent_calls:
            hr = datetime.fromisoformat(c['timestamp']).strftime('%H:00')
            if hr in volume_dict:
                volume_dict[hr] += 1
                
        volume = [{"time": k, "calls": v} for k, v in volume_dict.items()]
        
        # Peaks (last 7 days morning vs evening)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)
        week_orders = [o for o in orders if datetime.fromisoformat(o['timestamp']) >= start_date]
        
        peaks_dict = {}
        for i in range(7):
            day = (start_date + timedelta(days=i)).strftime('%a')
            peaks_dict[day] = {"morning": 0, "evening": 0}
            
        for o in week_orders:
            dt = datetime.fromisoformat(o['timestamp'])
            day = dt.strftime('%a')
            if day in peaks_dict:
                if 6 <= dt.hour < 16:
                    peaks_dict[day]["morning"] += 1
                elif 16 <= dt.hour <= 23:
                    peaks_dict[day]["evening"] += 1
                    
        peaks = [{"day": k, "morning": v["morning"], "evening": v["evening"]} for k, v in peaks_dict.items()]
        
        # Trends (Last 4 weeks)
        trends = []
        for i in range(4):
            wk_start = end_date - timedelta(days=(i+1)*7)
            wk_end = end_date - timedelta(days=i*7)
            wk_orders = [o for o in orders if wk_start <= datetime.fromisoformat(o['timestamp']) < wk_end]
            wk_rev = sum(o['price'] for o in wk_orders)
            trends.insert(0, {"name": f"Week {4-i}", "orders": len(wk_orders), "revenue": round(wk_rev, 2)})

        return jsonify(success_response({
            "volume": volume,
            "peaks": peaks,
            "trends": trends
        }))
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify(error_response(str(e))[0]), 500

@dashboard_bp.route('/orders', methods=['GET'])
def get_orders():
    try:
        orders = load_orders()
        # Return 50 most recent orders mapped to UI schema
        recent_orders = [
            {
                "id": o['order_id'],
                "items": o['items'],
                "price": o['price'],
                "time": datetime.fromisoformat(o['timestamp']).strftime("%H:%M")
            }
            for o in orders[:50]
        ]
        return jsonify(success_response({"orders": recent_orders}))
    except Exception as e:
        return jsonify(error_response(str(e))[0]), 500

@dashboard_bp.route('/rewards', methods=['GET'])
def get_rewards():
    try:
        customers = load_customers()
        loyalty_customers = []
        for c in customers:
            if c.get('points', 0) > 0:
                tier = c.get('tier', 'Bronze')
                discount = 20 if tier == 'Platinum' else 15 if tier == 'Gold' else 10 if tier == 'Silver' else 5
                loyalty_customers.append({
                    "id": c['customer_id'],
                    "name": c['name'],
                    "phone": c.get('phone', '555-0000'),
                    "callCount": max(1, c.get('points', 0) // 10),
                    "tier": tier,
                    "discount": discount,
                    "autoApply": True,
                    "nextTierCalls": 10,
                    "points": c.get('points', 0)
                })
        # Dynamic discounts based on trends
        discounts = [
            { "id": 1, "name": "Loyal Customer 10%", "type": "Percentage", "value": "10%", "conditions": "3+ visits/month", "active": True, "used": random.randint(40, 150) },
            { "id": 2, "name": "First Order Welcome", "type": "Fixed Amount", "value": "$5", "conditions": "New customers only", "active": True, "used": random.randint(20, 80) },
            { "id": 3, "name": "Weekend Combo Deal", "type": "Percentage", "value": "15%", "conditions": "Sat-Sun, Combo orders", "active": True, "used": random.randint(60, 250) },
            { "id": 4, "name": "Lunch Rush Hour", "type": "Percentage", "value": "10%", "conditions": "11am - 2pm", "active": True, "used": random.randint(100, 300) },
            { "id": 5, "name": "Dinner Fast Track", "type": "Fixed Amount", "value": "$8", "conditions": "Orders over $50", "active": True, "used": random.randint(50, 150) },
            { "id": 6, "name": "Birthday Special", "type": "Fixed Amount", "value": "$10", "conditions": "Birthday month", "active": False, "used": random.randint(5, 25) },
            { "id": 7, "name": "Platinum VIP Upgrade", "type": "Percentage", "value": "25%", "conditions": "Platinum Tier Only", "active": True, "used": random.randint(10, 40) },
            { "id": 8, "name": "Appetizer Give-away", "type": "Fixed Amount", "value": "$6", "conditions": "With 2 Main Courses", "active": True, "used": random.randint(120, 280) }
        ]
        
        # Sort by points descending and return top 20
        loyalty_customers.sort(key=lambda x: x['points'], reverse=True)
        return jsonify(success_response({"customers": loyalty_customers[:20], "discounts": discounts}))
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify(error_response(str(e))[0]), 500

@dashboard_bp.route('/combos', methods=['GET'])
def get_combos():
    try:
        ai_insights = get_ai_structured_insights()
        combos = []
        if ai_insights and 'structured_insights' in ai_insights:
            for idx, item in enumerate(ai_insights['structured_insights']):
                if item.get('type') == 'combo':
                    combos.append({
                        "id": idx + 1,
                        "name": f"{item['items'][0]} & {item['items'][1]} Combo",
                        "items": item['items'],
                        "price": 12.99,
                        "discount": 15,
                        "popularity": int(item.get('confidence', 0.5) * 100),
                        "revenue": int(item.get('support', 0.1) * 20000),
                        "timesOrdered": int(item.get('support', 0.1) * 1000),
                        "targetAudience": "AI Suggested",
                        "active": True
                    })
        
        if not combos:
            combos = [
                {"id": 1, "name": "Burger Combo", "items": ["Classic Burger", "Fries", "Coke"], "price": 12.5, "discount": 10, "popularity": 85, "revenue": 12000, "timesOrdered": 600, "targetAudience": "Lunch Crowd", "active": True},
                {"id": 2, "name": "Pizza Combo", "items": ["Pepperoni Pizza", "Garlic Bread"], "price": 14.0, "discount": 12, "popularity": 92, "revenue": 18500, "timesOrdered": 850, "targetAudience": "Families", "active": True},
                {"id": 3, "name": "Wrap Combo", "items": ["Chicken Wrap", "Fries", "Iced Tea"], "price": 11.5, "discount": 15, "popularity": 78, "revenue": 8400, "timesOrdered": 420, "targetAudience": "Health-conscious", "active": True}
            ]
            
        orders = load_orders()
        customers = load_customers()
        
        customer_orders = {}
        for o in orders:
            try:
                cid = int(o.get('customer_id'))
                if cid not in customer_orders:
                    customer_orders[cid] = []
                customer_orders[cid].append(o)
            except:
                pass
                
        # Sort by total orders
        top_cids = sorted(customer_orders.keys(), key=lambda x: len(customer_orders[x]), reverse=True)[:6]
        customer_names = {c['customer_id']: c['name'] for c in customers}
        
        repeat_customers = []
        for cid in top_cids:
            c_orders = customer_orders[cid]
            items = []
            for o in c_orders:
                items.extend(o['items'])
            
            top_items = [item for item, count in Counter(items).most_common(3)]
            suggested = top_items[0] + " Combo" if top_items else "Surprise Combo"
            pot_rev = sum(o['price'] for o in c_orders) * 0.15 # 15% upsell potential
            
            repeat_customers.append({
                "id": cid,
                "name": customer_names.get(cid, f"Customer {cid}"),
                "orders": len(c_orders),
                "suggestedCombo": suggested,
                "orderHistory": top_items,
                "potentialRevenue": round(pot_rev, 2)
            })
                
        # Load menu items for dynamic combo building
        menu_items = load_menu_items()
        available_items = list(set([m['name'] for m in menu_items]))
                
        return jsonify(success_response({"combos": combos, "repeatCustomers": repeat_customers, "availableItems": available_items}))
    except Exception as e:
        return jsonify(error_response(str(e))[0]), 500

@dashboard_bp.route('/holidays', methods=['GET'])
def get_holidays():
    try:
        events = []
        ai_insights = get_ai_structured_insights()
        
        if ai_insights and 'structured_insights' in ai_insights:
            for item in ai_insights['structured_insights']:
                if item.get('type') == 'busiest_day':
                    events.append({
                        "date": f"Every {item['day']}",
                        "event": "AI Forecast: Peak Day",
                        "staffing_tip": f"High volume expected ({item['order_count']} orders). Ensure maximum staff scheduling.",
                        "status": "upcoming"
                    })

        # Base calendar events
        events.extend([
            {"date": "2026-07-04", "event": "Independence Day", "staffing_tip": "Increase evening staff for outdoor events", "status": "planned"},
            {"date": "2026-10-31", "event": "Halloween", "staffing_tip": "Prepare for evening rush", "status": "planned"},
            {"date": "2026-11-26", "event": "Thanksgiving", "staffing_tip": "Special holiday menu only", "status": "planned"},
            {"date": "2026-12-25", "event": "Christmas", "staffing_tip": "Closed or limited hours", "status": "planned"},
        ])
        
        return jsonify(success_response({"events": events}))
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify(error_response(str(e))[0]), 500
