from fastapi import APIRouter
from .schema import chat_payload


ai_agent_router = APIRouter(prefix="/ai")

@ai_agent_router.post("/chat")
def initate_chat(query: chat_payload):
    print(query.model_dump())
    return query

@ai_agent_router.get("/history")
def get_histry(session_id: str):
    print("session is has been recived ")
    
    return f"there is chat for {session_id}"