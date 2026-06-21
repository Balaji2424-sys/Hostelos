'use client';
import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/ui/AppLayout';
import { aiChat, getPaymentRisk, getVacancyForecast, getEbAnomalies } from '@/lib/api';
import { Bot, Send, AlertTriangle, TrendingDown, Zap, RefreshCw } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; }

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      {!isUser && (
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0, marginTop: 2 }}>
          <Bot size={14} color="#fff" />
        </div>
      )}
      <div style={{
        maxWidth: '75%', padding: '10px 14px', borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
        background: isUser ? 'var(--brand)' : 'var(--bg-surface-2)',
        color: isUser ? '#fff' : 'var(--text-primary)',
        fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap'
      }}>
        {msg.content}
      </div>
    </div>
  );
}

const QUICK_QUESTIONS = [
  'How many beds are vacant right now?',
  'Which tenants have overdue payments?',
  'What is this month collection rate?',
  'Give me a revenue summary',
];

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I\'m your hostel management AI assistant powered by LLaMA 3.1. Ask me anything about your hostel — occupancy, payments, complaints, forecasts, and more.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [risks, setRisks] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await aiChat(msg);
      setMessages([...newMessages, { role: 'assistant', content: res.data.reply }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I\'m unable to respond right now. Please check your Groq API key in the backend .env file.' }]);
    } finally { setLoading(false); }
  };

  const loadInsights = async () => {
    setInsightsLoading(true);
    try {
      const [r, f, a] = await Promise.all([getPaymentRisk(), getVacancyForecast(), getEbAnomalies()]);
      setRisks(r.data.riskTenants || []);
      setForecast(f.data);
      setAnomalies(a.data.anomalies || []);
    } catch { } finally { setInsightsLoading(false); }
  };

  useEffect(() => { loadInsights(); }, []);

  return (
    <AppLayout>
      <div className="page-header">
        <div className="page-title">AI Assistant</div>
        <div className="page-subtitle">Powered by Groq · LLaMA 3.1 70B</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Chat */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 560, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bot size={16} color="var(--brand)" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Hostel AI Chat</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, background: 'var(--success-bg)', color: 'var(--success)', padding: '2px 8px', borderRadius: 99 }}>● Live</span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {messages.map((m, i) => <ChatBubble key={i} msg={m} />)}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                <Bot size={14} color="var(--brand)" />
                <span style={{ fontStyle: 'italic' }}>Thinking…</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          <div style={{ padding: '8px 20px', display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid var(--border)' }}>
            {QUICK_QUESTIONS.map(q => (
              <button key={q} className="btn btn-secondary btn-sm" onClick={() => sendMessage(q)}
                style={{ fontSize: 11, padding: '3px 10px' }}>{q}</button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              className="input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask anything about your hostel…"
            />
            <button className="btn btn-primary" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              <Send size={14} />
            </button>
          </div>
        </div>

        {/* Insights Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>AI Insights</div>
            <button className="btn btn-secondary btn-sm" onClick={loadInsights} disabled={insightsLoading}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {/* Vacancy Forecast */}
          {forecast && (
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <TrendingDown size={14} color="var(--warning)" />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Vacancy Forecast</span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{forecast.currentOccupancy}/{forecast.totalBeds}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Current</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--warning)' }}>{forecast.upcomingVacates}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Vacating</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--danger)' }}>{forecast.forecastedOccupancy}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>After</div>
                </div>
              </div>
              {forecast.forecast && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg-surface-2)', borderRadius: 8, padding: 10 }}>
                  {forecast.forecast}
                </div>
              )}
            </div>
          )}

          {/* Payment Risks */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <AlertTriangle size={14} color="var(--danger)" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Payment Risk</span>
            </div>
            {insightsLoading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Analyzing…</div>
            ) : risks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {risks.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.reason}</div>
                    </div>
                    <span className={`badge ${r.riskLevel === 'HIGH' ? 'badge-red' : 'badge-yellow'}`} style={{ flexShrink: 0 }}>
                      {r.riskLevel}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No high-risk tenants detected</div>
            )}
          </div>

          {/* EB Anomalies */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Zap size={14} color="var(--warning)" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>EB Anomalies</span>
            </div>
            {anomalies.length > 0 ? (
              anomalies.map((a, i) => (
                <div key={i} style={{ marginBottom: 6, fontSize: 12 }}>
                  <span style={{ fontWeight: 500 }}>Room {a.room}</span>
                  <span style={{ color: 'var(--text-muted)' }}> — {a.issue}</span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No anomalies detected</div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
