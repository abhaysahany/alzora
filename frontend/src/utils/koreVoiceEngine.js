import { getGeminiConfig } from './elzoraKnowledge'

const GEMINI_TTS_MODEL = 'gemini-2.5-flash-preview-tts'
const KORE_VOICE_NAME = 'Kore'

// In-memory cache of synthesized WAV object URLs keyed by `${language}:${text}`
const audioUrlCache = new Map()
const pendingSynthesis = new Map()

/**
 * Convert raw 16-bit signed little-endian PCM bytes into a playable WAV Blob.
 */
function pcm16ToWavBlob(pcmBytes, sampleRate = 24000, numChannels = 1) {
  const bytesPerSample = 2
  const blockAlign = numChannels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = pcmBytes.byteLength
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i += 1) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true) // PCM chunk size
  view.setUint16(20, 1, true) // AudioFormat = PCM
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true) // BitsPerSample
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)

  new Uint8Array(buffer, 44).set(pcmBytes)
  return new Blob([buffer], { type: 'audio/wav' })
}

function base64ToUint8Array(base64) {
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function parseSampleRate(mimeType = '') {
  const match = /rate=(\d+)/i.exec(mimeType)
  return match ? Number(match[1]) : 24000
}

/**
 * Synthesize a single line using Google Gemini's official prebuilt "Kore" voice.
 * Returns an object URL (audio/wav) or null if unavailable.
 */
export async function synthesizeGeminiKoreAudio(text, language = 'en', signal) {
  const cleanText = String(text || '').trim()
  if (!cleanText) return null

  const { apiKey } = getGeminiConfig()
  if (!apiKey) return null

  const cacheKey = `${language}:${cleanText}`
  if (audioUrlCache.has(cacheKey)) {
    return audioUrlCache.get(cacheKey)
  }

  if (pendingSynthesis.has(cacheKey)) {
    return pendingSynthesis.get(cacheKey)
  }

  const promptPrefix =
    language === 'hi'
      ? 'Speak warmly, clearly, and professionally in natural conversational Hindi for an ELZORA business plan presentation:\n\n'
      : 'Speak warmly, clearly, and professionally in natural conversational English for an ELZORA business plan presentation:\n\n'

  const task = (async () => {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent?key=${encodeURIComponent(
      apiKey
    )}`

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${promptPrefix}${cleanText}` }],
          },
        ],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: KORE_VOICE_NAME,
              },
            },
          },
        },
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`Gemini Kore TTS failed (${res.status}): ${errText.slice(0, 160)}`)
    }

    const data = await res.json()
    const inlineData = data?.candidates?.[0]?.content?.parts?.find((p) => p?.inlineData?.data)?.inlineData
    if (!inlineData?.data) {
      throw new Error('Gemini Kore TTS returned no audio payload')
    }

    const mime = inlineData.mimeType || 'audio/L16;rate=24000'
    const rawBytes = base64ToUint8Array(inlineData.data)

    const blob =
      /wav/i.test(mime) || /mpeg|mp3|ogg|webm/i.test(mime)
        ? new Blob([rawBytes], { type: mime })
        : pcm16ToWavBlob(rawBytes, parseSampleRate(mime), 1)

    const objectUrl = URL.createObjectURL(blob)
    audioUrlCache.set(cacheKey, objectUrl)
    return objectUrl
  })()

  pendingSynthesis.set(cacheKey, task)
  try {
    return await task
  } finally {
    pendingSynthesis.delete(cacheKey)
  }
}

/**
 * Prefetch upcoming line audio in the background when Gemini Kore TTS is enabled.
 */
export function prefetchGeminiKoreAudio(text, language = 'en') {
  const { apiKey } = getGeminiConfig()
  if (!apiKey || !text) return
  const cacheKey = `${language}:${String(text).trim()}`
  if (audioUrlCache.has(cacheKey) || pendingSynthesis.has(cacheKey)) return
  synthesizeGeminiKoreAudio(text, language).catch(() => {
    // Ignore prefetch failures; live playback handles fallback cleanly
  })
}

/**
 * Score and pick the clearest, most natural female voice available in the browser
 * as a zero-key fallback that closely matches Kore's warm female tone.
 */
export function selectBestBrowserKoreVoice(language = 'en') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices() || []
  if (!voices.length) return null

  const isHindi = language === 'hi'
  const langMatches = voices.filter((v) => {
    const code = (v.lang || '').toLowerCase()
    return isHindi ? code.startsWith('hi') : code.startsWith('en')
  })

  const pool = langMatches.length ? langMatches : voices

  const scoreVoice = (voice) => {
    const name = (voice.name || '').toLowerCase()
    const lang = (voice.lang || '').toLowerCase()
    let score = 0

    // Strongly deprioritize male voices for Kore persona
    if (/\b(david|mark|guy|george|daniel|james|richard|rishi|hemant|madhur|prabhat|ravi|alex|fred|eric|ryan|christopher|andrew|brian|male)\b/.test(name)) {
      score -= 120
    }

    if (isHindi) {
      if (/swara/.test(name)) score += 110
      if (/neerja|ananya/.test(name)) score += 95
      if (/google.*हिन्दी|google.*hindi/.test(name)) score += 90
      if (/natural|online/.test(name)) score += 45
      if (/female|lekha|heera|kalpana/.test(name)) score += 35
      if (lang === 'hi-in') score += 20
    } else {
      if (/aria/.test(name)) score += 110
      if (/jenny|sonia|natasha|clara/.test(name)) score += 100
      if (/google uk english female/.test(name)) score += 95
      if (/google us english/.test(name)) score += 90
      if (/samantha|karen|moira|tessa|serena/.test(name)) score += 85
      if (/natural|online/.test(name)) score += 45
      if (/female|zira|hazel|susan|eva|libby/.test(name)) score += 35
      if (lang === 'en-us' || lang === 'en-gb' || lang === 'en-in') score += 20
    }

    if (!voice.localService) score += 10
    return score
  }

  return [...pool].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || null
}

export function hasGeminiKoreKey() {
  return Boolean(getGeminiConfig().apiKey)
}

