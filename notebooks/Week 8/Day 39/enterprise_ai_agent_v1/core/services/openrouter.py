import os
from openai import OpenAI
from dotenv import load_dotenv

# load environments
load_dotenv()


# Models Defineds
MODEL = "nvidia/nemotron-3.5-lightning:free"
EMB_MODEL = "nvidia/nemotron-3-embed-1b:free"


openrouter_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPEN_ROUTER_KEY"),
)