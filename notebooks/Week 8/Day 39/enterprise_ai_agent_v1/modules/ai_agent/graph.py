import os
from langgraph.graph import START, MessagesState, StateGraph
from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
from modules.aiagent.tools import TOOLS
from core.services.LLM import LLMs
from langgraph.prebuilt import ToolNode
SYSTEM_PROMPT = """You are the friendly customer support assistant for Xander Restaurant.
Keep replies short. Prices are in Pakistani rupees. Use fetch_menu for menu/prices.
For complaints, collect customer name, phone, complaint and order ID. Validate the
order ID with validate_order_id, then call log_complaint only for a valid order.
Never invent facts. Ask for missing details."""

def create_chat_model(llm='groq'):
    return ChatOpenAI(**LLMs(llm), temperature=0)

def assistant(state: MessageState, model_with_tools):
    reply = model_with_tools.invoke([SystemMessage(content=SYSTEM_PROMPT), *state["messages"]])


def build_graph(model=None, tools=None):
    tools = TOOLS if tools is None else tools
    model = LLMs.create_chat_model() if model is None else model
    model_with_tools = model.bind_tools(tools)
    builder = StateGraph(MessagesState)
    builder.add_node("assistant", assistant_node)
    
    builder.add_node("tools", ToolNode(tools))
    
    builder.add_edge(START, assistant_node)
    builder.add_node("tools", ToolNode(tools))
    builder.add_conditional_edges("assistant", tools_condition)
    builder.add_edge("tools", "assistant")
    return builder.compile()
    
    
if __name__ == "__main__":
    import sys
    graph = build_graph(sys.argv[1] if len(sys.argv) > 1 else "ollama")
    out = graph.invoke({"messages": [("user", "What is on the menu?")]})
    print(out["messages"][-1].content)
    

