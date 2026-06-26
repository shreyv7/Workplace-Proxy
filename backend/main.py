import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

SUPABASE_URL = "https://xpihsdeapqxqexcqjvmw.supabase.co"
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwaWhzZGVhcHF4cWV4Y3Fqdm13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDM4MjMsImV4cCI6MjA5Nzk3OTgyM30.Ixons1qO4sIh2Ah1ac6ph0pSdEnuSzKSn8XwMt9iUu4")

@app.route("/", methods=["GET"])
def read_root():
    return jsonify({"status": "online", "message": "Cognitive OS Swarm Flask runtime operational"})

@app.route("/api/triage", methods=["POST"])
def triage_message():
    try:
        data = request.json
        source = data.get("source")
        sender_name = data.get("sender_name")
        sender_role = data.get("sender_role", "External Contact")
        original_text = data.get("original_text")
        
        msg_id = f"msg_py_{os.urandom(2).hex()}"
        timestamp = "09:45"
        
        # Insert initial processing message in Supabase via REST API
        initial_msg = {
            "message_id": msg_id,
            "sender_name": sender_name,
            "sender_role": sender_role,
            "timestamp": timestamp,
            "original_text": original_text,
            "source": source,
            "importance": "high",
            "ambiguity": "medium",
            "agent_assigned": "Interceptor Agent",
            "translation_status": "processing",
            "action": "Analyzing signals...",
            "complexity": "Medium",
            "expected_duration": "Evaluating...",
            "steps": [],
            "suggested_start_time": "14:00",
            "suggested_end_time": "15:00",
            "fidelity_rating": 3,
            "acknowledged": False,
            "reasoning": "Lyzr Swarm instantiated. Searching vector space...",
            "debate_id": f"deb_{msg_id}"
        }
        
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        # Post to Supabase REST endpoint
        res = requests.post(f"{SUPABASE_URL}/rest/v1/messages", json=initial_msg, headers=headers)
        res.raise_for_status()

        # Simulated Swarm Logic output
        simulated_ai_result = {
            "translation_status": "completed",
            "action": f"Review requests: {original_text[:25]}",
            "complexity": "Medium",
            "expected_duration": "45 mins",
            "steps": [
                "Scan reference files on mock folders",
                "Verify task description details with sender",
                "Lock in calendar block suggestion"
            ],
            "suggested_start_time": "14:00",
            "suggested_end_time": "14:45",
            "reasoning": "Determined Medium Complexity. Task scheduled post-deep focus blocks.",
            "debate_id": f"deb_{msg_id}"
        }
        
        # Update record in Supabase
        update_headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json"
        }
        res_update = requests.patch(
            f"{SUPABASE_URL}/rest/v1/messages?message_id=eq.{msg_id}",
            json=simulated_ai_result,
            headers=update_headers
        )
        res_update.raise_for_status()

        # Write simulated logs to trace_logs table
        log_records = [
            {"t": timestamp, "agent": "Interceptor Agent", "tool": "channel_intercept", "msg": f"Ingested raw {source} payload via HTTP"},
            {"t": timestamp, "agent": "Context Agent", "tool": "qdrant_semantic_search", "msg": "Searched vectors for user rules"},
            {"t": timestamp, "agent": "Scheduler Agent", "tool": "get_calendar_free_busy", "msg": "Scanned free slots on GCal"},
            {"t": timestamp, "agent": "Consensus Swarm", "event": f"Aligned with 94% confidence: debate completed"},
            {"t": timestamp, "agent": "Translator Agent", "tool": "render_clarity_card", "msg": f"Compiled task briefing: {msg_id}"}
        ]
        
        requests.post(f"{SUPABASE_URL}/rest/v1/trace_logs", json=log_records, headers=headers)

        return jsonify({"status": "success", "message_id": msg_id})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(port=8000, debug=True)
