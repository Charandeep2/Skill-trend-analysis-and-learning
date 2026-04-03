import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function App() {
  const [currentView, setCurrentView] = useState("market"); 
  const [skill, setSkill] = useState("");
  const [chartData, setChartData] = useState([]);
  
  const [flowStage, setFlowStage] = useState(0); 
  const [xp, setXp] = useState(10000);
  const [loading, setLoading] = useState(false);
  
  const [roadmap, setRoadmap] = useState([]);
  const [lessonText, setLessonText] = useState(""); 
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0); 
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState("");
  
  const [quizData, setQuizData] = useState(null); 
  const [userAnswers, setUserAnswers] = useState({}); 
  const [quizResults, setQuizResults] = useState(null); 
  
  const [academyStage, setAcademyStage] = useState("idle"); 

  const [activeTheme, setActiveTheme] = useState("cyberpunk");
  const [showSettings, setShowSettings] = useState(false);

  const [leaderboard, setLeaderboard] = useState([
    { name: "Neo_Hacker", xp: 18500 },
    { name: "Trinity_01", xp: 14200 },
    { name: "Morpheus_Net", xp: 11000 },
    { name: "Cypher_Bug", xp: -1500 }
  ]);

  // --- THEME DICTIONARY ---
  const themes = {
    cyberpunk: {
      bg: '#050505',
      panelBg: '#000000',
      textMain: '#0f0',
      textSec: '#aaa',
      accent: '#fbbf24',
      accentBg: '#fbbf24', 
      border: '#0f0',
      font: '"Courier New", Courier, monospace',
      radius: '0px',
      shadow: 'none',
      btnBg: '#000',
      btnText: '#0f0',
      btnActiveBg: '#0f0',
      btnActiveText: '#000',
      chartHistory: '#3b82f6',
      chartForecast: '#fbbf24',
      chartGrid: '#111',
      chatAiBorder: '#fbbf24',
      chatUserBorder: '#3b82f6'
    },
    modern: {
      bg: '#f8fafc', 
      panelBg: '#ffffff', 
      textMain: '#0f172a', 
      textSec: '#64748b', 
      accent: '#8b5cf6', 
      accentBg: 'linear-gradient(135deg, #8b5cf6, #ec4899)', 
      border: '#e2e8f0', 
      font: '"Inter", system-ui, -apple-system, sans-serif',
      radius: '16px', 
      shadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', 
      btnBg: '#f1f5f9',
      btnText: '#334155',
      btnActiveBg: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
      btnActiveText: '#ffffff',
      chartHistory: '#8b5cf6', 
      chartForecast: '#ec4899', 
      chartGrid: '#f1f5f9',
      chatAiBorder: '#e2e8f0',
      chatUserBorder: '#3b82f6'
    }
  };

  const t = themes[activeTheme];

  // --- LOGIC FUNCTIONS ---
  const handleSelectSkill = async (s) => {
    setSkill(s); setFlowStage(1); setLoading(true); setChartData([]); 
    try {
      const res = await fetch("http://127.0.0.1:8000/api/analyze_skill", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ skill: s }) });
      const data = await res.json(); setChartData(data.historical_data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleAskPrediction = async () => {
    if (!window.confirm(`Do you want the AI to predict the future trend for ${skill}?`)) return;
    setFlowStage(2); setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/predict_skill", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ skill }) });
      const data = await res.json(); setChartData(prev => [...prev, ...data.prediction_data]); setFlowStage(3);
    } catch (e) { setFlowStage(1); } finally { setLoading(false); }
  };

  const generateRoadmap = async () => {
    if (!window.confirm(`Invest 500 XP to generate a custom roadmap?`)) return;
    if (xp < 500) return alert("INSUFFICIENT XP.");
    setXp(xp - 500); setCurrentView("academy"); setAcademyStage("generating"); setRoadmap([]);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/roadmap/${skill}`);
      const data = await res.json(); setRoadmap(data.roadmap);
    } catch (e) { console.error(e); } finally { setAcademyStage("ready"); }
  };

  const initiateTraining = async () => {
    setAcademyStage("training"); setCurrentLessonIndex(0);
    setChat([{role: 'ai', text: `Training initiated. Ask doubts here.`}]); animateLoading();
    try {
      const topic = roadmap.length > 0 ? roadmap[0].topic : "Fundamentals";
      const res = await fetch("http://127.0.0.1:8000/api/generate_lesson", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ skill, topic }) });
      const data = await res.json(); setLessonText(data.lesson); 
    } catch (e) { setLessonText("Error loading."); }
  };

  const loadNextLesson = async () => {
    const nextIndex = currentLessonIndex + 1;
    if (nextIndex >= roadmap.length) return; 
    setCurrentLessonIndex(nextIndex); animateLoading();
    try {
      const topic = roadmap[nextIndex].topic;
      const res = await fetch("http://127.0.0.1:8000/api/generate_lesson", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ skill, topic }) });
      const data = await res.json(); setLessonText(data.lesson); 
    } catch (e) { setLessonText("Error loading."); }
  };

  const animateLoading = () => {
    const phrases = ["ESTABLISHING LINK...", "EXTRACTING DATA...", "COMPILING LESSON..."];
    let i = 0; setLessonText(phrases[0]);
    const intv = setInterval(() => { i = (i + 1) % phrases.length; setLessonText(phrases[i]); }, 1000);
    setTimeout(() => clearInterval(intv), 10000); 
  };

  const loadMockQuiz = async () => {
    setQuizData("loading"); setUserAnswers({}); setQuizResults(null); 
    try {
      const topic = roadmap[currentLessonIndex]?.topic || "Basics";
      const res = await fetch("http://127.0.0.1:8000/api/generate_quiz", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ skill, topic }) });
      const data = await res.json(); setQuizData(data.quiz); 
    } catch (e) { setQuizData(null); }
  };

  const submitQuiz = () => {
    let earned = 0; let penalty = 0;
    quizData.forEach((q, idx) => {
      const userAns = userAnswers[idx];
      if (userAns && (userAns === q.a || userAns.includes(q.a) || q.a.includes(userAns))) { earned += 1000; } else { penalty += 250; }
    });
    setXp(xp + (earned - penalty));
    setQuizResults({ earned, penalty, netXp: earned - penalty });
  };

  const askTeacher = async () => {
    if (!chatInput) return;
    setChat(prev => [...prev, {role: 'user', text: chatInput}]);
    const currentInput = chatInput; setChatInput("");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/chat_teacher", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ message: currentInput, skill }) });
      const data = await res.json(); setChat(prev => [...prev, {role: 'ai', text: data.response}]);
    } catch (e) { console.error(e); }
  };

  const getRankedLeaderboard = () => [...leaderboard, { name: "YOU (NETRUNNER)", xp: xp, isUser: true }].sort((a, b) => b.xp - a.xp);

  // --- STYLING HELPERS ---
  const smoothTransition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
  
  const baseBtn = { 
    padding: '10px 20px', 
    border: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : 'none', 
    borderRadius: t.radius,
    cursor: 'pointer', 
    fontWeight: 'bold', 
    transition: smoothTransition,
    boxShadow: activeTheme === 'modern' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
  };

  const panelStyle = {
    border: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : 'none',
    backgroundColor: t.panelBg,
    borderRadius: t.radius,
    boxShadow: t.shadow,
    transition: smoothTransition,
    padding: '30px'
  };

  return (
    // Note the width: '100%' and minHeight: '100vh' being enforced here
    <div style={{ backgroundColor: t.bg, color: t.textMain, minHeight: '100vh', width: '100%', fontFamily: t.font, display: 'flex', flexDirection: 'column', transition: smoothTransition }}>
      
      {/* HEADER */}
      <div style={{ borderBottom: activeTheme === 'cyberpunk' ? `2px solid ${t.border}` : 'none', boxShadow: activeTheme === 'modern' ? '0 4px 20px rgba(0,0,0,0.05)' : 'none', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', backgroundColor: t.panelBg, transition: smoothTransition, zIndex: 10 }}>
        <h2 style={{ margin: 0, background: activeTheme === 'modern' ? t.accentBg : 'none', WebkitBackgroundClip: activeTheme === 'modern' ? 'text' : 'none', WebkitTextFillColor: activeTheme === 'modern' ? 'transparent' : t.textMain }}>
          SKILL_STREET <span style={{ color: t.textSec, WebkitTextFillColor: 'initial' }}>// ACADEMY</span>
        </h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button onClick={() => setCurrentView("market")} style={{...baseBtn, background: currentView === 'market' ? t.btnActiveBg : t.btnBg, color: currentView === 'market' ? t.btnActiveText : t.textMain}}>1. TERMINAL</button>
          <button onClick={() => setCurrentView("academy")} style={{...baseBtn, background: currentView === 'academy' ? t.btnActiveBg : t.btnBg, color: currentView === 'academy' ? t.btnActiveText : t.textMain}}>2. ACADEMY</button>
          <button onClick={() => setCurrentView("leaderboard")} style={{...baseBtn, background: currentView === 'leaderboard' ? t.btnActiveBg : t.btnBg, color: currentView === 'leaderboard' ? t.btnActiveText : t.textMain}}>3. LEADERBOARD</button>
          
          <button onClick={() => setShowSettings(true)} className="hover-scale" style={{...baseBtn, background: t.btnBg, color: t.textMain, fontSize: '1.2rem', padding: '8px 15px'}}>⚙️</button>
          
          <h2 style={{ margin: 0, color: t.accent, marginLeft: '20px' }}>XP: {xp}</h2>
        </div>
      </div>

      {/* MAIN CONTENT AREA - WIDENED TO 1600px / 95% */}
      <div style={{ padding: '40px', maxWidth: '1600px', margin: '0 auto', width: '95%', flexGrow: 1 }}>
        
        {/* ==================== MARKET VIEW ==================== */}
        {currentView === "market" && (
          <div className="fade-in">
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ borderBottom: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : 'none', paddingBottom: '10px' }}>STEP 1: SELECT TARGET DATA-STREAM</h3>
              <div style={{ display: 'flex', gap: '15px' }}>
                {["Python", "React", "Rust"].map(s => (
                  <button key={s} onClick={() => handleSelectSkill(s)} className="hover-scale" style={{...baseBtn, background: skill === s ? t.btnActiveBg : t.btnBg, color: skill === s ? t.btnActiveText : t.textMain}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {flowStage >= 1 && (
              <div style={{...panelStyle, marginBottom: '30px'}}>
                <h3 style={{ color: flowStage >= 3 ? t.accent : t.textMain }}>{skill.toUpperCase()} // {flowStage >= 3 ? "AI FORECAST" : "HISTORICAL"}</h3>
                <div style={{ height: '400px' }}> {/* Increased chart height slightly for big screens */}
                  <ResponsiveContainer>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
                      <XAxis dataKey="ds" stroke={t.textSec} minTickGap={30} axisLine={false} tickLine={false} />
                      <YAxis stroke={t.textSec} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{background: t.panelBg, border: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : 'none', borderRadius: t.radius, color: t.textMain, boxShadow: t.shadow}} />
                      
                      <defs>
                        <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={t.chartHistory} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={t.chartHistory} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={t.chartForecast} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={t.chartForecast} stopOpacity={0}/>
                        </linearGradient>
                      </defs>

                      <Area type="monotone" dataKey="historical" stroke={t.chartHistory} fillOpacity={1} fill="url(#colorHistory)" strokeWidth={3} />
                      <Area type="monotone" dataKey="forecast" stroke={t.chartForecast} fillOpacity={1} fill="url(#colorForecast)" strokeWidth={4} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {flowStage === 1 && <div style={{ padding: '20px', border: activeTheme === 'cyberpunk' ? `1px dashed ${t.border}` : 'none', backgroundColor: activeTheme === 'modern' ? '#ffffff' : t.bg, textAlign: 'center', borderRadius: t.radius, boxShadow: t.shadow }}><button onClick={handleAskPrediction} className="hover-scale" style={{ padding: '15px 40px', background: activeTheme === 'modern' ? t.accentBg : t.textMain, color: activeTheme === 'modern' ? '#fff' : t.bg, border: 'none', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '50px', boxShadow: activeTheme === 'modern' ? '0 10px 20px rgba(236, 72, 153, 0.3)' : 'none', transition: smoothTransition }}>PREDICT FUTURE TREND</button></div>}
            {flowStage === 3 && <div style={{ padding: '20px', border: activeTheme === 'cyberpunk' ? `1px solid ${t.accent}` : 'none', backgroundColor: activeTheme === 'modern' ? '#ffffff' : t.bg, marginTop: '20px', textAlign: 'center', borderRadius: t.radius, boxShadow: t.shadow }}><h3 style={{ color: t.accent, marginTop: 0 }}>PREDICTION COMPLETE.</h3><button onClick={generateRoadmap} className="hover-scale" style={{ padding: '15px 40px', background: t.accentBg, color: activeTheme === 'modern' ? '#fff' : t.panelBg, border: 'none', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '50px', boxShadow: activeTheme === 'modern' ? '0 10px 20px rgba(139, 92, 246, 0.3)' : 'none', transition: smoothTransition }}>GENERATE ROADMAP (500 XP)</button></div>}
          </div>
        )}

        {/* ==================== LEADERBOARD VIEW ==================== */}
        {currentView === "leaderboard" && (
          <div className="fade-in" style={{...panelStyle, maxWidth: '1000px', margin: '0 auto'}}>
             <h2 style={{ color: t.accent, borderBottom: activeTheme === 'cyberpunk' ? `2px dashed ${t.accent}` : `1px solid ${t.border}`, paddingBottom: '10px', textAlign: 'center' }}>GLOBAL RANKINGS</h2>
             <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
               {getRankedLeaderboard().map((user, idx) => (
                 <div key={idx} className="hover-float" style={{ display: 'flex', justifyContent: 'space-between', padding: '25px', backgroundColor: user.isUser ? (activeTheme==='cyberpunk'?'#1a1a00':'#f5f3ff') : (activeTheme==='cyberpunk'? '#000' : '#f8fafc'), border: user.isUser ? `2px solid ${t.accent}` : (activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : 'none'), fontSize: '1.5rem', fontWeight: user.isUser ? 'bold' : 'normal', borderRadius: t.radius, transition: smoothTransition }}>
                   <div style={{ color: user.isUser ? t.accent : t.textMain }}>#{idx + 1} {user.name}</div>
                   <div style={{ color: user.xp < 0 ? '#f43f5e' : (activeTheme === 'modern' ? '#10b981' : '#0f0') }}>{user.xp} XP</div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* ==================== ACADEMY VIEW ==================== */}
        {currentView === "academy" && (
          <div className="fade-in" style={{ display: academyStage === "training" ? 'grid' : 'block', gridTemplateColumns: academyStage === "training" ? '1.2fr 0.8fr' : 'none', gap: '30px', height: '100%' }}>
            
            {academyStage !== "training" ? (
              <div style={{...panelStyle, overflowY: 'auto', maxHeight: '75vh', maxWidth: '1000px', margin: '0 auto'}}>
                {academyStage === "generating" && <div style={{ textAlign: 'center', color: t.accent, padding: '80px 0', fontSize: '1.5rem' }}><p className="pulse">GENERATING CUSTOM ROADMAP...</p></div>}
                {academyStage === "ready" && (
                  <div className="fade-in">
                    <h3 style={{ borderBottom: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : `1px solid ${t.border}`, paddingBottom: '10px' }}>MISSION MAP: {skill.toUpperCase()}</h3>
                    {roadmap.map(w => (
                      <div key={w.week} style={{ marginBottom: '25px', borderLeft: `4px solid ${activeTheme === 'modern' ? t.accent : t.border}`, paddingLeft: '20px', background: activeTheme === 'modern' ? '#f8fafc' : 'none', padding: activeTheme === 'modern' ? '15px 20px' : '0 0 0 20px', borderRadius: activeTheme === 'modern' ? '0 12px 12px 0' : '0' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: activeTheme === 'modern' ? t.accent : t.textMain, fontSize: '1.2rem' }}>WEEK {w.week}: {w.topic}</h4>
                        <ul style={{ margin: 0, paddingLeft: '20px', color: t.textSec, lineHeight: '1.6' }}>{w.tasks && w.tasks.map(t => <li key={t}>{t}</li>)}</ul>
                      </div>
                    ))}
                    <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '30px' }}>
                      <button onClick={initiateTraining} className="hover-scale" style={{ padding: '20px 50px', background: t.btnActiveBg, color: t.btnActiveText, border: 'none', fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '50px', boxShadow: activeTheme === 'modern' ? '0 10px 25px rgba(59, 130, 246, 0.4)' : 'none', transition: smoothTransition }}>START LEARNING PROTOCOL</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{...panelStyle, padding: 0, display: 'flex', flexDirection: 'column', height: '75vh', overflow: 'hidden'}}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : `1px solid ${t.border}`, padding: '20px', background: activeTheme === 'modern' ? '#f8fafc' : t.bg }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: t.accent }}>MODULE {currentLessonIndex + 1}: {roadmap[currentLessonIndex]?.topic.toUpperCase()}</h3>
                </div>
                
                <div style={{ flexGrow: 1, padding: '30px', overflowY: 'auto', color: t.textMain, fontSize: '1.1rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                  {lessonText.includes("...") ? <div style={{ textAlign: 'center', color: t.accent, marginTop: '100px', fontSize: '1.5rem' }}><span className="pulse gradient-text">{lessonText}</span></div> : lessonText}
                </div>

                <div style={{ padding: '20px', borderTop: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : `1px solid ${t.border}`, backgroundColor: activeTheme === 'modern' ? '#ffffff' : t.bg, display: 'flex', gap: '15px' }}>
                  <button onClick={loadMockQuiz} className="hover-scale" style={{ flex: 1, padding: '15px', background: activeTheme === 'modern' ? '#f1f5f9' : t.accent, color: activeTheme === 'modern' ? '#334155' : t.panelBg, border: 'none', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', transition: smoothTransition }}>TAKE MOCK QUIZ</button>
                  {currentLessonIndex < roadmap.length - 1 && (
                    <button onClick={loadNextLesson} className="hover-scale" style={{ flex: 1, padding: '15px', background: t.btnActiveBg, color: activeTheme === 'modern' ? '#fff' : t.bg, border: 'none', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', transition: smoothTransition, boxShadow: activeTheme === 'modern' ? '0 4px 15px rgba(59, 130, 246, 0.3)' : 'none' }}>NEXT MODULE ➔</button>
                  )}
                </div>
              </div>
            )}

            {academyStage === "training" && (
              <div style={{...panelStyle, padding: 0, display: 'flex', flexDirection: 'column', height: '75vh', overflow: 'hidden'}}>
                <h3 style={{ padding: '20px', margin: 0, borderBottom: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : `1px solid ${t.border}`, background: activeTheme === 'modern' ? '#f8fafc' : t.bg, color: t.textMain }}>AI MENTOR</h3>
                <div style={{ flexGrow: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {chat.map((m, i) => (
                    <div key={i} className="fade-in slide-up" style={{ alignSelf: m.role === 'ai' ? 'flex-start' : 'flex-end', maxWidth: '85%', padding: '15px 20px', border: activeTheme === 'cyberpunk' ? `1px solid ${m.role === 'ai' ? t.chatAiBorder : t.chatUserBorder}` : 'none', backgroundColor: m.role === 'ai' ? (activeTheme==='modern' ? '#f1f5f9' : t.bg) : (activeTheme==='modern' ? '#3b82f6' : t.bg), color: m.role === 'ai' ? t.textMain : (activeTheme==='modern' ? '#fff' : t.textMain), lineHeight: '1.6', borderRadius: m.role === 'ai' ? '16px 16px 16px 4px' : '16px 16px 4px 16px', boxShadow: activeTheme === 'modern' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none' }}>
                      <strong style={{color: m.role === 'ai' ? (activeTheme === 'modern' ? '#8b5cf6' : t.accent) : (activeTheme === 'modern' ? '#fff' : t.chartHistory), display: 'block', marginBottom: '5px', fontSize: '0.9rem'}}>{m.role === 'ai' ? 'ARCHITECT' : 'YOU'}</strong>
                      {m.text}
                    </div>
                  ))}
                </div>
                <div style={{ padding: '20px', borderTop: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : `1px solid ${t.border}`, display: 'flex', gap: '10px', backgroundColor: activeTheme === 'modern' ? '#ffffff' : t.bg }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && askTeacher()} style={{ flexGrow: 1, background: activeTheme === 'modern' ? '#f1f5f9' : t.panelBg, color: t.textMain, border: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : 'none', padding: '15px 20px', outline: 'none', borderRadius: '50px', transition: smoothTransition }} placeholder="Ask a doubt..." />
                  <button onClick={askTeacher} className="hover-scale" style={{...baseBtn, background: t.btnActiveBg, color: activeTheme === 'modern' ? '#fff' : t.panelBg, padding: '0 30px', borderRadius: '50px', border: 'none', boxShadow: activeTheme === 'modern' ? '0 4px 15px rgba(59, 130, 246, 0.3)' : 'none'}}>SEND</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== THEME SETTINGS MODAL ==================== */}
      {showSettings && (
        <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: t.panelBg, border: activeTheme === 'cyberpunk' ? `2px solid ${t.border}` : 'none', padding: '40px', borderRadius: '24px', width: '400px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h2 style={{ color: t.textMain, marginTop: 0, marginBottom: '30px' }}>SYSTEM U.I.</h2>
            
            <button onClick={() => { setActiveTheme("cyberpunk"); setShowSettings(false); }} className="hover-scale"
              style={{ width: '100%', padding: '15px', marginBottom: '15px', background: '#000', color: '#0f0', border: '2px solid #0f0', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: '"Courier New", monospace', transition: smoothTransition }}>
              💻 CYBERPUNK (DARK)
            </button>
            
            <button onClick={() => { setActiveTheme("modern"); setShowSettings(false); }} className="hover-scale"
              style={{ width: '100%', padding: '15px', marginBottom: '30px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'system-ui, sans-serif', boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.3)', transition: smoothTransition }}>
              ✨ MODERN (LIGHT)
            </button>
            
            <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: t.textSec, cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}>Close Interface</button>
          </div>
        </div>
      )}

      {/* ==================== QUIZ MODAL ==================== */}
      {quizData && (
        <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ border: activeTheme === 'cyberpunk' ? `2px solid ${t.accent}` : 'none', background: t.panelBg, padding: '40px', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', boxShadow: activeTheme === 'modern' ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : 'none' }}>
            
            {quizData === "loading" && <div style={{ textAlign: 'center', color: t.accent, fontSize: '1.5rem', padding: '50px' }}><span className="pulse">GENERATING MOCK ASSESSMENT...</span></div>}

            {quizData !== "loading" && !quizResults && (
              <div className="fade-in">
                <h2 style={{ color: t.accent, marginTop: 0, borderBottom: `1px solid ${t.border}`, paddingBottom: '10px' }}>MOCK ASSESSMENT</h2>
                {quizData.map((q, idx) => (
                  <div key={idx} style={{ marginBottom: '30px', padding: '25px', border: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : 'none', backgroundColor: activeTheme === 'modern' ? '#f8fafc' : t.bg, borderRadius: '16px' }}>
                    <p style={{ fontSize: '1.2rem', marginBottom: '20px', fontWeight: 'bold' }}>{idx + 1}. {q.q}</p>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {q.options && q.options.map((opt, optIdx) => {
                        const isSelected = userAnswers[idx] === opt;
                        return (
                          <div key={optIdx} onClick={() => setUserAnswers({...userAnswers, [idx]: opt})}
                            style={{ padding: '15px', border: isSelected ? `2px solid ${activeTheme==='modern' ? '#8b5cf6' : t.textMain}` : `1px solid ${t.border}`, backgroundColor: isSelected ? (activeTheme === 'modern' ? '#f3e8ff' : '#111') : t.panelBg, color: isSelected ? (activeTheme === 'modern' ? '#7e22ce' : t.textMain) : t.textMain, cursor: 'pointer', borderRadius: '8px', transition: smoothTransition, fontWeight: isSelected ? 'bold' : 'normal' }}>
                            {opt}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                  <button onClick={submitQuiz} className="hover-scale" style={{ flex: 1, padding: '18px', background: t.btnActiveBg, color: activeTheme === 'modern' ? '#fff' : t.panelBg, border: 'none', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '12px', boxShadow: activeTheme === 'modern' ? '0 10px 15px -3px rgba(59, 130, 246, 0.3)' : 'none' }}>SUBMIT ANSWERS</button>
                  <button onClick={() => setQuizData(null)} style={{ padding: '18px 30px', background: 'none', color: t.textSec, border: `2px solid ${t.border}`, cursor: 'pointer', borderRadius: '12px', fontWeight: 'bold' }}>CANCEL</button>
                </div>
              </div>
            )}

            {quizResults && (
              <div className="fade-in slide-up">
                <h2 style={{ color: quizResults.netXp > 0 ? (activeTheme==='modern'?'#10b981':'#0f0') : (activeTheme==='modern'?'#f43f5e':'#ef4444'), marginTop: 0, borderBottom: `1px solid ${t.border}`, paddingBottom: '15px', textAlign: 'center' }}>ASSESSMENT COMPLETE</h2>
                <div style={{ display: 'flex', justifyContent: 'space-around', margin: '30px 0', fontSize: '1.2rem', background: activeTheme === 'modern' ? '#f8fafc' : t.bg, padding: '25px', borderRadius: '16px', fontWeight: 'bold' }}>
                  <span style={{ color: activeTheme==='modern'?'#10b981':'#0f0' }}>EARNED: +{quizResults.earned}</span>
                  <span style={{ color: activeTheme==='modern'?'#f43f5e':'#ef4444' }}>PENALTY: -{quizResults.penalty}</span>
                  <span style={{ color: t.accent, fontSize: '1.4rem' }}>NET: {quizResults.netXp} XP</span>
                </div>
                {quizData.map((q, idx) => {
                  const userAns = userAnswers[idx];
                  const isCorrect = userAns && (userAns === q.a || userAns.includes(q.a) || q.a.includes(userAns));
                  return (
                    <div key={idx} style={{ marginBottom: '20px', padding: '25px', borderLeft: isCorrect ? `6px solid ${activeTheme==='modern'?'#10b981':'#0f0'}` : `6px solid ${activeTheme==='modern'?'#f43f5e':'#ef4444'}`, backgroundColor: activeTheme === 'modern' ? '#f8fafc' : t.bg, borderRadius: '12px' }}>
                      <p style={{ fontWeight: 'bold', margin: '0 0 15px 0', fontSize: '1.1rem' }}>Q: {q.q}</p>
                      <p style={{ color: isCorrect ? (activeTheme==='modern'?'#10b981':'#0f0') : (activeTheme==='modern'?'#f43f5e':'#ef4444'), margin: '0 0 10px 0', fontWeight: 'bold' }}>Your Answer: {userAns || "None"}</p>
                      {!isCorrect && (
                        <>
                          <p style={{ color: activeTheme==='modern'?'#10b981':'#0f0', margin: '0 0 10px 0', fontWeight: 'bold' }}>Correct Answer: {q.a}</p>
                          <p style={{ color: t.textSec, margin: 0, fontStyle: 'italic', lineHeight: '1.5' }}>Explanation: {q.explanation}</p>
                        </>
                      )}
                    </div>
                  );
                })}
                <button onClick={() => setQuizData(null)} className="hover-scale" style={{ width: '100%', padding: '20px', background: t.btnActiveBg, color: activeTheme === 'modern' ? '#fff' : t.bg, border: 'none', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '30px', borderRadius: '12px', boxShadow: activeTheme === 'modern' ? '0 10px 15px -3px rgba(59, 130, 246, 0.3)' : 'none' }}>RETURN TO ACADEMY</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- GLOBAL CSS INJECTIONS FOR FULL SCREEN & ANIMATIONS --- */}
      <style>{`
        /* GLOBAL DIMENSION RESET */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { 
          width: 100vw; 
          min-height: 100vh; 
          background-color: ${t.bg}; 
          transition: background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .pulse { animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
        
        .fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .slide-up { animation: slideUp 0.4s ease-out forwards; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .hover-scale { transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .hover-scale:hover { transform: scale(1.03); }
        .hover-scale:active { transform: scale(0.97); }

        .hover-float { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .hover-float:hover { transform: translateY(-5px); box-shadow: ${activeTheme === 'modern' ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : 'none'}; }

        .gradient-text {
          background: linear-gradient(135deg, #3b82f6, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: ${t.bg}; transition: background 0.4s; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${t.textSec}; }
      `}</style>
    </div>
  );
}

export default App;