import { useState, useRef, useEffect } from 'react'
import { aiAPI } from '../api'
import { useAuth } from '../context/AuthContext'

const WELCOME_MSG = {
  id: 0,
  role: 'assistant',
  content: `Mirë se erdhe! 🐝 Unë jam **Bletari AI**, asistenti yt i inteligjencës artificiale i specializuar për bletarinë.

Mund të pyesni për:
• 🦠 **Sëmundje** dhe trajtimin e tyre (Varroa, Nosema, AFB, EFB...)
• 🌿 **Ushqim dhe ilaçim** organik dhe kimik
• 📅 **Sezonaliteti** — çfarë të bësh gjatë çdo stine
• 🏗 **Menaxhimi** i kopshtit dhe koshereve
• 🍯 **Prodhimi i mjaltit** dhe produkteve të tjera
• 👑 **Mbretëresha** — mbarështimi dhe zëvendësimi

Si mund të të ndihmoj sot?`,
  time: new Date().toISOString(),
}

const QUICK_QUESTIONS = [
  'Si të trajtoj Varroa destructor organikisht?',
  'Kosherja ime nuk ka mbretëreshë, çfarë bëj?',
  'Kur duhet të bëj vizitën e parë të pranverës?',
  'Si të dalloj bletën mjaltore nga grerëzat?',
  'Çfarë është Nosema dhe si trajtohet?',
  'Sa mjaltë prodhon një koshère në vit?',
]

function Message({ msg }) {
  const isUser = msg.role === 'user'

  // Simple markdown-ish rendering
  const renderContent = (text) => {
    return text.split('\n').map((line, i) => {
      const boldReplaced = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      return (
        <span key={i}>
          <span dangerouslySetInnerHTML={{ __html: boldReplaced }} />
          {i < text.split('\n').length - 1 && <br />}
        </span>
      )
    })
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '1rem',
      gap: '0.5rem',
      alignItems: 'flex-end',
    }}>
      {!isUser && (
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--gold), var(--wood))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          flexShrink: 0,
        }}>
          🐝
        </div>
      )}

      <div style={{
        maxWidth: '80%',
        padding: '0.75rem 1rem',
        borderRadius: isUser
          ? '18px 18px 4px 18px'
          : '4px 18px 18px 18px',
        background: isUser ? 'var(--gold)' : 'var(--card)',
        color: isUser ? '#2C1810' : 'var(--text)',
        border: isUser ? 'none' : '1px solid var(--border)',
        fontSize: '0.9rem',
        lineHeight: 1.7,
        boxShadow: '0 1px 4px var(--shadow)',
      }}>
        {renderContent(msg.content)}
        <div style={{
          fontSize: '0.68rem',
          marginTop: '0.3rem',
          opacity: 0.6,
          textAlign: isUser ? 'right' : 'left',
        }}>
          {new Date(msg.time).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {isUser && (
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'var(--wood)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.9rem',
          fontWeight: 700,
          flexShrink: 0,
        }}>
          👤
        </div>
      )}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--gold), var(--wood))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.1rem',
        flexShrink: 0,
      }}>
        🐝
      </div>
      <div style={{
        padding: '0.75rem 1rem',
        borderRadius: '4px 18px 18px 18px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: 'var(--gold)',
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}

const FREE_LIMIT = 5

export default function AIPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([WELCOME_MSG])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [usageCount, setUsageCount] = useState(0)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    // Load usage from localStorage
    const stored = localStorage.getItem('bletaria_ai_usage')
    if (stored) {
      const { count, day } = JSON.parse(stored)
      const today = new Date().toISOString().slice(0, 10)
      if (day === today) setUsageCount(count)
      else {
        localStorage.setItem('bletaria_ai_usage', JSON.stringify({ count: 0, day: today }))
      }
    }
    // Also fetch from server
    aiAPI.usage().then(res => {
      setUsageCount(res.data.count || 0)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const saveUsage = (count) => {
    const day = new Date().toISOString().slice(0, 10)
    localStorage.setItem('bletaria_ai_usage', JSON.stringify({ count, day }))
    setUsageCount(count)
  }

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg) return
    if (usageCount >= FREE_LIMIT) return

    setInput('')
    setError('')

    const userMsg = { id: Date.now(), role: 'user', content: msg, time: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await aiAPI.chat({ message: msg, history: messages.slice(-6) })
      const aiResponse = res.data.response || res.data.message || 'Nuk munda të përpunoj kërkesën. Provo sërish.'
      const aiMsg = { id: Date.now() + 1, role: 'assistant', content: aiResponse, time: new Date().toISOString() }
      setMessages(prev => [...prev, aiMsg])
      saveUsage(usageCount + 1)
    } catch (err) {
      // Fallback responses for demo
      const fallbacks = {
        'varroa': 'Varroa destructor trajtohet me metoda organike si:\n\n• **Api-Life Var** (timol) — vendoset mbi kornizat\n• **Acid oksalik** (3% ujë+sheqer) — kur s\'ka zile të mbyllura\n• **Acid formik** (MAQS) — efektiv nën zile\n\nTrajtimi bëhet pas blerjes së mjaltit, zakonisht gusht-shtator dhe dimër.',
        'mbretëreshë': 'Kur kosharja nuk ka mbretëreshë:\n\n1. Kontrollo nëse ka qeliza mbretëreshe (qeliza e zgjatur)\n2. Nëse jo, shto një kornizë me vezë të freskëta nga kosharja tjetër\n3. Bletët do të ngrenë mbretëreshë të re vetë\n4. Ose fut mbretëreshë të re të blere\n\nKontrollin bëje pas 3 javësh.',
      }
      const lower = msg.toLowerCase()
      let response = 'Faleminderit për pyetjen! Si asistent i specializuar për bletarinë, do të duhet të lidhem me bazën time të njohurive. Provo sërish ose kontakto komunitetin tonë.'
      for (const [key, val] of Object.entries(fallbacks)) {
        if (lower.includes(key)) { response = val; break }
      }
      const aiMsg = { id: Date.now() + 1, role: 'assistant', content: response, time: new Date().toISOString() }
      setMessages(prev => [...prev, aiMsg])
      saveUsage(usageCount + 1)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const remaining = FREE_LIMIT - usageCount
  const isLimited = usageCount >= FREE_LIMIT

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 64px)',
      maxWidth: '780px',
      margin: '0 auto',
      padding: '0 1rem',
    }}>
      {/* Header */}
      <div style={{
        padding: '1.25rem 0 0.75rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--gold), var(--wood))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
          }}>
            🐝
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', marginBottom: '0.1rem' }}>Bletari AI 🤖</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--green)' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
              Online
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Usage */}
          <div style={{
            padding: '0.3rem 0.75rem',
            background: isLimited ? 'rgba(192,57,43,0.1)' : 'rgba(74,124,89,0.1)',
            border: `1px solid ${isLimited ? 'rgba(192,57,43,0.3)' : 'rgba(74,124,89,0.3)'}`,
            borderRadius: '20px',
            fontSize: '0.78rem',
            color: isLimited ? 'var(--red)' : 'var(--green)',
            fontWeight: 600,
          }}>
            {isLimited ? '⛔ Limit i arritur' : `🔢 ${remaining}/${FREE_LIMIT} kërkesa`}
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setMessages([WELCOME_MSG])}
            title="Bisedë e re"
          >
            🔄 E re
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.25rem 0',
      }}>
        {messages.map(msg => (
          <Message key={msg.id} msg={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 1 && !loading && (
        <div style={{ paddingBottom: '0.75rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>💡 Pyetje të shpejta:</p>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {QUICK_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={isLimited}
                style={{
                  padding: '0.3rem 0.65rem',
                  border: '1px solid var(--border)',
                  borderRadius: '20px',
                  background: 'var(--card)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: 'var(--muted)',
                  transition: 'all 0.15s',
                  fontFamily: 'var(--font)',
                }}
                onMouseEnter={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.color = 'var(--gold-dark)' }}
                onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--muted)' }}
              >{q}</button>
            ))}
          </div>
        </div>
      )}

      {/* Limit message */}
      {isLimited && (
        <div style={{
          padding: '0.85rem 1rem',
          background: 'rgba(192,57,43,0.08)',
          border: '1px solid rgba(192,57,43,0.2)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '0.75rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>⛔</div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--red)', marginBottom: '0.25rem' }}>
            Limite ditore e arritur
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
            Ke përdorur {FREE_LIMIT}/{FREE_LIMIT} pyetje falas sot. Limiti riset nesër, ose abonohu Premium për pyetje të pakufizuara.
          </div>
          <button className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}>
            ⭐ Abono Premium — €4.99/muaj
          </button>
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '0.75rem 0 1rem',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            className="form-control"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLimited ? 'Limite e arritur...' : '💬 Pyete Bletari AI...'}
            disabled={loading || isLimited}
            rows={1}
            style={{
              flex: 1,
              resize: 'none',
              minHeight: '44px',
              maxHeight: '120px',
              overflowY: 'auto',
              padding: '0.65rem 0.9rem',
              fontSize: '0.9rem',
              fontFamily: 'var(--font)',
            }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim() || isLimited}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: loading || !input.trim() || isLimited ? 'var(--border)' : 'var(--gold)',
              border: 'none',
              cursor: loading || !input.trim() || isLimited ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            {loading ? '⏳' : '➤'}
          </button>
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.35rem', textAlign: 'center' }}>
          Enter për dërgim · Shift+Enter për rresht të ri
        </p>
      </div>
    </div>
  )
}
