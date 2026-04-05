import { useState, useEffect } from 'react'; // 🔥 Added useEffect here
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const API_BASE = "http://127.0.0.1:8000"; 

function App() {
  const [currentView, setCurrentView] = useState("auth"); 
  const [currentUser, setCurrentUser] = useState(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [skill, setSkill] = useState("");
  const [chartData, setChartData] = useState([]);
  const [flowStage, setFlowStage] = useState(0); 
  const [xp, setXp] = useState(0); 
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

  // 🔥 Now starts as an empty array
  const [leaderboard, setLeaderboard] = useState([]);

  const themes = {
    cyberpunk: {
      bg: '#050505', panelBg: '#0a0a0a', textMain: '#0f0', textSec: '#555', accent: '#fbbf24', accentBg: '#fbbf24', 
      border: '#0f0', font: '"Courier New", Courier, monospace', radius: '4px', shadow: '0 0 15px rgba(0, 255, 0, 0.1)',
      btnBg: '#000', btnText: '#0f0', btnActiveBg: '#0f0', btnActiveText: '#000',
      chartHistory: '#3b82f6', chartForecast: '#fbbf24', chartGrid: '#111', chatAiBorder: '#fbbf24', chatUserBorder: '#3b82f6',
      glow: '0 0 20px rgba(0, 255, 0, 0.4)'
    },
    modern: {
      bg: '#f8fafc', panelBg: '#ffffff', textMain: '#0f172a', textSec: '#64748b', accent: '#8b5cf6', accentBg: 'linear-gradient(135deg, #8b5cf6, #ec4899)', 
      border: '#e2e8f0', font: '"Inter", system-ui, -apple-system, sans-serif', radius: '20px', shadow: '0 10px 30px -5px rgba(0, 0, 0, 0.08)', 
      btnBg: '#f1f5f9', btnText: '#334155', btnActiveBg: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', btnActiveText: '#ffffff',
      chartHistory: '#8b5cf6', chartForecast: '#ec4899', chartGrid: '#f1f5f9', chatAiBorder: '#e2e8f0', chatUserBorder: '#3b82f6',
      glow: '0 15px 30px -5px rgba(139, 92, 246, 0.4)'
    }
  };

  const t = themes[activeTheme];

  // --- DATABASE SYNC & FETCHING ---
  const syncXpToDatabase = async (newXp) => {
    setXp(newXp);
    if (!currentUser) return;
    try {
      await fetch(`${API_BASE}/api/update_xp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser, xp: newXp })
      });
    } catch (e) { console.error("Failed to save XP"); }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leaderboard`);
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch (e) { console.error("Failed to load real-time leaderboard."); }
  };

  // Automatically fetch fresh leaderboard data when viewing the tab or gaining XP
  useEffect(() => {
    if (currentView === "leaderboard") {
      fetchLeaderboard();
    }
  }, [currentView, xp]);

  // --- AUTHENTICATION LOGIC ---
  const handleAuth = async (action) => {
    if (!authEmail || !authPassword) return setAuthError("ENTER CREDENTIALS.");
    if (!authEmail.includes("@")) return setAuthError("MUST BE A VALID EMAIL.");

    setLoading(true); setAuthError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword, action })
      });
      const data = await res.json();
      if (data.status === "success") {
        setCurrentUser(data.username);
        setXp(data.xp);
        setCurrentView("market"); 
      } else {
        setAuthError(data.msg);
      }
    } catch (e) { setAuthError("SERVER OFFLINE. CHECK BACKEND."); } 
    finally { setLoading(false); }
  };

  const handleSelectSkill = async (s) => {
    setSkill(s); setFlowStage(1); setLoading(true); setChartData([]); 
    try {
      const res = await fetch(`${API_BASE}/api/analyze_skill`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skill: s }) });
      const data = await res.json(); setChartData(data.historical_data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleAskPrediction = async () => {
    if (!window.confirm(`Initialize predictive algorithm for ${skill}?`)) return;
    setFlowStage(2); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/predict_skill`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skill }) });
      const data = await res.json(); 
      if (data.prediction_data) setChartData(prev => [...prev, ...data.prediction_data]); 
      setFlowStage(3);
    } catch (e) { setFlowStage(1); } finally { setLoading(false); }
  };

  const generateRoadmap = async () => {
    if (!window.confirm(`Invest 500 XP to generate a custom roadmap?`)) return;
    if (xp < 500) return alert("INSUFFICIENT XP.");
    
    syncXpToDatabase(xp - 500); 
    setCurrentView("academy"); setAcademyStage("generating"); setRoadmap([]);
    
    try {
      const res = await fetch(`${API_BASE}/api/roadmap/${skill}`);
      const data = await res.json(); setRoadmap(data.roadmap || []);
    } catch (e) { console.error(e); } finally { setAcademyStage("ready"); }
  };

  const initiateTraining = async () => {
    setAcademyStage("training"); setCurrentLessonIndex(0);
    setChat([{role: 'ai', text: `Training initiated. I am your local architect. Ask your questions below.`}]); 
    setLessonText("generating");
    try {
      const topic = roadmap.length > 0 ? roadmap[0].topic : "Fundamentals";
      const res = await fetch(`${API_BASE}/api/generate_lesson`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skill, topic }) });
      const data = await res.json(); setLessonText(data.lesson); 
    } catch (e) { setLessonText("Error loading."); }
  };

  const loadNextLesson = async () => {
    const nextIndex = currentLessonIndex + 1;
    if (nextIndex >= roadmap.length) return; 
    setCurrentLessonIndex(nextIndex); setLessonText("generating");
    try {
      const topic = roadmap[nextIndex].topic;
      const res = await fetch(`${API_BASE}/api/generate_lesson`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skill, topic }) });
      const data = await res.json(); setLessonText(data.lesson); 
    } catch (e) { setLessonText("Error loading."); }
  };

  const loadMockQuiz = async () => {
    setQuizData("loading"); setUserAnswers({}); setQuizResults(null); 
    try {
      const topic = roadmap[currentLessonIndex]?.topic || "Basics";
      const res = await fetch(`${API_BASE}/api/generate_quiz`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skill, topic }) });
      const data = await res.json(); setQuizData(data.quiz || []); 
    } catch (e) { setQuizData(null); }
  };

  const submitQuiz = () => {
    let earned = 0; let penalty = 0;
    if(quizData && quizData !== "loading") {
      quizData.forEach((q, idx) => {
        const userAns = userAnswers[idx];
        if (userAns && (userAns === q.a || userAns.includes(q.a) || q.a.includes(userAns))) { earned += 1000; } else { penalty += 250; }
      });
    }
    const net = earned - penalty;
    syncXpToDatabase(xp + net); 
    setQuizResults({ earned, penalty, netXp: net });
  };

  const askTeacher = async () => {
    if (!chatInput) return;
    setChat(prev => [...prev, {role: 'user', text: chatInput}]);
    const currentInput = chatInput; setChatInput("");
    try {
      const res = await fetch(`${API_BASE}/api/chat_teacher`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: currentInput, skill }) });
      const data = await res.json(); setChat(prev => [...prev, {role: 'ai', text: data.response}]);
    } catch (e) { console.error(e); }
  };

  const getDisplayName = () => currentUser ? currentUser.split('@')[0].toUpperCase() : "YOU";
  
  // Maps the real database values into the Leaderboard visualizer
  const getRankedLeaderboard = () => {
    let board = leaderboard.map(u => ({
      name: u.email === currentUser ? `${u.name} (YOU)` : u.name,
      xp: u.xp,
      isUser: u.email === currentUser
    }));
    
    // Fallback: Just in case the user just registered and isn't top 10 yet
    if (currentUser && !board.some(u => u.isUser)) {
      board.push({ name: `${getDisplayName()} (YOU)`, xp: xp, isUser: true });
      board.sort((a, b) => b.xp - a.xp);
    }
    return board;
  };

  const smoothTransition = 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
  const baseBtn = { padding: '12px 24px', border: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : 'none', borderRadius: t.radius, cursor: 'pointer', fontWeight: 'bold', transition: smoothTransition, boxShadow: activeTheme === 'modern' ? '0 4px 6px rgba(0,0,0,0.05)' : 'none', outline: 'none' };
  const panelStyle = { border: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : 'none', backgroundColor: t.panelBg, borderRadius: t.radius, boxShadow: t.shadow, transition: smoothTransition, padding: '35px' };

  return (
    <div style={{ backgroundColor: t.bg, color: t.textMain, minHeight: '100vh', width: '100%', fontFamily: t.font, display: 'flex', flexDirection: 'column', transition: smoothTransition }}>
      
      {/* HEADER (Only show if logged in) */}
      {currentUser && (
        <div style={{ borderBottom: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : 'none', boxShadow: activeTheme === 'modern' ? '0 4px 20px rgba(0,0,0,0.03)' : 'none', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: t.panelBg, transition: smoothTransition, zIndex: 10 }}>
          <h2 style={{ margin: 0, letterSpacing: '2px', background: activeTheme === 'modern' ? t.accentBg : 'none', WebkitBackgroundClip: activeTheme === 'modern' ? 'text' : 'none', WebkitTextFillColor: activeTheme === 'modern' ? 'transparent' : t.textMain }}>
            SKILL_STREET <span style={{ color: t.textSec, WebkitTextFillColor: 'initial', fontWeight: 'normal' }}>// {getDisplayName()}</span>
          </h2>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <button onClick={() => setCurrentView("market")} className="nav-btn" style={{...baseBtn, background: currentView === 'market' ? t.btnActiveBg : t.btnBg, color: currentView === 'market' ? t.btnActiveText : t.textMain}}>1. TERMINAL</button>
            <button onClick={() => setCurrentView("academy")} className="nav-btn" style={{...baseBtn, background: currentView === 'academy' ? t.btnActiveBg : t.btnBg, color: currentView === 'academy' ? t.btnActiveText : t.textMain}}>2. ACADEMY</button>
            <button onClick={() => setCurrentView("leaderboard")} className="nav-btn" style={{...baseBtn, background: currentView === 'leaderboard' ? t.btnActiveBg : t.btnBg, color: currentView === 'leaderboard' ? t.btnActiveText : t.textMain}}>3. LEADERBOARD</button>
            <button onClick={() => {setCurrentUser(null); setCurrentView("auth");}} className="nav-btn" style={{...baseBtn, background: t.btnBg, color: t.textSec}}>LOGOUT</button>
            <button onClick={() => setShowSettings(true)} className="icon-btn" style={{...baseBtn, background: t.btnBg, color: t.textMain, fontSize: '1.2rem', padding: '10px 15px', borderRadius: '50%'}}>⚙️</button>
            <h2 className="pulse-slow" style={{ margin: 0, color: t.accent, marginLeft: '20px', textShadow: activeTheme === 'cyberpunk' ? t.glow : 'none' }}>XP: {xp}</h2>
          </div>
        </div>
      )}

      <div style={{ padding: '40px', maxWidth: '1600px', margin: '0 auto', width: '95%', flexGrow: 1, position: 'relative' }}>
        
        {/* ================= AUTHENTICATION VIEW ================= */}
        {currentView === "auth" && (
          <div className="fade-in-up" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <div style={{ ...panelStyle, width: '450px', textAlign: 'center', boxShadow: activeTheme === 'modern' ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : `0 0 40px ${t.accent}40` }}>
              <h1 style={{ letterSpacing: '3px', marginBottom: '10px', background: activeTheme === 'modern' ? t.accentBg : 'none', WebkitBackgroundClip: activeTheme === 'modern' ? 'text' : 'none', WebkitTextFillColor: activeTheme === 'modern' ? 'transparent' : t.textMain }}>SKILL_STREET</h1>
              <p style={{ color: t.textSec, marginBottom: '40px' }}>SYSTEM AUTHENTICATION REQUIRED</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <input type="email" placeholder="Email Address" value={authEmail} onChange={e => setAuthEmail(e.target.value)} style={{ padding: '15px 20px', background: activeTheme === 'modern' ? '#f1f5f9' : t.bg, border: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : 'none', borderRadius: t.radius, color: t.textMain, outline: 'none', fontSize: '1.1rem' }} />
                <input type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} style={{ padding: '15px 20px', background: activeTheme === 'modern' ? '#f1f5f9' : t.bg, border: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : 'none', borderRadius: t.radius, color: t.textMain, outline: 'none', fontSize: '1.1rem' }} />
                
                {authError && <div style={{ color: activeTheme === 'modern' ? '#f43f5e' : '#f00', fontWeight: 'bold' }}>{authError}</div>}
                
                <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                  <button onClick={() => handleAuth('login')} disabled={loading} className="glow-btn" style={{ flex: 1, padding: '15px', background: t.btnActiveBg, color: activeTheme === 'modern' ? '#fff' : t.panelBg, border: 'none', borderRadius: t.radius, fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', '--hover-glow': t.glow }}>{loading ? '...' : 'LOGIN'}</button>
                  <button onClick={() => handleAuth('register')} disabled={loading} className="glow-btn" style={{ flex: 1, padding: '15px', background: t.bg, color: t.textMain, border: `1px solid ${t.border}`, borderRadius: t.radius, fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>REGISTER</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MARKET VIEW */}
        {currentView === "market" && (
          <div className="fade-in-up">
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ borderBottom: activeTheme === 'cyberpunk' ? `1px dashed ${t.border}` : 'none', paddingBottom: '15px', color: t.textSec, letterSpacing: '1px' }}>STEP 1: SELECT TARGET DATA-STREAM</h3>
              <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                {["Python", "React", "Rust"].map(s => (
                  <button key={s} onClick={() => handleSelectSkill(s)} className="glow-btn" style={{...baseBtn, background: skill === s ? t.btnActiveBg : t.btnBg, color: skill === s ? t.btnActiveText : t.textMain, '--hover-glow': t.glow}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {flowStage >= 1 && (
              <div className="fade-in-up" style={{...panelStyle, marginBottom: '40px'}}>
                <h3 style={{ color: flowStage >= 3 ? t.accent : t.textMain, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={loading ? "spin" : ""} style={{display:'inline-block'}}>⟳</span> 
                  {skill.toUpperCase()} // {flowStage >= 3 ? "AI FORECAST ACTIVE" : "HISTORICAL ARCHIVE"}
                </h3>
                <div style={{ width: '100%', height: '450px', marginTop: '20px' }}> 
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
                      <XAxis dataKey="ds" stroke={t.textSec} minTickGap={40} axisLine={false} tickLine={false} />
                      <YAxis stroke={t.textSec} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{background: t.panelBg, border: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : 'none', borderRadius: t.radius, color: t.textMain, boxShadow: t.shadow}} />
                      <defs>
                        <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={t.chartHistory} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={t.chartHistory} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={t.chartForecast} stopOpacity={0.5}/>
                          <stop offset="95%" stopColor={t.chartForecast} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="historical" stroke={t.chartHistory} fillOpacity={1} fill="url(#colorHistory)" strokeWidth={4} animationDuration={1500} animationEasing="ease-out" />
                      <Area type="monotone" dataKey="forecast" stroke={t.chartForecast} fillOpacity={1} fill="url(#colorForecast)" strokeWidth={4} strokeDasharray="5 5" animationDuration={2000} animationEasing="ease-out" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {flowStage === 1 && !loading && <div className="fade-in-up" style={{ textAlign: 'center' }}><button onClick={handleAskPrediction} className="glow-btn huge-btn" style={{ background: activeTheme === 'modern' ? t.accentBg : t.textMain, color: activeTheme === 'modern' ? '#fff' : t.bg, border: 'none', borderRadius: '50px', '--hover-glow': t.glow }}>INITIATE AI FORECAST</button></div>}
            
            {flowStage === 3 && !loading && (
              <div className="fade-in-up" style={{ padding: '30px', border: activeTheme === 'cyberpunk' ? `1px solid ${t.accent}` : 'none', backgroundColor: t.panelBg, textAlign: 'center', borderRadius: t.radius, boxShadow: t.shadow }}>
                <h3 style={{ color: t.accent, marginTop: 0, fontSize: '1.5rem' }}>FORECAST COMPLETE.</h3>
                <p style={{color: t.textSec, marginBottom: '25px'}}>The system has analyzed the trajectory. Ready to build your personalized curriculum.</p>
                <button onClick={generateRoadmap} className="glow-btn huge-btn" style={{ background: t.accentBg, color: activeTheme === 'modern' ? '#fff' : t.panelBg, border: 'none', borderRadius: '50px', '--hover-glow': t.glow }}>GENERATE ROADMAP (500 XP)</button>
              </div>
            )}
          </div>
        )}

        {/* LEADERBOARD VIEW - NOW DRIVEN BY REAL DB DATA */}
        {currentView === "leaderboard" && (
          <div className="fade-in-up" style={{...panelStyle, maxWidth: '900px', margin: '0 auto'}}>
             <h2 style={{ color: t.accent, borderBottom: activeTheme === 'cyberpunk' ? `1px dashed ${t.border}` : `1px solid ${t.border}`, paddingBottom: '15px', textAlign: 'center', letterSpacing: '2px' }}>GLOBAL RANKINGS</h2>
             <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
               {getRankedLeaderboard().map((user, idx) => (
                 <div key={idx} className="leaderboard-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '25px 35px', backgroundColor: user.isUser ? (activeTheme==='cyberpunk'?'#111':'#f5f3ff') : (activeTheme==='cyberpunk'? '#000' : '#f8fafc'), border: user.isUser ? `2px solid ${t.accent}` : (activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : 'none'), fontSize: '1.4rem', fontWeight: user.isUser ? 'bold' : 'normal', borderRadius: t.radius, transition: smoothTransition, position: 'relative', overflow: 'hidden' }}>
                   {user.isUser && <div style={{position:'absolute', top:0, left:0, width:'4px', height:'100%', background:t.accent}}></div>}
                   <div style={{ color: user.isUser ? t.accent : t.textMain }}>#{idx + 1} {user.name}</div>
                   <div style={{ color: user.xp < 0 ? '#f43f5e' : (activeTheme === 'modern' ? '#10b981' : '#0f0'), textShadow: user.isUser && activeTheme === 'cyberpunk' ? t.glow : 'none' }}>{user.xp} XP</div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* ACADEMY VIEW */}
        {currentView === "academy" && (
          <div className="fade-in" style={{ display: academyStage === "training" ? 'grid' : 'block', gridTemplateColumns: academyStage === "training" ? '1.2fr 0.8fr' : 'none', gap: '30px', height: '100%', transition: smoothTransition }}>
            {academyStage !== "training" ? (
              <div style={{...panelStyle, overflowY: 'auto', maxHeight: '75vh', maxWidth: '900px', margin: '0 auto'}}>
                {academyStage === "generating" && (
                  <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <div className="shimmer-text" style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '2px', '--shimmer-color': t.accent }}>COMPILING ROADMAP...</div>
                    <p style={{color: t.textSec, marginTop: '20px'}}>Ollama is analyzing the skill tree locally.</p>
                  </div>
                )}
                {academyStage === "ready" && (
                  <div className="fade-in-up">
                    <h3 style={{ borderBottom: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : `1px solid ${t.border}`, paddingBottom: '15px', color: t.textMain }}>MISSION MAP: {skill.toUpperCase()}</h3>
                    <div style={{marginTop: '30px'}}>
                      {roadmap.map((w, index) => (
                        <div key={w.week} className="roadmap-card slide-in-right" style={{ animationDelay: `${index * 0.1}s`, marginBottom: '25px', borderLeft: `4px solid ${activeTheme === 'modern' ? t.accent : t.border}`, padding: '20px 25px', background: activeTheme === 'modern' ? '#f8fafc' : 'rgba(255,255,255,0.02)', borderRadius: activeTheme === 'modern' ? '0 16px 16px 0' : '0' }}>
                          <h4 style={{ margin: '0 0 12px 0', color: activeTheme === 'modern' ? t.accent : t.textMain, fontSize: '1.2rem' }}>WEEK {w.week}: {w.topic}</h4>
                          <ul style={{ margin: 0, paddingLeft: '20px', color: t.textSec, lineHeight: '1.7' }}>{w.tasks && w.tasks.map((task, i) => <li key={i}>{task}</li>)}</ul>
                        </div>
                      ))}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '50px', paddingTop: '30px' }}>
                      <button onClick={initiateTraining} className="glow-btn huge-btn" style={{ background: t.btnActiveBg, color: t.btnActiveText, border: 'none', borderRadius: '50px', '--hover-glow': t.glow }}>BEGIN PROTOCOL</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="fade-in" style={{...panelStyle, padding: 0, display: 'flex', flexDirection: 'column', height: '75vh', overflow: 'hidden'}}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : `1px solid ${t.border}`, padding: '20px 30px', background: activeTheme === 'modern' ? '#f8fafc' : t.bg }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: t.accent }}>MODULE {currentLessonIndex + 1}: {roadmap[currentLessonIndex]?.topic?.toUpperCase()}</h3>
                </div>
                <div className="lesson-scroll" style={{ flexGrow: 1, padding: '40px', overflowY: 'auto', color: t.textMain, fontSize: '1.15rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                  {lessonText === "generating" ? (
                    <div style={{ textAlign: 'center', marginTop: '100px' }}>
                       <div className="shimmer-text" style={{ fontSize: '1.5rem', '--shimmer-color': t.accent }}>WRITING LESSON...</div>
                    </div>
                  ) : <div className="fade-in">{lessonText}</div>}
                </div>
                <div style={{ padding: '20px 30px', borderTop: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : `1px solid ${t.border}`, backgroundColor: activeTheme === 'modern' ? '#ffffff' : t.bg, display: 'flex', gap: '15px' }}>
                  <button onClick={loadMockQuiz} className="glow-btn" style={{ flex: 1, padding: '15px', background: activeTheme === 'modern' ? '#f1f5f9' : t.bg, color: activeTheme === 'modern' ? '#334155' : t.textMain, border: `1px solid ${t.border}`, fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: t.radius, '--hover-glow': 'none' }}>TAKE MOCK QUIZ</button>
                  {currentLessonIndex < roadmap.length - 1 && (
                    <button onClick={loadNextLesson} className="glow-btn" style={{ flex: 1, padding: '15px', background: t.btnActiveBg, color: activeTheme === 'modern' ? '#fff' : t.bg, border: 'none', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: t.radius, '--hover-glow': t.glow }}>NEXT MODULE ➔</button>
                  )}
                </div>
              </div>
            )}

            {/* CHAT UI */}
            {academyStage === "training" && (
              <div className="fade-in slide-in-right" style={{...panelStyle, padding: 0, display: 'flex', flexDirection: 'column', height: '75vh', overflow: 'hidden'}}>
                <h3 style={{ padding: '20px 30px', margin: 0, borderBottom: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : `1px solid ${t.border}`, background: activeTheme === 'modern' ? '#f8fafc' : t.bg, color: t.textMain }}>AI MENTOR (LOCAL)</h3>
                <div className="chat-scroll" style={{ flexGrow: 1, padding: '25px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {chat.map((m, i) => (
                    <div key={i} className="bounce-in" style={{ alignSelf: m.role === 'ai' ? 'flex-start' : 'flex-end', maxWidth: '85%', padding: '15px 20px', border: activeTheme === 'cyberpunk' ? `1px solid ${m.role === 'ai' ? t.chatAiBorder : t.chatUserBorder}` : 'none', backgroundColor: m.role === 'ai' ? (activeTheme==='modern' ? '#f1f5f9' : t.bg) : (activeTheme==='modern' ? '#3b82f6' : t.bg), color: m.role === 'ai' ? t.textMain : (activeTheme==='modern' ? '#fff' : t.textMain), lineHeight: '1.6', borderRadius: m.role === 'ai' ? '20px 20px 20px 4px' : '20px 20px 4px 20px', boxShadow: activeTheme === 'modern' ? '0 4px 6px rgba(0,0,0,0.05)' : 'none' }}>
                      <strong style={{color: m.role === 'ai' ? (activeTheme === 'modern' ? '#8b5cf6' : t.accent) : (activeTheme === 'modern' ? '#fff' : t.chartHistory), display: 'block', marginBottom: '8px', fontSize: '0.85rem', letterSpacing: '1px'}}>{m.role === 'ai' ? 'ARCHITECT' : 'YOU'}</strong>
                      {m.text}
                    </div>
                  ))}
                </div>
                <div style={{ padding: '20px 25px', borderTop: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : `1px solid ${t.border}`, display: 'flex', gap: '15px', backgroundColor: activeTheme === 'modern' ? '#ffffff' : t.bg }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && askTeacher()} style={{ flexGrow: 1, background: activeTheme === 'modern' ? '#f1f5f9' : t.panelBg, color: t.textMain, border: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : 'none', padding: '15px 25px', outline: 'none', borderRadius: '50px', transition: smoothTransition, fontSize: '1rem' }} placeholder="Type your query..." />
                  <button onClick={askTeacher} className="glow-btn" style={{...baseBtn, background: t.btnActiveBg, color: activeTheme === 'modern' ? '#fff' : t.panelBg, padding: '0 30px', borderRadius: '50px', border: 'none', '--hover-glow': t.glow}}>SEND</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* QUIZ MODAL */}
      {quizData && (
        <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="bounce-in" style={{ border: activeTheme === 'cyberpunk' ? `2px solid ${t.accent}` : 'none', background: t.panelBg, padding: '50px', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: activeTheme === 'modern' ? '24px' : '0', boxShadow: activeTheme === 'modern' ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : `0 0 40px ${t.accent}40` }}>
            {quizData === "loading" && <div style={{ textAlign: 'center', padding: '80px 0' }}><div className="shimmer-text" style={{ fontSize: '2rem', '--shimmer-color': t.accent }}>GENERATING MOCK ASSESSMENT...</div></div>}
            
            {quizData !== "loading" && !quizResults && (
              <div className="fade-in-up">
                <h2 style={{ color: t.accent, marginTop: 0, borderBottom: `1px solid ${t.border}`, paddingBottom: '15px' }}>MOCK ASSESSMENT</h2>
                <div style={{marginTop: '30px'}}>
                {quizData.map((q, idx) => (
                  <div key={idx} style={{ marginBottom: '30px', padding: '30px', border: activeTheme === 'cyberpunk' ? `1px solid ${t.border}` : 'none', backgroundColor: activeTheme === 'modern' ? '#f8fafc' : t.bg, borderRadius: '16px' }}>
                    <p style={{ fontSize: '1.25rem', marginBottom: '25px', fontWeight: 'bold' }}>{idx + 1}. {q.q}</p>
                    <div style={{ display: 'grid', gap: '15px' }}>
                      {q.options && q.options.map((opt, optIdx) => {
                        const isSelected = userAnswers[idx] === opt;
                        return (
                          <div key={optIdx} onClick={() => setUserAnswers({...userAnswers, [idx]: opt})} className="quiz-option" style={{ padding: '18px 20px', border: isSelected ? `2px solid ${activeTheme==='modern' ? '#8b5cf6' : t.accent}` : `1px solid ${t.border}`, backgroundColor: isSelected ? (activeTheme === 'modern' ? '#f3e8ff' : '#111') : t.panelBg, color: isSelected ? (activeTheme === 'modern' ? '#7e22ce' : t.accent) : t.textMain, cursor: 'pointer', borderRadius: '12px', transition: 'all 0.2s', fontWeight: isSelected ? 'bold' : 'normal', transform: isSelected ? 'scale(1.02)' : 'scale(1)' }}>{opt}</div>
                        )
                      })}
                    </div>
                  </div>
                ))}
                </div>
                <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
                  <button onClick={submitQuiz} className="glow-btn" style={{ flex: 1, padding: '20px', background: t.btnActiveBg, color: activeTheme === 'modern' ? '#fff' : t.panelBg, border: 'none', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '12px', '--hover-glow': t.glow }}>SUBMIT ANSWERS</button>
                  <button onClick={() => setQuizData(null)} style={{ padding: '20px 40px', background: 'none', color: t.textSec, border: `2px solid ${t.border}`, cursor: 'pointer', borderRadius: '12px', fontWeight: 'bold', transition: smoothTransition }}>CANCEL</button>
                </div>
              </div>
            )}

            {quizResults && (
              <div className="fade-in slide-up">
                <h2 style={{ color: quizResults.netXp > 0 ? (activeTheme==='modern'?'#10b981':'#0f0') : (activeTheme==='modern'?'#f43f5e':'#ef4444'), marginTop: 0, borderBottom: `1px solid ${t.border}`, paddingBottom: '20px', textAlign: 'center', fontSize: '2rem' }}>ASSESSMENT COMPLETE</h2>
                <div style={{ display: 'flex', justifyContent: 'space-around', margin: '40px 0', fontSize: '1.3rem', background: activeTheme === 'modern' ? '#f8fafc' : t.bg, padding: '30px', borderRadius: '20px', fontWeight: 'bold' }}>
                  <span style={{ color: activeTheme==='modern'?'#10b981':'#0f0' }}>EARNED: +{quizResults.earned}</span>
                  <span style={{ color: activeTheme==='modern'?'#f43f5e':'#ef4444' }}>PENALTY: -{quizResults.penalty}</span>
                  <span style={{ color: t.accent, fontSize: '1.6rem', textShadow: t.glow }}>NET: {quizResults.netXp} XP</span>
                </div>
                {quizData.map((q, idx) => {
                  const userAns = userAnswers[idx];
                  const isCorrect = userAns && (userAns === q.a || userAns.includes(q.a) || q.a.includes(userAns));
                  return (
                    <div key={idx} style={{ marginBottom: '25px', padding: '30px', borderLeft: isCorrect ? `8px solid ${activeTheme==='modern'?'#10b981':'#0f0'}` : `8px solid ${activeTheme==='modern'?'#f43f5e':'#ef4444'}`, backgroundColor: activeTheme === 'modern' ? '#f8fafc' : t.bg, borderRadius: '16px' }}>
                      <p style={{ fontWeight: 'bold', margin: '0 0 15px 0', fontSize: '1.15rem' }}>Q: {q.q}</p>
                      <p style={{ color: isCorrect ? (activeTheme==='modern'?'#10b981':'#0f0') : (activeTheme==='modern'?'#f43f5e':'#ef4444'), margin: '0 0 10px 0', fontWeight: 'bold' }}>Your Answer: {userAns || "None"}</p>
                      {!isCorrect && (
                        <><p style={{ color: activeTheme==='modern'?'#10b981':'#0f0', margin: '0 0 10px 0', fontWeight: 'bold' }}>Correct Answer: {q.a}</p><p style={{ color: t.textSec, margin: 0, fontStyle: 'italic', lineHeight: '1.6', marginTop: '15px' }}>Explanation: {q.explanation}</p></>
                      )}
                    </div>
                  );
                })}
                <button onClick={() => setQuizData(null)} className="glow-btn" style={{ width: '100%', padding: '25px', background: t.btnActiveBg, color: activeTheme === 'modern' ? '#fff' : t.bg, border: 'none', fontSize: '1.3rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '40px', borderRadius: '16px', '--hover-glow': t.glow }}>RETURN TO ACADEMY</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* THEME SETTINGS MODAL */}
      {showSettings && (
        <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="bounce-in" style={{ backgroundColor: t.panelBg, border: activeTheme === 'cyberpunk' ? `2px solid ${t.border}` : 'none', padding: '50px', borderRadius: '24px', width: '450px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)' }}>
            <h2 style={{ color: t.textMain, marginTop: 0, marginBottom: '40px', letterSpacing: '2px' }}>SYSTEM U.I.</h2>
            <button onClick={() => { setActiveTheme("cyberpunk"); setShowSettings(false); }} className="glow-btn" style={{ width: '100%', padding: '20px', marginBottom: '20px', background: '#000', color: '#0f0', border: '2px solid #0f0', borderRadius: '16px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: '"Courier New", monospace', '--hover-glow': '0 0 20px rgba(0,255,0,0.5)' }}>💻 CYBERPUNK (DARK)</button>
            <button onClick={() => { setActiveTheme("modern"); setShowSettings(false); }} className="glow-btn" style={{ width: '100%', padding: '20px', marginBottom: '40px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#ffffff', border: 'none', borderRadius: '16px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'system-ui, sans-serif', '--hover-glow': '0 15px 30px rgba(139,92,246,0.5)' }}>✨ MODERN (LIGHT)</button>
            <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: t.textSec, cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold', fontSize: '1.1rem' }}>Close Interface</button>
          </div>
        </div>
      )}

      {/* --- SUPERCHARGED CSS ANIMATIONS --- */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100vw; min-height: 100vh; background-color: ${t.bg}; transition: background-color 0.5s ease; }
        h2, h3, h4 { letter-spacing: 0.5px; }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .slide-in-right { animation: slideInRight 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
        .bounce-in { animation: bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .spin { display: inline-block; animation: spin 2s linear infinite; }
        .pulse-slow { animation: pulse 3s infinite; }
        .shimmer-text { color: rgba(255,255,255,0.1); background: linear-gradient(90deg, transparent 0%, var(--shimmer-color) 50%, transparent 100%); background-size: 200% auto; color: transparent; -webkit-background-clip: text; background-clip: text; animation: shimmer 2s linear infinite; }
        .glow-btn { transition: all 0.2s ease; position: relative; }
        .glow-btn:hover { transform: translateY(-2px); box-shadow: var(--hover-glow) !important; filter: brightness(1.1); }
        .glow-btn:active { transform: translateY(2px) scale(0.98); box-shadow: none !important; }
        .huge-btn { padding: 20px 60px !important; font-size: 1.3rem !important; letter-spacing: 1px; }
        .nav-btn:hover { background: ${t.textSec}20 !important; }
        .icon-btn:hover { transform: rotate(45deg); }
        .leaderboard-card:hover { transform: translateX(10px) scale(1.01); }
        .quiz-option:hover { filter: brightness(1.2); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes bounceIn { 0% { opacity: 0; transform: scale(0.9); } 70% { opacity: 1; transform: scale(1.02); } 100% { transform: scale(1); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes shimmer { to { background-position: 200% center; } }
        .lesson-scroll::-webkit-scrollbar, .chat-scroll::-webkit-scrollbar { width: 6px; }
        .lesson-scroll::-webkit-scrollbar-track, .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .lesson-scroll::-webkit-scrollbar-thumb, .chat-scroll::-webkit-scrollbar-thumb { background: ${t.textSec}50; border-radius: 10px; }
        .lesson-scroll::-webkit-scrollbar-thumb:hover, .chat-scroll::-webkit-scrollbar-thumb:hover { background: ${t.accent}; }
      `}</style>
    </div>
  );
}

export default App;