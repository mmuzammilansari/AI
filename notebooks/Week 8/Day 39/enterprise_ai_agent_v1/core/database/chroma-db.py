import chromadb
# from dotenv import load_dotenv

COLLECTION_NAME = "restaurant_vector_db"

chroma_client = chromadb.PersistantClient(path="./")

collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)
