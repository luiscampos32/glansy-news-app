import os 
import feedparser
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables (API Key)
load_dotenv()

# Initialize Google GenAI Client
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Restrict this to your Expo app's origin in production
    allow_methods=["*"], # Allows all HTTP methods, including OPTIONS
    allow_headers=["*"],
)

# Define structure of data that Expo sends to FastAPI
class ChatRequest(BaseModel):
    user_message: str
    time_available_minutes: int

def fetch_tech_news():
    # Using BBC Tech RSS as free, no-API-key-needed news source
    feed = feedparser.parse("https://feeds.bbci.co.uk/news/technology/rss.xml")

@app.get("/")
def read_root():
    return {"message": "News Backend is running!"}

@app.post("/api/chat")
def handle_chat(request: ChatRequest):
    # TODO: Plug in Google Gemini and News API here.
    # For now, mock the response based on the time available.
    print(request.user_message)
    print(request.time_available_minutes)
    if request.time_available_minutes <= 2:
        response_text = "Here is your 2-minute quick hit: Tech stocks surged today, and a new AI model was released. Have a great commute!"
    else:
        response_text = "Here is your deep dive: Let's break down the 3 biggest stories in global markets today..."
    
    return {"reply": response_text}