import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client

# Initialize FastAPI
app = FastAPI(title="Project Clarity Cognitive OS Backend")

# Configure CORS so your React frontend (port 3000) can communicate with it
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase Python Client
SUPABASE_URL = "https://xpihsdeapqxqexcqjvmw.supabase.co"
# In production/hackathon run, fetch from environment variables
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwaWhzZGVhcHF4cWV4Y3Fqdm13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDM4MjMsImV4cCI6MjA5Nzk3OTgyM30.Ixons1qO4sIh2Ah1ac6ph0pSdEnuSzKSn8XwMt9iUu4")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


class MessagePayload(BaseModel):
    source: str  # 'slack', 'email', 'jira', 'teams'
    sender_name: str
    sender_role: str = "External User"
    original_text: str


@app.get("/")
def read_root():
    return {"status": "online", "message": "Cognitive OS Swarm runtime operational"}


@app.post("/api/triage")
def triage_message(payload: MessagePayload):
    try:
        msg_id = f"msg_py_{os.urandom(2).hex()}"
        timestamp = "09:45"  # Suggest dynamic generation based on timezone
        
        # 1. Store incoming message as 'processing' in Supabase
        initial_msg = {
            "message_id": msg_id,
            "sender_name": payload.sender_name,
            "sender_role": payload.sender_role,
            "timestamp": timestamp,
            "original_text": payload.original_text,
            "source": payload.source,
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
        
        supabase.table("messages").insert(initial_msg).execute()

        # ======================================================================
        # ROLE 2 / ROLE 3 IMPLEMENTATION HERE:
        # TODO: 
        # 1. Connect to Lyzr Framework (Google ADK / Gemini).
        # 2. Query Qdrant for user preferences & corporate guidelines context.
        # 3. Trigger Agent-to-Agent consensus debate.
        # 4. Resolve task complexity, steps, and proposed calendar block.
        # ======================================================================

        # Simulated Swarm Logic output (Update this with actual Lyzr results)
        simulated_ai_result = {
            "translation_status": "completed",
            "action": f"Review payload requests: {payload.original_text[:25]}",
            "complexity": "Medium",
            "expected_duration": "45 mins",
            "steps": [
                "Scan reference files on mock folders",
                "Verify task description details with sender",
                "Lock in calendar block suggestion"
            ],
            "suggested_start_time": "14:00",
            "suggested_end_time": "14:45",
            "reasoning": "Determined Medium Complexity based on context search. Task scheduled post-deep focus blocks.",
            "debate_id": f"deb_{msg_id}"
        }

        # Update row with final analysis
        supabase.table("messages").update(simulated_ai_result).eq("message_id", msg_id).execute()

        return {"status": "success", "message_id": msg_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
