from pymongo import MongoClient

MONGO_URI = "mongodb+srv://scarfacer326_db_user:EVfDX9p3nHckUozp@cluster0.8epkvhf.mongodb.net/?appName=Cluster0"

client = MongoClient(MONGO_URI)

db = client["license_system"]

users_collection = db["users"]
licenses_collection = db["licenses"]
runtime_collection = db["runtime_logs"]
devices_collection = db["devices"]