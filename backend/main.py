from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import json
from motor.motor_asyncio import AsyncIOMotorClient

app = FastAPI(
    title="Intelligence Fusion API",
    description="API for Multi-Source Intelligence Fusion Dashboard",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection String (defaults to localhost if not using Docker)
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "intelligence_fusion")

# Global DB client variable
db_client = None
db = None

@app.on_event("startup")
async def startup_db_client():
    global db_client, db
    print(f"Connecting to MongoDB at {MONGO_URL}...")
    db_client = AsyncIOMotorClient(MONGO_URL)
    db = db_client[DB_NAME]
    print("Successfully connected to MongoDB!")

@app.on_event("shutdown")
async def shutdown_db_client():
    global db_client
    if db_client:
        db_client.close()

class GeoPoint(BaseModel):
    lat: float
    lng: float
    source: str  # OSINT, HUMINT, IMINT
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "database": "connected" if db_client else "disconnected"}

@app.get("/api/intelligence", response_model=List[GeoPoint])
async def get_intelligence_data():
    """Retrieve all intelligence nodes for visualization on the map."""
    collection = db["nodes"]
    cursor = collection.find({}, {"_id": 0}) # Exclude MongoDB internal ID
    nodes = await cursor.to_list(length=1000)
    return nodes

@app.post("/api/ingest/json")
async def ingest_json(file: UploadFile = File(...)):
    """Ingest JSON intelligence data and save to MongoDB."""
    if not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="Only JSON files are allowed")
    
    contents = await file.read()
    try:
        data = json.loads(contents)
        valid_points = []
        for item in data:
            point = GeoPoint(**item)
            valid_points.append(point.dict())
        
        if valid_points:
            collection = db["nodes"]
            await collection.insert_many(valid_points)
            
        return {"message": f"Successfully saved {len(valid_points)} points to MongoDB!", "count": len(valid_points)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/ingest/image")
async def ingest_image(lat: float, lng: float, title: str, file: UploadFile = File(...)):
    """Ingest Image (IMINT) data and save to MongoDB."""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Only images are allowed")
    
    point = GeoPoint(
        lat=lat,
        lng=lng,
        source="IMINT",
        title=title,
        description=f"Uploaded image: {file.filename}",
        image_url=f"/static/{file.filename}" 
    )
    
    collection = db["nodes"]
    await collection.insert_one(point.dict())
    
    return {"message": "Image successfully saved to MongoDB", "point": point.dict()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)
