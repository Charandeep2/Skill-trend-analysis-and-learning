from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import xgboost as xgb
import ollama
import json
import re
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def safe_parse_json(text, fallback):
    try:
        match = re.search(r'\[.*\]|\{.*\}', text, re.DOTALL)
        if match: return json.loads(match.group(0))
        return json.loads(text)
    except: return fallback

try:
    if not os.path.exists('master_market_data.csv'):
        dates = pd.date_range(start='2022-01-01', periods=104, freq='W')
        df_dummy = pd.DataFrame({
            'ds': dates.tolist() * 3,
            'skill': ['Python']*104 + ['React']*104 + ['Rust']*104,
            'y': np.random.randint(50, 100, size=312).tolist()
        })
        df_dummy.to_csv('master_market_data.csv', index=False)
    master_df = pd.read_csv('master_market_data.csv')
    master_df['ds'] = pd.to_datetime(master_df['ds'])
except Exception as e:
    master_df = pd.DataFrame(columns=['ds', 'skill', 'y'])

# ==========================================
# 📊 1. MARKET ANALYSIS & 📈 2. PREDICTION
# ==========================================
@app.post("/api/analyze_skill")
async def analyze_skill(data: dict = Body(...)):
    skill = data.get("skill", "")
    df = master_df[master_df['skill'].str.lower() == skill.lower()].copy()
    if df.empty: return {"historical_data": []}
    df['y'] = pd.to_numeric(df['y'], errors='coerce').fillna(50)
    history = df[['ds', 'y']].tail(52)
    history.columns = ['ds', 'historical']
    history['ds'] = history['ds'].dt.strftime('%Y-%m-%d')
    return {"historical_data": history.to_dict(orient="records")}

@app.post("/api/predict_skill")
async def predict_skill(data: dict = Body(...)):
    skill = data.get("skill", "")
    try:
        df = master_df[master_df['skill'].str.lower() == skill.lower()].copy()
        if df.empty: raise ValueError("Skill not found.")
        df['y'] = pd.to_numeric(df['y'], errors='coerce').fillna(50)

        X = np.column_stack((df['ds'].dt.year.to_numpy(dtype=float), df['ds'].dt.month.to_numpy(dtype=float), df['ds'].dt.isocalendar().week.to_numpy(dtype=float)))
        y = df['y'].to_numpy(dtype=float)
        
        model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1, objective='reg:squarederror')
        model.fit(X, y)
        
        future_dates = pd.date_range(start=df['ds'].max(), periods=104, freq='W')
        future_X = np.column_stack((future_dates.year.to_numpy(dtype=float), future_dates.month.to_numpy(dtype=float), future_dates.isocalendar().week.to_numpy(dtype=float)))
        
        preds = model.predict(future_X)
        res = pd.DataFrame({'ds': future_dates.strftime('%Y-%m-%d'), 'forecast': [float(p) for p in preds]})
        return {"prediction_data": res.to_dict(orient="records")}
    except Exception as e:
        start_date = pd.Timestamp.now()
        future_dates = pd.date_range(start=start_date, periods=104, freq='W')
        np.random.seed(42) 
        simulated_preds = np.clip(60 + np.linspace(0, 15, 104) + np.sin(np.linspace(0, 6 * np.pi, 104)) * 8 + np.random.normal(0, 2, 104), 5, 100)
        res = pd.DataFrame({'ds': future_dates.strftime('%Y-%m-%d'), 'forecast': simulated_preds.tolist()})
        return {"prediction_data": res.to_dict(orient="records")}

# ==========================================
# 🗺️ 3. ROADMAP GENERATOR
# ==========================================
@app.get("/api/roadmap/{skill}")
async def get_ai_roadmap(skill: str):
    fallback_roadmap = [
        {"week": 1, "topic": f"{skill.capitalize()} Fundamentals", "tasks": ["Basic Syntax & Setup", "Variables & Data Types", "Control Flow (If/Else)"]},
        {"week": 2, "topic": "Intermediate Concepts", "tasks": ["Functions & Scope", "Data Structures", "Error Handling"]},
        {"week": 3, "topic": "Advanced Application", "tasks": ["Object-Oriented Design", "Working with APIs", "File I/O"]},
        {"week": 4, "topic": "Mastery & Projects", "tasks": ["Build a Capstone Project", "Code Optimization", "Deployment"]}
    ]
    prompt = f"Create a 4-week tech roadmap for {skill}. Output ONLY a raw JSON array: [{{'week': 1, 'topic': '...', 'tasks': ['...', '...']}}]"
    try:
        res = ollama.chat(model='llama3', messages=[{'role': 'user', 'content': prompt}])
        final_roadmap = safe_parse_json(res['message']['content'], fallback_roadmap)
        if len(final_roadmap) == 0: final_roadmap = fallback_roadmap
        return {"roadmap": final_roadmap}
    except: return {"roadmap": fallback_roadmap}

# ==========================================
# 📚 4. LESSON GENERATOR
# ==========================================
@app.post("/api/generate_lesson")
async def generate_lesson(data: dict = Body(...)):
    skill = data.get("skill")
    topic = data.get("topic", "Basics")
    prompt = f"""You are an elite Senior Developer and expert coding tutor. Write a highly detailed, comprehensive, and engaging lesson about '{topic}' in {skill}. Do NOT just give short bullet points. Include: 1. Deep-dive explanations. 2. Real-world analogies. 3. MULTIPLE actual CODE SNIPPETS. 4. Best practices. Format it beautifully."""
    try:
        res = ollama.chat(model='llama3', messages=[{'role': 'system', 'content': 'You are a master technical instructor.'}, {'role': 'user', 'content': prompt}])
        return {"lesson": res['message']['content']}
    except Exception as e:
        return {"lesson": f"Error generating lesson data stream. {str(e)}"}

# ==========================================
# 🤖 5. CHAT TEACHER
# ==========================================
@app.post("/api/chat_teacher")
async def chat_teacher(data: dict = Body(...)):
    prompt = f"You are The Architect, a cyberpunk AI mentor. Answer the user clearly but keep it concise and witty."
    res = ollama.chat(model='llama3', messages=[{'role': 'system', 'content': prompt}, {'role': 'user', 'content': data.get('message')}])
    return {"response": res['message']['content']}

# ==========================================
# 📝 6. THE NEW MULTI-QUESTION QUIZ GENERATOR
# ==========================================
@app.post("/api/generate_quiz")
async def generate_quiz(data: dict = Body(...)):
    skill = data.get("skill")
    topic = data.get("topic")
    
    prompt = f"""Generate a 3-question multiple choice quiz about '{topic}' in {skill}. 
    Output ONLY a raw JSON array. 
    Format: [
      {{"q": "Question text?", "options": ["A", "B", "C", "D"], "a": "A", "explanation": "Explanation of why A is correct."}},
      ...
    ]"""
    
    fallback = [
        {"q": f"AI Timeout. What is {skill}?", "options": ["A Language", "A snake", "Food", "Car"], "a": "A Language", "explanation": "It's a programming language."}
    ]
    
    try:
        res = ollama.chat(model='llama3', messages=[{'role': 'user', 'content': prompt}])
        content = res['message']['content']
        parsed = safe_parse_json(content, fallback)
        if not isinstance(parsed, list): parsed = [parsed] # Ensure it's an array
        return {"quiz": parsed}
    except Exception as e:
        print(f"Quiz error: {e}")
        return {"quiz": fallback}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)