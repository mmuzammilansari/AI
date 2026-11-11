"""the same resturant actions as Day 24, now describe with @tools"""
from langchain_core.tools import tool
# from core.database.sqlite import save_complaint
# from modules.knowledge.serice import search_knowledge
from core.database.sqlite import save_complaint
order_list = [
    "OR-1045",
    "OR-1046",
    "OR-1047"
]
complaint_list = []
@tool
def fetch_menu() -> list(dict):
    return [
        {"name": "Zinger Burger", "price": 850},
        {"name": "Chicken Biryani", "price": 450},
        {"name": "Club Sandwich", "price": 700}
    ]   
    
@tool
def validate_order_id(order_id: str)-> bool:
    if order_id in order_list:
        return True
    return False

@tool
def log_complaint(customer_name: str, order_id: str, phone: str, complaint:str)->dict:
    # temp_dict = {
    #         "customer_name": customer_name,
    #         "orderId": order_id,
    #         "phone_number": phone,
    #         "complaint": complaint,
    #         "Status": "Pending",
    #     }
    # complaint_list.append(temp_dict)
    return save_complaint(customer_name, order_id, phone, complaint)
    
@tool
def retrieve_resturant_info():
    return 0
TOOLS = [
    fetch_menu,
    validate_order_id,
    log_complaint
]