# Multi-Source Intelligence Fusion Dashboard

## 📌 Problem Statement

Intelligence analysts today work with data that is fragmented across multiple silos: OSINT stored in MongoDB/S3, HUMINT logged in manual spreadsheets or JSON files, and IMINT scattered across JPEG/JPG image files. Without a single "common operating picture," analysts must constantly switch between database viewers, spreadsheets, and image galleries — slowing reaction time and reducing situational awareness.

This project solves that by providing a **centralized, web-based Strategic Fusion Dashboard** that ingests multi-modal intelligence data and renders it as interactive geospatial markers on a unified terrain map, with hover/click pop-ups for instant inspection of metadata and imagery.

## ✅ How This Implementation Addresses the Problem

| Requirement from Problem Statement | Implementation |
|---|---|
| Support for MongoDB, S3, Manual CSV/JSON, Image uploads | FastAPI backend with Motor (async MongoDB driver); `/api/ingest/json` for bulk JSON ingestion, `/api/ingest/image` for IMINT image metadata ingestion |
| High-fidelity fixed terrain map | React-Leaflet map using CartoDB Dark Matter tiles |
| Dynamic dots representing intelligence nodes | Custom `L.divIcon` markers color-coded by source type (OSINT / IMINT / HUMINT) |
| Hover-and-view interactivity | Leaflet `Popup` components bound to each marker, showing title, source tag, and description |

## 🏗️ Architecture

- **Backend**: FastAPI + Motor (async MongoDB driver), running on port `8000`
- **Frontend**: React 18 + Vite + React-Leaflet, running on port `3000`
- **Database**: MongoDB (`intelligence_fusion` DB, `nodes` collection)

A standalone, no-build-step version (`standalone_dashboard.html`) is also included at the repo root as a static mockup/demo that doesn't require the backend to be running.

## 📡 API Reference (`http://localhost:8000`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check; reports DB connection status |
| GET | `/api/intelligence` | Returns all stored intelligence nodes (GeoPoint list) |
| POST | `/api/ingest/json` | Upload a `.json` file of intelligence points; bulk-inserts into MongoDB |
| POST | `/api/ingest/image` | Upload an image with `lat`, `lng`, `title` query params; stored as an IMINT node |

**GeoPoint schema**: `lat`, `lng`, `source` (`OSINT`/`HUMINT`/`IMINT`), `title`, `description` (optional), `image_url` (optional)

Interactive API docs available at `http://localhost:8000/docs`.

## 🚀 Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB running on `mongodb://localhost:27017`

### 1. Start MongoDB
```bash
# via Docker
docker run -d -p 27017:27017 --name intel-mongo mongo:latest
```

### 2. Start the Backend
```bash
cd multi source intelligence fusion dashboard/backend
pip install -r requirements.txt
python main.py
```
Backend runs at `http://localhost:8000` (docs at `/docs`).

### 3. Start the Frontend
```bash
cd multi source intelligence fusion dashboard/frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`.

### 🐳 Or with Docker Compose
```bash
docker-compose up multi source intelligence fusion dashboard_mongodb multi source intelligence fusion dashboard_backend multi source intelligence fusion dashboard_frontend
```

## 🖱️ Using the Dashboard

1. On load, the map centers on India with two mock intelligence nodes.
2. Click **Fetch OSINT Data** to pull all nodes currently stored in MongoDB.
3. Click **Upload JSON** to ingest a batch of intelligence points (see `sample_intelligence_data.json` format: an array of GeoPoint objects).
4. Click **Upload Imagery** to simulate IMINT ingestion.
5. Hover/click any map marker to view its source tag, title, and description in a pop-up.

## 🔮 Future Enhancements
- Direct S3 bucket polling for automated OSINT retrieval
- CSV/Excel ingestion in addition to JSON
- Drag-and-drop upload UI instead of file picker buttons
- Image thumbnail preview directly inside the map pop-up
