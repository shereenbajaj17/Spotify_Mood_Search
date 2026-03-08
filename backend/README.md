# Spotify Vibe Search Backend

This is the FastAPI backend for the Spotify Vibe Search application.

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Server

Start the development server:
```bash
python main.py
# OR
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`. 
Interactive API documentation is available at `http://localhost:8000/docs`.
