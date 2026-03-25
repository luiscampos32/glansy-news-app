import os 
import feedparser
import requests
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables (API Key)
load_dotenv()

# Initialize Google GenAI Client
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
NEWSDATA_API_KEY = os.environ.get("NEWSDATA_API_KEY")

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
    # Using the updated /latest endpoint
    url = f"https://newsdata.io/api/1/latest?apikey={NEWSDATA_API_KEY}&language=en&category=technology"
    
    print(f"--- DEBUG: Attempting to connect to: {url.replace(str(NEWSDATA_API_KEY), 'HIDDEN_KEY')} ---")
    
    try:
        response = requests.get(url)
        data = response.json()
        
        if data.get("status") == "success":
            articles = []
            for article in data.get("results", [])[:5]:
                title = article.get("title", "No Title")
                description = article.get("description") or "No description provided."
                articles.append(f"Title: {title}\nSummary: {description}")
            return "\n\n".join(articles)
        else:
            print(f"--- DEBUG API REJECTED: {data} ---")
            return f"Error: {data}"
            
    except Exception as e:
        # THIS is the crucial line we were missing! It will print the exact crash reason.
        print(f"--- DEBUG FATAL CRASH: {str(e)} ---") 
        return f"Error connecting to news server: {str(e)}"

@app.post("/api/chat")
def handle_chat(request: ChatRequest):
    news_data = fetch_tech_news()
    
    if request.time_available_minutes <= 2:
        prompt_instruction = "Give a very brief, punchy summary of the top 2 stories. Keep it under 3 sentences total. Make it conversational and ready for a quick read."
    elif request.time_available_minutes <= 10:
        prompt_instruction = "Give a moderate summary of the top 3 stories. Spend a few sentences on each. Use bullet points for readability."
    else:
        prompt_instruction = "Provide a deep dive into all 5 stories provided. Give detailed context and break down why each matters."

    full_prompt = f"""
    You are a modern, highly efficient news assistant. 
    The user said: "{request.user_message}"
    
    Here is the latest tech news:
    {news_data}
    
    Instructions for your response based on the user's time limit ({request.time_available_minutes} minutes):
    {prompt_instruction}
    """

    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=full_prompt
        )
        return {"reply": response.text}
    except Exception as e:
        return {"reply": f"Sorry, I ran into an error generating your news: {str(e)}"}