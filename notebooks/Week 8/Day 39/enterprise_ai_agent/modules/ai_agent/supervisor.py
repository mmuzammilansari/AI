"""Supervisor: a manager agent that sends each question to the right worker agent."""
from langgraph.prebuilt import create_react_agent
from langgraph_supervisor import create_supervisor
from modules.ai_agent.graph import create_chat_model
from modules.ai_agent.tools import fetch_menu, validate_order_id, log_complaint, get_discounts



def build_supervisor(llm="groq"):
    model = create_chat_model(llm)

    menu_agent = create_react_agent(
        model=model,
        tools=[fetch_menu],
        name="menu_agent",
        prompt="You answer menu and price questions. Prices are in PKR. Always use fetch_menu. Write prices like Rs. 850, never use the peso sign.",
    )
    complaint_agent = create_react_agent(
        model=model,
        tools=[validate_order_id, log_complaint],
        name="complaint_agent",
        prompt=("You handle complaints. Collect customer name, phone, order ID and complaint. "
                "Check the order ID with validate_order_id, then save with log_complaint. "
                "Ask for missing details. Never invent a complaint ID."),
    )
<<<<<<< HEAD
    complaint_support_agent = create_react_agent(
        model=model,
        tools=[],
        name="complaint_support_agent",
        prompt=("after serving Customer you have to collect user feedback"),
    )
=======

    offer_agent = create_react_agent(
        model=model,
        tools=[get_discounts],
        name="offer_agent",
        prompt="This agent will tell user about discounts.",
    )

>>>>>>> c275fc1d3868eaf16077c28554e97a95b65fd1a0
    supervisor = create_supervisor(
        agents=[menu_agent, complaint_agent, offer_agent],
        model=model,
        prompt=("You are the manager of Xander Restaurant support. "
                "Menu or price questions -> menu_agent. Complaints -> complaint_agent. "
                "For Offers/Discount we've made separate offer agent, trigger that when there's a query related to it."
                "For greetings, answer yourself in one short line. "
                "After a worker agent answers, write nothing more: repeat the worker's answer exactly."),
    )
    return supervisor.compile()





