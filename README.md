# KisanSetu

KisanSetu is a direct farmer-to-consumer agricultural marketplace. It allows farmers to sell their freshly grown crops directly to consumers without intermediaries.

## Prerequisites
- Node.js (v18+)
- Python (3.10+)
- PostgreSQL (or SQLite for development)

## Setup Backend
1. `cd backend`
2. `python -m venv venv`
3. `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
4. `pip install -r requirements.txt`
5. `python run_seed.py` (To generate the demo database)
6. `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

## Setup Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Demo Accounts
- **Farmer**: `farmer1@kisansetu.com` / `farmer123`
- **Consumer**: `consumer1@kisansetu.com` / `consumer123`
