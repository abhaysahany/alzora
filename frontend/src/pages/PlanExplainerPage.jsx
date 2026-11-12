import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Square,
  FileText,
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
  KeyRound,
} from 'lucide-react'
import { PublicNavbar } from '../components/PublicNavbar'
import FibonacciGlobeCanvas from '../components/FibonacciGlobeCanvas'
import {
  getActivePlanDocument,
  getDocumentSourceMeta,
  getGeminiConfig,
  saveGeminiKey,
  PLAN_DOC_UPDATED_EVENT,
} from '../utils/elzoraKnowledge'
import { buildDocumentLines } from '../utils/planSpeechBuilder'
import {
  synthesizeGeminiKoreAudio,
  prefetchGeminiKoreAudio,
  selectBestBrowserKoreVoice,
  hasGeminiKoreKey,
} from '../utils/koreVoiceEngine'
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

export function PlanExplainerPage() {
  const [language, setLanguage] = useState('en')
  const [docRaw, setDocRaw] = useState(() => getActivePlanDocument())
  const [docMeta, setDocMeta] = useState(() => getDocumentSourceMeta())
  const [speechData, setSpeechData] = useState(() => buildDocumentLines(getActivePlanDocument(), 'en'))

  const [isSpeaking, setIsSpeaking] = useState(false)
  const [activeTopic, setActiveTopic] = useState('all')
  const [currentLineIndex, setCurrentLineIndex] = useState(-1)
  const [voiceStatus, setVoiceStatus] = useState('Ready — Listen to the Full Plan or pick any Topic Card below')
  const [voiceEngineMode, setVoiceEngineMode] = useState(() => (hasGeminiKoreKey() ? 'gemini-kore' : 'browser-kore'))

  // Read-only Document Viewer & Kore API Key Modal state
  const [showDocModal, setShowDocModal] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [geminiKeyInput, setGeminiKeyInput] = useState(() => getGeminiConfig().apiKey || '')
  const [hasGeminiKey, setHasGeminiKey] = useState(() => hasGeminiKoreKey())

  const visibleLines = useMemo(
    () => (activeTopic === 'all' ? speechData.lines : speechData.lines.filter((l) => l.topic === activeTopic)),
    [speechData.lines, activeTopic]
  )

  const keepAliveRef = useRef(null)
  const playbackSessionRef = useRef(0)
  const linesRef = useRef(visibleLines)
  const languageRef = useRef(language)
  const activeAudioRef = useRef(null)
  const abortControllerRef = useRef(null)
  const pauseTimerRef = useRef(null)

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

  const stopActiveMedia = useCallback(() => {
    clearKeepAlive()
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current)
      pauseTimerRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause()
        activeAudioRef.current.currentTime = 0
        activeAudioRef.current.onended = null
        activeAudioRef.current.onerror = null
      } catch {
        // Ignore audio cleanup errors
      }
      activeAudioRef.current = null
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }, [clearKeepAlive])

  const stopSpeech = useCallback(() => {
    playbackSessionRef.current += 1
    stopActiveMedia()
    setIsSpeaking(false)
    setVoiceStatus(
      languageRef.current === 'hi'
        ? 'ऑडियो रोका गया — जारी रखने के लिए ऑर्ब या किसी टॉपिक कार्ड पर क्लिक करें'
        : 'Narration stopped — Click the orb or any topic card to resume'
    )
  }, [stopActiveMedia])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      playbackSessionRef.current += 1
      stopActiveMedia()
    }
  }, [stopActiveMedia])

  const playFromLineRef = useRef(null)

  const playWithBrowserVoice = useCallback(
    (startIndex, sessionId, spokenText, totalCount) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setIsSpeaking(false)
        setVoiceStatus('Web Speech API is not supported in this browser.')
        return
      }

      setVoiceEngineMode('browser-kore')
      const utterance = new SpeechSynthesisUtterance(spokenText)
      const langCode = languageRef.current === 'hi' ? 'hi-IN' : 'en-US'
      utterance.lang = langCode
      utterance.rate = languageRef.current === 'hi' ? 0.96 : 0.98
      utterance.pitch = 1.03
      utterance.volume = 1.0

      const koreVoice = selectBestBrowserKoreVoice(languageRef.current)
      if (koreVoice) {
        utterance.voice = koreVoice
        utterance.lang = koreVoice.lang || langCode
      }

      setVoiceStatus(
        languageRef.current === 'hi'
          ? `Kore बोल रही है — पार्ट ${startIndex + 1} / ${totalCount}`
          : `Kore speaking — Part ${startIndex + 1} of ${totalCount}`
      )

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
        pauseTimerRef.current = setTimeout(() => {
          if (playbackSessionRef.current === sessionId) {
            playFromLineRef.current?.(startIndex + 1)
          }
        }, 160)
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

  const playFromLine = useCallback(
    async (startIndex) => {
      const lines = linesRef.current
      if (!lines || startIndex < 0 || startIndex >= lines.length) {
        stopActiveMedia()
        setIsSpeaking(false)
        setCurrentLineIndex(-1)
        setVoiceStatus(
          languageRef.current === 'hi'
            ? 'संपूर्ण बिज़नेस प्लान का वाचन पूरा हुआ!'
            : 'Complete business plan narration finished!'
        )
        return
      }

      const sessionId = ++playbackSessionRef.current
      stopActiveMedia()

      const lineObj = lines[startIndex]
      const spokenText = lineObj.spoken || lineObj.text
      setIsSpeaking(true)
      setCurrentLineIndex(startIndex)

      // 1. Prefer official Google Gemini "Kore" neural voice when API key is connected
      if (hasGeminiKoreKey()) {
        setVoiceEngineMode('gemini-kore')
        setVoiceStatus(
          languageRef.current === 'hi'
            ? `Kore Neural (Gemini) तैयार हो रही है — पार्ट ${startIndex + 1} / ${lines.length}`
            : `Kore Neural (Gemini) speaking — Part ${startIndex + 1} of ${lines.length}`
        )

        const controller = new AbortController()
        abortControllerRef.current = controller

        try {
          const audioUrl = await synthesizeGeminiKoreAudio(spokenText, languageRef.current, controller.signal)
          if (playbackSessionRef.current !== sessionId) return

          if (audioUrl) {
            const audio = new Audio(audioUrl)
            activeAudioRef.current = audio

            // Prefetch next line in background for seamless non-stop flow
            const nextLine = lines[startIndex + 1]
            if (nextLine) {
              prefetchGeminiKoreAudio(nextLine.spoken || nextLine.text, languageRef.current)
            }

            setVoiceStatus(
              languageRef.current === 'hi'
                ? `Kore Neural बोल रही है — पार्ट ${startIndex + 1} / ${lines.length}`
                : `Kore Neural speaking — Part ${startIndex + 1} of ${lines.length}`
            )

            audio.onended = () => {
              if (playbackSessionRef.current !== sessionId) return
              activeAudioRef.current = null
              pauseTimerRef.current = setTimeout(() => {
                if (playbackSessionRef.current === sessionId) {
                  playFromLineRef.current?.(startIndex + 1)
                }
              }, 140)
            }

            audio.onerror = () => {
              if (playbackSessionRef.current !== sessionId) return
              activeAudioRef.current = null
              playWithBrowserVoice(startIndex, sessionId, spokenText, lines.length)
            }

            await audio.play()
            return
          }
        } catch {
          if (playbackSessionRef.current !== sessionId) return
          // Fall back cleanly to browser Kore voice
        }
      }

      // 2. Zero-key Browser Kore Studio Voice (natural female voice + tuned prosody)
      if (playbackSessionRef.current === sessionId) {
        playWithBrowserVoice(startIndex, sessionId, spokenText, lines.length)
      }
    },
    [playWithBrowserVoice, stopActiveMedia]
  )

  useEffect(() => {
    playFromLineRef.current = playFromLine
  }, [playFromLine])

  const handleLanguageChange = (nextLang) => {
    if (nextLang === language) return
    stopSpeech()
    setLanguage(nextLang)
    setCurrentLineIndex(-1)
    const rebuilt = buildDocumentLines(docRaw, nextLang)
    setSpeechData(rebuilt)
    setVoiceStatus(
      nextLang === 'hi'
        ? 'भाषा हिंदी (Kore AI) में बदली गई — शुरू करने के लिए ऑर्ब या किसी कार्ड पर क्लिक करें'
        : 'Language switched to English (Kore AI) — Click the orb or any card to start narration'
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
    if (isSpeaking && activeTopic === topicId) {
      stopSpeech()
      return
    }
    stopSpeech()
    const nextLines =
      topicId === 'all' ? speechData.lines : speechData.lines.filter((l) => l.topic === topicId)
    setActiveTopic(topicId)
    setCurrentLineIndex(-1)
    linesRef.current = nextLines
    if (autoPlay && nextLines.length > 0) {
      playFromLine(0)
    }
  }

  const handlePillarCardClick = (topic) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
    <div className="pe-page" style={{ paddingBottom: 0 }}>
      <div className="bgfx" />
      <div className="bg-grid" />
      <FibonacciGlobeCanvas />
      <PublicNavbar />

      <div className="pe-shell">
        {/* CENTRAL CONTINUOUS NARRATION PANEL */}
        <section
          className="voice-panel pe-glass"
          data-state={isSpeaking ? 'speaking' : 'idle'}
        >
          {/* Voice Controls Toolbar */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
              paddingBottom: 14,
              borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
            }}
          >
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button
                id="openKoreKeyModalBtn"
                type="button"
                onClick={() => setShowKeyModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 13px',
                  borderRadius: 11,
                  border: hasGeminiKey
                    ? '1px solid rgba(56, 189, 248, 0.45)'
                    : '1px solid rgba(148, 163, 184, 0.3)',
                  background: hasGeminiKey ? 'rgba(56, 189, 248, 0.14)' : 'rgba(15, 23, 42, 0.55)',
                  color: hasGeminiKey ? '#7dd3fc' : '#cbd5e1',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <KeyRound size={14} />
                <span>{hasGeminiKey ? 'Kore Neural Active' : 'Kore Voice Setup'}</span>
              </button>

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
          </div>
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
              <span>
                {voiceEngineMode === 'gemini-kore'
                  ? 'AI Persona: Gemini Kore (Official Neural Voice) • Non-Stop Narrator'
                  : 'AI Persona: Kore (Natural Studio Voice) • Non-Stop Document Narrator'}
              </span>
            </div>
            <h1 className="pe-hero-title">
              ELZORA Interactive Voice Plan Explainer
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '0.86rem', color: '#94a3b8' }}>
              Active Knowledge Source: <strong style={{ color: '#e2e8f0' }}>{docMeta.title}</strong>
            </p>
          </div>

          {/* Pulsing Orbital Kore Voice Orb */}
          <div className="mic-stage">
            <span className="mic-orbit-ring" />
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

          {/* Compact Live Progress & Single Active Caption (shown when active) */}
          {(isSpeaking || currentLineIndex >= 0) && (
            <div className="pe-live-caption">
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
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    {activeTopic === 'all'
                      ? language === 'hi'
                        ? `पूरा प्लान • अध्याय ${currentLineIndex + 1} / ${totalLines}`
                        : `Full Plan • Part ${currentLineIndex + 1} of ${totalLines}`
                      : language === 'hi'
                        ? `टॉपिक • अध्याय ${currentLineIndex + 1} / ${totalLines}`
                        : `Topic • Part ${currentLineIndex + 1} of ${totalLines}`}
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#f1f5f9', lineHeight: 1.5 }}>
                    {visibleLines[currentLineIndex]?.text || ''}
                  </div>
                </div>
                {isSpeaking && (
                  <span className="mini-wave" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ANIMATED FULL PLAN & TOPIC CARDS DECK */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#818cf8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {language === 'hi' ? 'वॉइस प्लेयर मोड्स' : 'Interactive Voice Player Cards'}
              </div>
              <h2 style={{ margin: '2px 0 0', fontSize: '1.28rem', fontWeight: 800, color: '#fff' }}>
                {language === 'hi'
                  ? 'पूरा बिज़नेस प्लान एक साथ सुनें या किसी भी टॉपिक कार्ड पर क्लिक करें'
                  : 'Listen to the Full Business Plan or Click Any Topic Card'}
              </h2>
            </div>
          </div>

          {/* Featured Full Business Plan Animated Card */}
          <button
            type="button"
            className={`pe-full-plan-card ${activeTopic === 'all' && isSpeaking ? 'is-active-topic' : ''}`}
            onClick={() => selectTopicAndPlay('all', true)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 240, flex: 1 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.45)',
                  flexShrink: 0,
                }}
              >
                {activeTopic === 'all' && isSpeaking ? <Square size={20} fill="currentColor" /> : <Play size={22} fill="currentColor" style={{ marginLeft: 2 }} />}
              </div>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#ffffff', marginBottom: 3 }}>
                  {language === 'hi'
                    ? 'संपूर्ण ELZORA A-to-Z बिज़नेस प्लान सुनें'
                    : 'Listen Full ELZORA A-to-Z Business Plan'}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                  {language === 'hi'
                    ? '$50 पैकेज, सभी 8 इनकम स्ट्रीम्स, 8 क्लब रैंक, 27 माइलस्टोन, $25 ग्लोबल क्लब और ब्रेक-ईवन एक साथ सुनें'
                    : 'Continuous A-to-Z narration covering $50 package, all 8 income streams, 8 Club Ranks, 27 Milestones & Break-Even math'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  padding: '6px 12px',
                  borderRadius: 999,
                  background: 'rgba(139, 92, 246, 0.22)',
                  border: '1px solid rgba(168, 85, 247, 0.5)',
                  color: '#e9d5ff',
                }}
              >
                {speechData.lines.length} {language === 'hi' ? 'अध्याय • फुल प्लान' : 'Parts • Full Plan'}
              </span>
              {activeTopic === 'all' && isSpeaking && (
                <span className="mini-wave" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              )}
            </div>
          </button>

          <div className="cards-grid-3d">
            {PILLAR_CARDS.map((card, idx) => {
              const Icon = card.icon
              const isCardSpeaking = isSpeaking && activeTopic === card.topic
              return (
                <button
                  key={card.topic}
                  type="button"
                  className={`card-3d ${isCardSpeaking ? 'is-active-topic' : ''}`}
                  data-topic={card.topic}
                  style={{ animationDelay: `${idx * 65}ms` }}
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
                  onClick={() => handlePillarCardClick(card.topic)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: `${card.color}22`,
                        border: `1px solid ${card.color}40`,
                        color: card.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={19} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isCardSpeaking && (
                        <span className="mini-wave" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </span>
                      )}
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
                        {isCardSpeaking ? 'SPEAKING' : card.badge}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff', marginBottom: 5 }}>
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

      {/* FOOTER (MATCHING ALL PUBLIC ELZORA PAGES) */}
      <footer style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(139, 92, 246, 0.2)', padding: '50px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 12 }}>
            <img
              src="/logo.png"
              alt="ELZORA"
              style={{
                height: 38,
                width: 'auto',
                objectFit: 'contain',
                display: 'inline-block',
                filter: 'drop-shadow(0 2px 10px rgba(245, 158, 11, 0.35))',
              }}
            />
          </div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 20 }}>
            Next-Generation Decentralized Binary Matrix & Smart Club Ecosystem • Powered by BNB Smart Chain
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, fontSize: '0.82rem', fontWeight: 700, marginBottom: 24, flexWrap: 'wrap' }}>
            <Link to="/login" style={{ color: '#c084fc', textDecoration: 'none' }}>Member Login</Link>
            <Link to="/register" style={{ color: '#38bdf8', textDecoration: 'none' }}>Register ($50 USDT)</Link>
            <Link to="/lookup" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Public Account Explorer</Link>
            <a href="https://testnet.bscscan.com" target="_blank" rel="noreferrer" style={{ color: '#94a3b8', textDecoration: 'none' }}>BSC Testnet Explorer</a>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#475569' }}>
            © 2026 ELZORA Protocol. All rights reserved.
          </div>
        </div>
      </footer>

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

      {/* GEMINI KORE NEURAL VOICE SETUP MODAL */}
      {showKeyModal && (
        <div className="pe-modal-backdrop" onClick={() => setShowKeyModal(false)}>
          <div
            className="pe-modal-card"
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <KeyRound size={20} style={{ color: '#38bdf8' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                    Gemini Kore Neural Voice Setup
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#94a3b8' }}>
                    Connect a Gemini API key to use Google’s official Kore voice (`gemini-2.5-flash-preview-tts`).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                aria-label="Close voice setup modal"
                style={{
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#cbd5e1',
                  borderRadius: 10,
                  width: 34,
                  height: 34,
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <label
              htmlFor="koreGeminiKeyInput"
              style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 8 }}
            >
              Gemini API Key (stored locally in your browser)
            </label>
            <input
              id="koreGeminiKeyInput"
              type="password"
              value={geminiKeyInput}
              onChange={(e) => setGeminiKeyInput(e.target.value)}
              placeholder="AIza..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid rgba(139, 92, 246, 0.35)',
                background: 'rgba(15, 23, 42, 0.85)',
                color: '#f8fafc',
                fontSize: '0.86rem',
                outline: 'none',
                marginBottom: 14,
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  saveGeminiKey('')
                  setGeminiKeyInput('')
                  setHasGeminiKey(false)
                  setVoiceEngineMode('browser-kore')
                  setShowKeyModal(false)
                }}
                style={{
                  padding: '9px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#fecaca',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Use Browser Kore Fallback
              </button>

              <button
                type="button"
                onClick={() => {
                  const trimmed = geminiKeyInput.trim()
                  saveGeminiKey(trimmed)
                  const active = Boolean(trimmed) || hasGeminiKoreKey()
                  setHasGeminiKey(active)
                  setVoiceEngineMode(active ? 'gemini-kore' : 'browser-kore')
                  setShowKeyModal(false)
                }}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Save & Activate Kore Neural
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlanExplainerPage
