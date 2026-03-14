import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import pandas as pd
import ast
from fastembed import TextEmbedding
import faiss
import requests
import base64
import urllib.parse
import os
from dotenv import load_dotenv

load_dotenv()

# Global dictionary to hold ML data
ml_data = {}

def get_spotify_token():
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        print("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in environment!")
        return None
        
    auth_string = f"{client_id}:{client_secret}"
    auth_bytes = auth_string.encode("utf-8")
    auth_base64 = str(base64.b64encode(auth_bytes), "utf-8")
    
    url = "https://accounts.spotify.com/api/token"
    headers = {
        "Authorization": "Basic " + auth_base64,
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {"grant_type": "client_credentials"}
    try:
        res = requests.post(url, headers=headers, data=data)
        return res.json().get("access_token")
    except Exception:
        return None

# The list of possible moods in our database
MOOD_PROTOTYPES = [
    'aggressive', 'angry', 'brooding', 'calm', 'chill', 'cinematic', 
    'confident', 'dramatic', 'dreamy', 'empowered', 'energetic', 
    'euphoric', 'happy', 'lonely', 'meditative', 'melancholy', 
    'night_drive', 'nostalgic', 'party', 'rainy_day', 'rebellious', 
    'romantic', 'sad', 'serene', 'tender', 'workout'
]

import asyncio

def load_ml_data_sync():
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    print(f"Loading ML data from {data_dir}...")
    
    try:
        embeddings = np.load(os.path.join(data_dir, "lyric_embeddings.npy")).astype('float32')
        ml_data['embeddings'] = embeddings
        print("Successfully loaded lyric_embeddings.npy")
        
        ml_data['metadata'] = pd.read_csv(os.path.join(data_dir, "songs_metadata.csv"))
        print("Successfully loaded songs_metadata.csv")
        
        ml_data['moods'] = pd.read_csv(os.path.join(data_dir, "spotify_moods_db.csv"))
        print("Successfully loaded spotify_moods_db.csv")
        
        print("Loading TextEmbedding model (fastembed)...")
        model = TextEmbedding(model_name='sentence-transformers/all-MiniLM-L6-v2')
        ml_data['model'] = model
        print("Successfully loaded fastembed model")
        
        print("Creating FAISS index...")
        embedding_dim = embeddings.shape[1]
        index = faiss.IndexFlatL2(embedding_dim)
        index.add(embeddings)
        ml_data['faiss_index'] = index
        print("Successfully created FAISS index.")
        ml_data['loaded'] = True
    except Exception as e:
        print(f"Error loading ML data: {e}")

async def load_ml_data_background():
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, load_ml_data_sync)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Launch the slow ML load in a background executor thread!
    # This immediately unblocks `uvicorn` so it can scan open ports 
    # and satisfy Render's health checks within the 60s timeout limit.
    print("Spawning background task to load ML Models...")
    asyncio.create_task(load_ml_data_background())
    yield
    
    # Clean up on shutdown
    ml_data.clear()
    print("ML data unloaded.")

app = FastAPI(lifespan=lifespan)

# Add CORS middleware to allow the frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Spotify Vibe Search API running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/search")
def search_vibe(vibe: str):
    if not ml_data.get('loaded'):
        return {"error": "Server is waking up and booting ML Models (this takes ~60 seconds on free tier). Please try again in a minute!"}
        
    query_embedding = np.array(list(ml_data['model'].embed([vibe]))).astype('float32')
    index = ml_data['faiss_index']
    
    top_k = 10
    D, I = index.search(query_embedding, top_k)
    
    metadata = ml_data['metadata']
    moods_db = ml_data['moods']
    
    spot_token = get_spotify_token()
    
    results = []
    
    for idx_dist, idx in zip(D[0], I[0]):
        if idx == -1:
            continue
            
        song_metadata = metadata.iloc[idx]
        song_moods = moods_db.iloc[idx]
        
        # Safely parse the moods string representation into a list
        moods_val = song_moods.get('moods', '[]')
        try:
            if isinstance(moods_val, str):
                parsed_moods = ast.literal_eval(moods_val)
            else:
                parsed_moods = moods_val
        except (ValueError, SyntaxError):
            parsed_moods = []
            
        if not isinstance(parsed_moods, list):
            parsed_moods = []

        track_name_str = str(song_metadata.get('track_name', 'Unknown Track'))
        track_artist_str = str(song_metadata.get('track_artist', 'Unknown Artist'))
        
        # ─── FETCH FROM SPOTIFY ───
        spotify_preview_url = None
        spotify_album_art = None
        spotify_listeners = None
        spotify_uri = None
        
        if spot_token:
            # Build search query
            q = urllib.parse.quote(f"{track_name_str} artist:{track_artist_str}")
            search_url = f"https://api.spotify.com/v1/search?q={q}&type=track&limit=1"
            headers = {"Authorization": f"Bearer {spot_token}"}
            
            try:
                spot_res = requests.get(search_url, headers=headers)
                
                if spot_res.status_code == 200:
                    spot_data = spot_res.json()
                    tracks_items = spot_data.get("tracks", {}).get("items", [])
                    if tracks_items:
                        top_track = tracks_items[0]
                        spotify_preview_url = top_track.get("preview_url")
                        spotify_uri = top_track.get("uri")
                        # Get album art (usually 3 choices, pick the medium or large one)
                        images = top_track.get("album", {}).get("images", [])
                        if images:
                            spotify_album_art = images[0].get("url")
                        
                        # Also try to get artist listeners
                        artist_items = top_track.get("artists", [])
                        if artist_items:
                            artist_id = artist_items[0].get("id")
                            if artist_id:
                                artist_url = f"https://api.spotify.com/v1/artists/{artist_id}"
                                try:
                                    artist_res = requests.get(artist_url, headers=headers)
                                    if artist_res.status_code == 200:
                                        artist_data = artist_res.json()
                                        spotify_listeners = artist_data.get("followers", {}).get("total")
                                except Exception:
                                    pass
            except Exception:
                pass
                                
        # ─── FALLBACK TO ITUNES IF NO PREVIEW URL ───
        if not spotify_preview_url:
            try:
                itunes_q = urllib.parse.quote(f"{track_name_str} {track_artist_str}")
                itunes_url = f"https://itunes.apple.com/search?term={itunes_q}&limit=1&entity=song"
                itunes_res = requests.get(itunes_url, timeout=3)
                if itunes_res.status_code == 200:
                    itunes_data = itunes_res.json()
                    if itunes_data.get("resultCount", 0) > 0:
                        spotify_preview_url = itunes_data["results"][0].get("previewUrl")
            except Exception as e:
                print(f"iTunes Fallback failed: {e}")


        results.append({
            "track_name": track_name_str,
            "track_artist": track_artist_str,
            "moods": parsed_moods,
            "spotify_preview_url": spotify_preview_url,
            "spotify_album_art": spotify_album_art,
            "spotify_listeners": spotify_listeners,
            "spotify_uri": spotify_uri,
            "_debug_distance": float(idx_dist)
        })
        
    return results
