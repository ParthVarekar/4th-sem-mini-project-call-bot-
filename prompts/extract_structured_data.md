Extract booking data from conversation.

Return ONLY raw JSON.
Do NOT use markdown code blocks (no ```json).
Do NOT include any introductory text.

Schema:
{
  "intent": "book_appointment" | "place_order" | "inquiry" | "unknown",
  "data": {
    "full_name": "string",
    "phone_number": "string",
    "service_type": "string",
    "preferred_date": "string",
    "preferred_time": "string",
    "product_name": "string",
    "quantity": "number",
    "delivery_address": "string"
  }
}
