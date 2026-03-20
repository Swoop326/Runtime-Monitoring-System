from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DATABASE_NAME")

client = MongoClient(MONGO_URI)

db = client[DB_NAME]

# collections
users_collection = db["users"]
licenses_collection = db["licenses"]
runtime_logs_collection = db["runtime_logs"]
devices_collection = db["devices"]