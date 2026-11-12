import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Square,
  RotateCcw,
  FileText,
  Sparkles,
  Volume2,
  Play,
  X,
  Layers,
  Zap,
  GitCommit,
  Award,
  RefreshCw,
  Download,
  Lock,
  ShieldCheck,
} from 'lucide-react'
import FibonacciGlobeCanvas from '../components/FibonacciGlobeCanvas'
import {
  getActivePlanDocument,
  getDocumentSourceMeta,
  PLAN_DOC_UPDATED_EVENT,
} from '../utils/elzoraKnowledge'
import { buildDocumentLines } from '../utils/planSpeechBuilder'
import '../components/ai-widgets.css'

const PILLAR_CARDS = [
  {
    topic: 'package_overview',
    title: '$50 Package & Instant Payouts',
    subtitle: '100% On-Chain Distribution ($50 IN = $50 OUT)',
    badge: 'Core Protocol',
    color: '#8b5cf6',
    icon: Zap,
  },
  {
    topic: 'direct_affiliate',
    title: 'Direct 20% & 20-Level 14%',
    subtitle: '$10 Instant Direct + $7 Across 20 Generations',
    badge: '34% Immediate',
    color: '#38bdf8',
    icon: Layers,
  },
  {
    topic: 'binary_matching',
    title: '1:1 Binary Matching Pool',
    subtitle: '$2/Pair • Perpetual Carry-Forward • 50 Pairs/Day Cap',
    badge: '20% Pool',
    color: '#818cf8',
    icon: GitCommit,
  },
  {
    topic: 'club_matrices',
    title: '8 Club Ranks & 27 Milestones',
    subtitle: 'Starter to Legend + $21M Lifetime Rewards',
    badge: '46% Wealth Pools',
    color: '#c084fc',
    icon: Award,
  },
  {
    topic: 'single_leg',
    title: '$25 Single Leg Global Club',
    subtitle: 'Autonomous 1-to-2 Re-Entry Queue ($25/Cycle)',
    badge: 'Perpetual Loop',
    color: '#06b6d4',
    icon: RefreshCw,
  },
  {
    topic: 'break_even',
    title: 'Break-Even & Plan Safety',
    subtitle: '2–30 Direct Math • Treasury & Non-Custodial Flow',
    badge: '100% Safe Flow',
    color: '#f59e0b',
    icon: ShieldCheck,
  },
]

const LISTENING_TOPICS = [
  { id: 'all', en: 'Full Business Plan', hi: 'पूरा बिज़नेस प्लान' },
  { id: 'package_overview', en: '$50 Package & Joining', hi: '$50 पैकेज और जॉइनिंग' },
  { id: 'direct_affiliate', en: 'Direct & 20-Level', hi: 'डायरेक्ट और 20-लेवल' },
  { id: 'binary_matching', en: '1:1 Binary Matching', hi: '1:1 बाइनरी मैचिंग' },
  { id: 'club_matrices', en: 'Club Ranks, Pools & Milestones', hi: 'क्लब रैंक, पूल और माइलस्टोन' },
  { id: 'single_leg', en: '$25 Global Club', hi: '$25 ग्लोबल क्लब' },
  { id: 'break_even', en: 'Break-Even & Safety', hi: 'ब्रेक-ईवन और सुरक्षा' },
]

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function highlightTeleprompterHtml(text) {
  const escaped = escapeHtml(text)
  return escaped.replace(
    /(\$[0-9,.]+|\d+(?:\.\d+)?%|1:1|1-to-2|1-इन-2|Starter|Leader|Achiever|Mentor|Director|Elite|Crown|Legend|ELZORA|USDT)/g,
    '<strong style="color:#c4b5fd;font-weight:800">$1</strong>'
  )
}

function getKoreVoice(language) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices() || []
  if (!voices.length) return null

  if (language === 'hi') {
    const hiVoices = voices.filter((v) => v.lang?.toLowerCase().startsWith('hi'))
    return (
      hiVoices.find((v) => /swara/i.test(v.name)) ||
      hiVoices.find((v) => /google.*हिन्दी|google.*hindi/i.test(v.name)) ||
      hiVoices.find((v) => /natural/i.test(v.name)) ||
      hiVoices.find((v) => /female|kalpana|lekha|heera/i.test(v.name)) ||
      hiVoices[0] ||
      null
    )
  }

  const enVoices = voices.filter((v) => v.lang?.toLowerCase().startsWith('en'))
  return (
    enVoices.find((v) => /jenny/i.test(v.name)) ||
    enVoices.find((v) => /aria/i.test(v.name)) ||
    enVoices.find((v) => /samantha/i.test(v.name)) ||
    enVoices.find((v) => /natural/i.test(v.name)) ||
    enVoices.find((v) => /google us/i.test(v.name)) ||
    enVoices.find((v) => /female|zira|eva/i.test(v.name)) ||
    enVoices[0] ||
    null
  )
}

export function PlanExplainerPage() {
  const navigate = useNavigate()

  const [language, setLanguage] = useState('en')
  const [docRaw, setDocRaw] = useState(() => getActivePlanDocument())
  const [docMeta, setDocMeta] = useState(() => getDocumentSourceMeta())
  const [speechData, setSpeechData] = useState(() => buildDocumentLines(getActivePlanDocument(), 'en'))

  const [isSpeaking, setIsSpeaking] = useState(false)
  const [activeTopic, setActiveTopic] = useState('all')
  const [currentLineIndex, setCurrentLineIndex] = useState(-1)
  const [readLines, setReadLines] = useState(() => new Set())
  const [voiceStatus, setVoiceStatus] = useState('Ready — Listen to the Full Plan or pick any Topic below')

  // Read-only Document Viewer Modal state
  const [showDocModal, setShowDocModal] = useState(false)

  const visibleLines = useMemo(
    () => (activeTopic === 'all' ? speechData.lines : speechData.lines.filter((l) => l.topic === activeTopic)),
    [speechData.lines, activeTopic]
  )

  const teleprompterRef = useRef(null)
  const lineRefs = useRef({})
  const keepAliveRef = useRef(null)
  const playbackSessionRef = useRef(0)
  const linesRef = useRef(visibleLines)
  const languageRef = useRef(language)

  useEffect(() => {
    linesRef.current = visibleLines
  }, [visibleLines])

  useEffect(() => {
    languageRef.current = language
  }, [language])

  // Ensure browser speechSynthesis voices load cleanly
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.getVoices()
    const onVoicesChanged = () => window.speechSynthesis.getVoices()
    window.speechSynthesis.addEventListener?.('voiceschanged', onVoicesChanged)
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', onVoicesChanged)
    }
  }, [])

  // Listen to document updates
  useEffect(() => {
    const syncDoc = () => {
      const latest = getActivePlanDocument()
      const meta = getDocumentSourceMeta()
      setDocRaw(latest)
      setDocMeta(meta)
      setSpeechData(buildDocumentLines(latest, languageRef.current))
    }
    window.addEventListener(PLAN_DOC_UPDATED_EVENT, syncDoc)
    return () => window.removeEventListener(PLAN_DOC_UPDATED_EVENT, syncDoc)
  }, [])

  const clearKeepAlive = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current)
      keepAliveRef.current = null
    }
  }, [])

  const stopSpeech = useCallback(() => {
    playbackSessionRef.current += 1
    clearKeepAlive()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
    setVoiceStatus(
      languageRef.current === 'hi'
        ? 'ऑडियो रोका गया — जारी रखने के लिए किसी भी लाइन या माइक पर क्लिक करें'
        : 'Narration stopped — Click the orb or any teleprompter line to resume'
    )
  }, [clearKeepAlive])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      playbackSessionRef.current += 1
      clearKeepAlive()
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [clearKeepAlive])

  const playFromLineRef = useRef(null)

  const playFromLine = useCallback(
    (startIndex) => {
      const lines = linesRef.current
      if (!lines || startIndex < 0 || startIndex >= lines.length) {
        clearKeepAlive()
        setIsSpeaking(false)
        setCurrentLineIndex(-1)
        setVoiceStatus(
          languageRef.current === 'hi'
            ? 'संपूर्ण बिज़नेस प्लान का वाचन पूरा हुआ!'
            : 'Complete business plan narration finished!'
        )
        return
      }

      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setVoiceStatus('Web Speech API is not supported in this browser.')
        return
      }

      const sessionId = ++playbackSessionRef.current
      clearKeepAlive()
      window.speechSynthesis.cancel()

      const lineObj = lines[startIndex]
      setIsSpeaking(true)
      setCurrentLineIndex(startIndex)
      setVoiceStatus(
        languageRef.current === 'hi'
          ? `Kore बोल रही है — लाइन ${startIndex + 1} / ${lines.length}`
          : `Kore speaking — Line ${startIndex + 1} of ${lines.length}`
      )

      const activeEl = lineRefs.current[startIndex]
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }

      const utterance = new SpeechSynthesisUtterance(lineObj.spoken || lineObj.text)
      const langCode = languageRef.current === 'hi' ? 'hi-IN' : 'en-US'
      utterance.lang = langCode
      utterance.rate = 1.0
      utterance.pitch = 1.04
      const koreVoice = getKoreVoice(languageRef.current)
      if (koreVoice) {
        utterance.voice = koreVoice
      }

      // 12-second keep-alive prevents Chrome/Edge from cutting off long utterances
      keepAliveRef.current = setInterval(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause()
          window.speechSynthesis.resume()
        }
      }, 12000)

      utterance.onend = () => {
        if (playbackSessionRef.current !== sessionId) return
        clearKeepAlive()
        setReadLines((prev) => {
          const next = new Set(prev)
          next.add(startIndex)
          return next
        })
        playFromLineRef.current?.(startIndex + 1)
      }

      utterance.onerror = () => {
        if (playbackSessionRef.current !== sessionId) return
        clearKeepAlive()
        setIsSpeaking(false)
      }

      window.speechSynthesis.speak(utterance)
    },
    [clearKeepAlive]
  )

  useEffect(() => {
    playFromLineRef.current = playFromLine
  }, [playFromLine])

  const handleLanguageChange = (nextLang) => {
    if (nextLang === language) return
    stopSpeech()
    setLanguage(nextLang)
    setCurrentLineIndex(-1)
    setReadLines(new Set())
    const rebuilt = buildDocumentLines(docRaw, nextLang)
    setSpeechData(rebuilt)
    setVoiceStatus(
      nextLang === 'hi'
        ? 'भाषा हिंदी (Kore AI) में बदली गई — शुरू करने के लिए माइक पर क्लिक करें'
        : 'Language switched to English (Kore AI) — Click the orb to start narration'
    )
  }

  const handleMainOrbClick = () => {
    if (isSpeaking) {
      stopSpeech()
    } else {
      const startAt = currentLineIndex >= 0 && currentLineIndex < visibleLines.length ? currentLineIndex : 0
      playFromLine(startAt)
    }
  }

  const selectTopicAndPlay = (topicId, autoPlay = true) => {
    stopSpeech()
    const nextLines =
      topicId === 'all' ? speechData.lines : speechData.lines.filter((l) => l.topic === topicId)
    setActiveTopic(topicId)
    setCurrentLineIndex(-1)
    setReadLines(new Set())
    linesRef.current = nextLines
    if (autoPlay && nextLines.length > 0) {
      playFromLine(0)
    }
  }

  const handlePillarCardClick = (topic) => {
    teleprompterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    selectTopicAndPlay(topic, true)
  }

  const handleCardMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const pctX = (x / rect.width) * 100
    const pctY = (y / rect.height) * 100
    const rotateY = ((x / rect.width) - 0.5) * 14
    const rotateX = ((y / rect.height) - 0.5) * -14
    card.style.setProperty('--mouse-x', `${pctX}%`)
    card.style.setProperty('--mouse-y', `${pctY}%`)
    card.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.03, 1.03, 1.03)`
  }

  const handleCardMouseLeave = (e) => {
    e.currentTarget.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
  }

  const totalLines = visibleLines.length

  return (
    <div className="pe-page">
      <div className="bgfx" />
      <div className="bg-grid" />
      <FibonacciGlobeCanvas />

      <div className="pe-shell">
        {/* TOP GLASS NAVIGATION BAR */}
        <header className="top-nav pe-glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                stopSpeech()
                navigate('/')
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 13px',
                borderRadius: 11,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.05)',
                color: '#e2e8f0',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={15} />
              <span>Back to Home</span>
            </button>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 14px',
                borderRadius: 999,
                background: 'rgba(99, 102, 241, 0.14)',
                border: '1px solid rgba(139, 92, 246, 0.42)',
                color: '#e0e7ff',
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
              }}
            >
              <Sparkles size={14} color="#c084fc" />
              <span>ELZORA • PLAN EXPLAINER AI</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Language Toggle */}
            <div className="lang-switch" role="group" aria-label="Voice Language Selector">
              <button
                type="button"
                className={`lang-btn ${language === 'hi' ? 'is-active' : ''}`}
                data-lang="hi"
                onClick={() => handleLanguageChange('hi')}
              >
                🇮🇳 Hindi
              </button>
              <button
                type="button"
                className={`lang-btn ${language === 'en' ? 'is-active' : ''}`}
                data-lang="en"
                onClick={() => handleLanguageChange('en')}
              >
                🇬🇧 English
              </button>
            </div>

            <button
              id="openDocModalBtn"
              type="button"
              onClick={() => setShowDocModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 13px',
                borderRadius: 11,
                border: '1px solid rgba(192, 132, 252, 0.35)',
                background: 'rgba(192, 132, 252, 0.12)',
                color: '#e9d5ff',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <FileText size={14} />
              <span>View Plan Document</span>
            </button>

            <button
              id="stopAudioBtn"
              type="button"
              onClick={stopSpeech}
              disabled={!isSpeaking}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 13px',
                borderRadius: 11,
                border: '1px solid rgba(239, 68, 68, 0.4)',
                background: isSpeaking ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: isSpeaking ? '#fecaca' : '#64748b',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: isSpeaking ? 'pointer' : 'not-allowed',
              }}
            >
              <Square size={13} />
              <span>Stop Audio</span>
            </button>
          </div>
        </header>

        {/* CENTRAL CONTINUOUS NARRATION PANEL */}
        <section
          className="voice-panel pe-glass"
          data-state={isSpeaking ? 'speaking' : 'idle'}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 14px',
                borderRadius: 999,
                background: 'rgba(139, 92, 246, 0.14)',
                border: '1px solid rgba(139, 92, 246, 0.38)',
                color: '#ddd6fe',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              <Volume2 size={14} />
              <span>AI Persona: Kore (Natural Human Voice) • Non-Stop Document Narrator</span>
            </div>
            <h1 className="pe-hero-title">
              ELZORA Interactive Voice Plan Explainer
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '0.86rem', color: '#94a3b8' }}>
              Active Knowledge Source: <strong style={{ color: '#e2e8f0' }}>{docMeta.title}</strong>
            </p>
          </div>

          {/* Pulsing Central Orb */}
          <div className="mic-stage">
            <span className="mic-ripple-ring" />
            <span className="mic-ripple-ring ring-2" />
            <button
              id="mainMicBtn"
              type="button"
              className="main-mic-btn"
              onClick={handleMainOrbClick}
              aria-label={isSpeaking ? 'Stop narration' : 'Start continuous narration'}
            >
              {isSpeaking ? <Square size={28} fill="currentColor" /> : <Play size={32} fill="currentColor" style={{ marginLeft: 4 }} />}
            </button>
          </div>

          {/* 7-Bar Audio Wave Visualizer */}
          <div id="audioVisualizer" className="audio-visualizer" aria-hidden="true">
            {Array.from({ length: 7 }).map((_, i) => (
              <span key={i} className="audio-bar" />
            ))}
          </div>

          <div
            id="voiceStatus"
            style={{
              fontSize: '0.86rem',
              fontWeight: 600,
              color: isSpeaking ? '#c4b5fd' : '#cbd5e1',
              textAlign: 'center',
            }}
          >
            {voiceStatus}
          </div>

          {/* Listening Mode & Topic Selector (Full Plan vs Topic-Wise) */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              background: 'rgba(8, 11, 28, 0.78)',
              padding: '14px 16px',
              borderRadius: 18,
              border: '1px solid rgba(139, 92, 246, 0.26)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#c4b5fd', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {language === 'hi'
                  ? 'सुनने का मोड चुनें — पूरा प्लान या टॉपिक के अनुसार'
                  : 'Choose Listening Mode — Full Document or Topic-Wise'}
              </span>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>
                {activeTopic === 'all'
                  ? language === 'hi'
                    ? `पूरा प्लान (${speechData.lines.length} लाइनें)`
                    : `Full Document (${speechData.lines.length} lines)`
                  : language === 'hi'
                    ? `टॉपिक मोड (${visibleLines.length} लाइनें)`
                    : `Topic Mode (${visibleLines.length} lines)`}
              </span>
            </div>

            <div className="pe-quick-chips" style={{ justifyContent: 'flex-start' }} role="group" aria-label="Listening topic selector">
              {LISTENING_TOPICS.map((t) => {
                const count =
                  t.id === 'all'
                    ? speechData.lines.length
                    : speechData.lines.filter((l) => l.topic === t.id).length
                const isSelected = activeTopic === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`pe-quick-chip ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => selectTopicAndPlay(t.id, true)}
                    style={
                      isSelected
                        ? {
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#ffffff',
                            borderColor: '#a855f7',
                            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.42)',
                          }
                        : undefined
                    }
                  >
                    {language === 'hi' ? t.hi : t.en} ({count})
                  </button>
                )
              })}
            </div>
          </div>

          {/* SYNCED TELEPROMPTER BOX */}
          <div id="answerBox" ref={teleprompterRef} className="teleprompter-box">
            <div className="teleprompter-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  id="lineCounterPill"
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: 'rgba(56, 189, 248, 0.14)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#7dd3fc',
                    fontSize: '0.73rem',
                    fontWeight: 800,
                  }}
                >
                  Line {currentLineIndex >= 0 ? currentLineIndex + 1 : 0} / {totalLines}
                </span>
                <span
                  id="nowPlayingPill"
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: isSpeaking ? 'rgba(139, 92, 246, 0.22)' : 'rgba(255, 255, 255, 0.06)',
                    border: `1px solid ${isSpeaking ? 'rgba(168, 85, 247, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
                    color: isSpeaking ? '#ddd6fe' : '#94a3b8',
                    fontSize: '0.73rem',
                    fontWeight: 700,
                  }}
                >
                  {isSpeaking ? '● NOW PLAYING (NON-STOP)' : '● TELEPROMPTER READY'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  id="stopSpeechBtn"
                  type="button"
                  onClick={stopSpeech}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 11px',
                    borderRadius: 8,
                    border: '1px solid rgba(239, 68, 68, 0.38)',
                    background: 'rgba(239, 68, 68, 0.14)',
                    color: '#fecaca',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Square size={12} />
                  <span>Stop</span>
                </button>
                <button
                  id="replayAudioBtn"
                  type="button"
                  onClick={() => {
                    setReadLines(new Set())
                    playFromLine(0)
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 11px',
                    borderRadius: 8,
                    border: '1px solid rgba(139, 92, 246, 0.45)',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#e0e7ff',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={12} />
                  <span>Replay All</span>
                </button>
              </div>
            </div>

            <div className="pe-progress-track" aria-hidden="true">
              <div
                className="pe-progress-fill"
                style={{
                  width: `${
                    totalLines > 0 && currentLineIndex >= 0
                      ? Math.round(((currentLineIndex + 1) / totalLines) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>

            <div id="answerBody" className="teleprompter-body">
              {visibleLines.map((line, idx) => {
                const isActive = isSpeaking && currentLineIndex === idx
                const isRead = readLines.has(idx) && !isActive
                return (
                  <button
                    key={idx}
                    id={`docLine_${idx}`}
                    ref={(el) => {
                      lineRefs.current[idx] = el
                    }}
                    type="button"
                    onClick={() => playFromLine(idx)}
                    className={`tele-line type-${line.type} ${isActive ? 'is-speaking' : ''} ${isRead ? 'is-read' : ''}`}
                  >
                    <span
                      style={{ flex: 1, lineHeight: 1.55 }}
                      dangerouslySetInnerHTML={{ __html: highlightTeleprompterHtml(line.text) }}
                    />
                    {isActive && (
                      <span className="mini-wave" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* INTERACTIVE 3D PLAN PILLAR CARDS DECK */}
        <section>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#818cf8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Interactive 3D Section Jumpers
              </div>
              <h2 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                Click Any Pillar to Jump & Narrate Continuously
              </h2>
            </div>
          </div>

          <div className="cards-grid-3d">
            {PILLAR_CARDS.map((card) => {
              const Icon = card.icon
              return (
                <button
                  key={card.topic}
                  type="button"
                  className="card-3d"
                  data-topic={card.topic}
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
                  onClick={() => handlePillarCardClick(card.topic)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 11,
                        background: `${card.color}20`,
                        color: card.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={19} />
                    </div>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '3px 9px',
                        borderRadius: 999,
                        background: `${card.color}18`,
                        border: `1px solid ${card.color}45`,
                        color: card.color,
                      }}
                    >
                      {card.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', marginBottom: 5 }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: '0.79rem', color: '#94a3b8', lineHeight: 1.45 }}>
                    {card.subtitle}
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      </div>

      {/* READ-ONLY PLAN DOCUMENT VIEWER MODAL */}
      {showDocModal && (
        <div id="docModalOverlay" className="pe-modal-overlay" role="dialog" aria-modal="true">
          <div className="pe-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} color="#c084fc" />
                  <span>ELZORA Official Business Plan Document</span>
                </h3>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 9px',
                    borderRadius: 999,
                    background: 'rgba(99, 102, 241, 0.16)',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    color: '#c4b5fd',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                  }}
                >
                  <Lock size={11} /> Read-Only Verified
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                aria-label="Close document viewer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="pe-doc-viewer">
              {docRaw.split(/\r?\n/).map((line, i) => {
                const t = line.trim()
                if (!t) return null
                if (t.startsWith('# ')) {
                  return <div key={i} className="pe-doc-h1">{t.replace(/^#\s*/, '')}</div>
                }
                if (t.startsWith('## ')) {
                  return <div key={i} className="pe-doc-h2">{t.replace(/^##\s*/, '')}</div>
                }
                if (/^[-•]\s+/.test(t)) {
                  return <div key={i} className="pe-doc-bullet">{t.replace(/^[-•]\s+/, '')}</div>
                }
                return <div key={i}>{t}</div>
              })}
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <a
                href="/docs/elzora-business-plan.md"
                download="ELZORA-Business-Plan.md"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: '#7dd3fc',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textDecoration: 'none',
                }}
              >
                <Download size={14} />
                <span>Download Official Plan (.md)</span>
              </a>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDocModal(false)
                    selectTopicAndPlay('all', true)
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 16px',
                    borderRadius: 10,
                    border: '1px solid rgba(139, 92, 246, 0.45)',
                    background: 'rgba(99, 102, 241, 0.18)',
                    color: '#e0e7ff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Play size={14} />
                  <span>Listen from Start</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#ffffff',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlanExplainerPage
