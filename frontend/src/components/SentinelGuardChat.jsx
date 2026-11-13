import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bot, X, Send, Volume2, Sparkles } from 'lucide-react'
import { askSentinelGuard, formatSafeReplyHtml } from '../utils/aiEngine'
import { PLAN_DOC_UPDATED_EVENT } from '../utils/elzoraKnowledge'
import { formatErrorMessage } from '../utils/errorMessages'
import './ai-widgets.css'

const SUGGESTION_CHIPS = [
  {
    label: '8 Income Streams',
    question: 'How many incomes in project?',
  },
  {
    label: '$50 Distribution',
    question: 'How is the $50 USDT package distributed across the income streams?',
  },
  {
    label: 'Binary Matching & Cap',
    question: 'Explain 1:1 Binary Matching, qualification, and daily cap.',
  },
  {
    label: '$25 Single Leg Club',
    question: 'How does the $25 Single Leg Global Club 1-to-2 re-entry queue work?',
  },
  {
    label: '8 Club Ranks',
    question: 'List the 8 Cascading Club Ranks and their net profits.',
  },
  {
    label: 'Instant Wallet Payouts',
    question: 'Why is there no withdrawal button and are payouts instant?',
  },
]

export function SentinelGuardChat() {
  const location = useLocation()
  const navigate = useNavigate()
  const isVoiceAiPage = location.pathname === '/ai/plan-explainer'

  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [statusText, setStatusText] = useState('Ready to read your document')
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `### Sentinel Guard AI — Official ELZORA Guide
Ask any A-to-Z question in **English** or **Hindi/Hinglish**, grounded strictly in the verified business plan:
• **$50 Package & 8 Income Streams:** Direct, 20-Level Affiliate, Binary, Pools & Global Club
• **Ranks & Milestones:** Starter–Legend ($9.87M) & 27 Lifetime Milestones ($123M+)
• **Rules & Plan Flow:** Auto-Spillover, Break-Even Math, Treasury Rules & Instant Payouts`,
      isError: false,
    },
  ])

  const historyRef = useRef([])
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  useEffect(() => {
    const handleDocUpdate = () => {
      setStatusText('Updated document loaded')
      setTimeout(() => setStatusText('Ready to read your document'), 2500)
    }
    window.addEventListener(PLAN_DOC_UPDATED_EVENT, handleDocUpdate)
    return () => window.removeEventListener(PLAN_DOC_UPDATED_EVENT, handleDocUpdate)
  }, [])

  // External trigger support: any element with class .open-ai-chat-trigger opens drawer & focuses input
  useEffect(() => {
    const handleExternalTrigger = (e) => {
      const trigger = e.target?.closest?.('.open-ai-chat-trigger')
      if (!trigger) return
      e.preventDefault()
      setIsOpen(true)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 150)
    }
    document.addEventListener('click', handleExternalTrigger)
    return () => document.removeEventListener('click', handleExternalTrigger)
  }, [])

  if (isVoiceAiPage) {
    return null
  }

  const sendQuestion = async (rawQuestion) => {
    const question = String(rawQuestion || '').trim()
    if (!question || isLoading) return

    const userMsg = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: question,
      isError: false,
    }
    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsLoading(true)
    setStatusText('Analyzing document...')

    try {
      const { answer } = await askSentinelGuard(question, historyRef.current)
      historyRef.current = [
        ...historyRef.current.slice(-10),
        { role: 'user', text: question },
        { role: 'model', text: answer },
      ]
      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          text: answer,
          isError: false,
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          text: formatErrorMessage(err, 'Unable to process your question right now.'),
          isError: true,
        },
      ])
    } finally {
      setIsLoading(false)
      setStatusText('Ready to read your document')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendQuestion(inputValue)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendQuestion(inputValue)
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        id="chatToggle"
        type="button"
        className="chat-fab"
        aria-label="Toggle Sentinel Guard AI Chat"
        onClick={() => {
          const next = !isOpen
          setIsOpen(next)
          if (next) {
            setTimeout(() => inputRef.current?.focus(), 180)
          }
        }}
      >
        {isOpen ? <X size={24} strokeWidth={2.5} /> : <Bot size={26} strokeWidth={2.2} />}
      </button>

      {/* Slide-up Chat Drawer */}
      <div
        id="chatCard"
        className={`chat-card ${isOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-label="Sentinel Guard AI Assistant"
      >
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-title">
            <span className="chat-status-dot" />
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Sentinel Guard AI</span>
                <Sparkles size={13} color="#c084fc" />
              </div>
              <div id="chatStatus" className="chat-status-text">
                {statusText}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              className="chat-voice-btn"
              onClick={() => {
                setIsOpen(false)
                navigate('/ai/plan-explainer')
              }}
              title="Open Plan Explainer Voice AI"
            >
              <Volume2 size={13} />
              <span>Voice AI</span>
            </button>
            <button
              id="chatClose"
              type="button"
              className="chat-close-btn"
              aria-label="Close chat"
              onClick={() => setIsOpen(false)}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div id="messages" className="chat-messages">
          {messages.map((msg) => {
            const isUser = msg.role === 'user'
            return (
              <div key={msg.id} className={`chat-row ${isUser ? 'is-user' : ''}`}>
                <span className={`chat-avatar-pill ${isUser ? 'user' : 'ai'}`}>
                  {isUser ? 'You' : 'AI'}
                </span>
                <div
                  className={`chat-bubble ${isUser ? 'user' : 'ai'} ${msg.isError ? 'error' : ''}`}
                  dangerouslySetInnerHTML={{ __html: formatSafeReplyHtml(msg.text) }}
                />
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="chat-suggestions">
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              className="chat-chip"
              data-question={chip.question}
              disabled={isLoading}
              onClick={() => sendQuestion(chip.question)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form id="chatForm" className="chat-form" onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            id="questionInput"
            className="chat-textarea"
            rows={1}
            placeholder="Ask about ELZORA plans, payouts, ranks..."
            value={inputValue}
            disabled={isLoading}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            id="sendButton"
            type="submit"
            className="chat-send-btn"
            disabled={isLoading || !inputValue.trim()}
            aria-label="Send question"
          >
            <Send size={17} />
          </button>
        </form>
      </div>
    </>
  )
}

export default SentinelGuardChat
