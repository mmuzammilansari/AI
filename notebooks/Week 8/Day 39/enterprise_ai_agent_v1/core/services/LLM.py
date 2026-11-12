import os
from dotenv import load_dotenv


LLMs = {
    'groq': {
        "baseUrl": "https://api.groq.com/openai/v1",
        "apiKey": "os.getenv('GROQ_API_KEY')",
        "model": "openai/gpt-oss-120b",
    },
    'ollama':{
        "baseUrl": "http://localhost:11434/v1",
        "apiKey": "ollama_key",
        "model":"qwen3:4b"
    }
}