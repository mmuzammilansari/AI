from fastapi import FastAPI

from modules.ai_agent.router import ai_agent_router

app = FastAPI()


app.include_router(
    ai_agent_router,
    tags=["AI Module"]
)


@app.get("/")
async def root():
    return {'Message': "your are at Xanders Backend"}


    
# @app.post("/chat")
# def initate_chat(query: chat_payload):
#     print(query.model_dump())
#     return query

# @app.get("/items/{item_id}")
# async def read_item(item_id: str, q: str | None = None):
#     if q:
#         return {"item_id": item_id, "q": q}
#     return {"item_id": item_id}

