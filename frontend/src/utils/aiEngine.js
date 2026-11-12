import { getActivePlanDocument, getGeminiConfig } from './elzoraKnowledge'

const HEALTH_TIMEOUT_MS = 1800

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatInlineMarkdown(escapedText) {
  return escapedText
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>')
}

/**
 * Shared HTML formatter for both Sentinel Guard AI & Plan Explainer AI
 * Ensures every response renders cleanly with structured headings, summaries, and bullet lists.
 */
export function formatSafeReplyHtml(text) {
  const lines = String(text || '').split(/\r?\n/)
  const out = []
  let inList = false

  const closeList = () => {
    if (inList) {
      out.push('</ul>')
      inList = false
    }
  }

  for (const rawLine of lines) {
    const trimmed = rawLine.trim()
    if (!trimmed || /^\|[-\s|:]+\|$/.test(trimmed)) {
      closeList()
      continue
    }

    // Heading line: ### Title (strips redundant leading section numbers like "5. ")
    if (/^#{1,3}\s+/.test(trimmed)) {
      closeList()
      const rawTitle = trimmed.replace(/^#{1,3}\s+/, '').replace(/^\d+\.\s+(?=\p{L})/u, '')
      out.push(`<div class="chat-reply-title">${formatInlineMarkdown(escapeHtml(rawTitle))}</div>`)
      continue
    }

    if (/^\*\*[^*]+\*\*:?$/.test(trimmed)) {
      closeList()
      const rawTitle = trimmed.replace(/^\*\*/, '').replace(/\*\*:?$/, '')
      out.push(`<div class="chat-reply-title">${escapeHtml(rawTitle)}</div>`)
      continue
    }

    // Markdown table row: | Col1 | Col2 | -> formatted list row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean)
      if (cells.length >= 2 && !/^(#|tier|rank|income stream|level|stage|item)$/i.test(cells[0])) {
        if (!inList) {
          out.push('<ul class="chat-reply-list">')
          inList = true
        }
        const label = escapeHtml(cells[0])
        const rest = escapeHtml(cells.slice(1).join(' — '))
        out.push(`<li><strong>${label}:</strong> ${formatInlineMarkdown(rest)}</li>`)
      }
      continue
    }

    // Bullet item: • ..., - ..., or * ...
    if (/^(?:•|-|\*)\s+/.test(trimmed)) {
      if (!inList) {
        out.push('<ul class="chat-reply-list">')
        inList = true
      }
      const itemText = escapeHtml(trimmed.replace(/^(?:•|-|\*)\s+/, ''))
      out.push(`<li>${formatInlineMarkdown(itemText)}</li>`)
      continue
    }

    // Numbered item: 1. ...
    if (/^\d+\.\s+/.test(trimmed)) {
      if (!inList) {
        out.push('<ul class="chat-reply-list">')
        inList = true
      }
      const escaped = escapeHtml(trimmed)
      out.push(`<li>${formatInlineMarkdown(escaped)}</li>`)
      continue
    }

    closeList()
    out.push(`<p class="chat-reply-p">${formatInlineMarkdown(escapeHtml(trimmed))}</p>`)
  }

  closeList()
  return out.join('')
}

function normalizeText(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s$%]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function detectHindiPreference(question, language = 'en') {
  if (language === 'hi' || /[\u0900-\u097F]/.test(question)) return true
  return /\b(kya|kaise|kitna|kitne|kitni|kyu|kyon|kab|kahan|batao|bataiye|samjhao|chahiye|milega|milta|milti|hota|hoti|sakta|sakti|sakte|puri|poori|jankari|paisa|paise|kamai|kama|judna|judne|nikal|nikalne|karna|kare|karke|isme|usme|nahi|nhi|kaun|kaunsa|hoga|hogi|tarike|tarah|lagana|lagta)\b/i.test(
    String(question || '')
  )
}

function stemToken(w) {
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y'
  if (w.length > 4 && w.endsWith('es')) return w.slice(0, -2)
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1)
  return w
}

function tokenize(str) {
  const stopWords = new Set([
    'what', 'is', 'the', 'how', 'does', 'do', 'can', 'i', 'in', 'on', 'of', 'for', 'to', 'and',
    'or', 'are', 'me', 'my', 'with', 'about', 'explain', 'tell', 'give', 'elzora', 'project', 'system',
    'many', 'much', 'there', 'here', 'this', 'that', 'will', 'get', 'when', 'where', 'why', 'all',
    'full', 'complete', 'a', 'an', 'it', 'if', 'please', 'work', 'works', 'kya', 'hai', 'kaise',
    'mein', 'ka', 'ki', 'ke', 'ko', 'se', 'aur', 'batao', 'bataiye', 'please', 'kitna', 'kitne', 'kitni',
  ])
  return normalizeText(str)
    .split(' ')
    .filter((w) => w.length > 1 && !stopWords.has(w))
    .map(stemToken)
}

const RESTRICTED_QUERY_REGEX =
  /\b(0x[a-f0-9]{4,}|contract\s+add?ress|smart\s+contract\s+add?ress|token\s+add?ress|usdt\s+add?ress|treasury\s+add?ress|owner\s+add?ress|admin\s+add?ress|proxy\s+add?ress|gateway\s+add?ress|deployment\s+add?ress|mainnet\s+add?ress|testnet\s+add?ress|bscscan|block\s+explorer|source\s+code|solidity|bytecode|\babi\b|rpc\s+url|chain\s+id|uups|proxy\s+contract|open\s*zeppelin|elzoramain|elzoragateway|elzoraproxy|github|internal\s+function|smart\s+contract\s+architecture|admin\s+limit|admin\s+privilege|admin\s+power|admin\s+control|owner\s+power|owner\s+can|admin\s+can|emergency\s*rescue|ownership\s*transfer|private\s+key|seed\s+phrase|mnemonic|hack|exploit|bypass|vulnerability|reentrancy|attack|drain|rug\s*pull|cheat|crack|prompt\s*injection|ignore\s+previous|system\s+prompt|address\s+batao|address\s+do|address\s+kya|contract\s+kahan|\.sol\b)\b/i

const SENSITIVE_OUTPUT_REGEX =
  /0x[a-fA-F0-9]{12,}|\b(ElzoraMain|ElzoraGateway|ElzoraProxy|emergencyRescue|UUPSUpgradeable|Ownable2StepUpgradeable|PausableUpgradeable|AlreadyRegistered|CannotSponsorSelf|SponsorNotActive|ParentNotActive|PositionAlreadyOccupied|CircularReferralDetected|leftDirectCount|rightDirectCount|Chain\s*(?:ID\s*)?(?:56|97))\b|register\(sponsor|\.sol\b/i

function isRestrictedTechnicalOrUnsafeQuery(question) {
  const raw = String(question || '').trim()
  if (!raw) return false
  if (RESTRICTED_QUERY_REGEX.test(raw)) return true
  const lower = raw.toLowerCase()
  if (/\baddress(es)?\b/.test(lower) && /\b(contract|token|usdt|treasury|owner|admin|proxy|gateway|bsc|chain|mainnet|testnet|smart|send|kya|batao|do|hai)\b/.test(lower)) {
    return true
  }
  if (/\b(admin|owner)\b/.test(lower) && /\b(power|control|privilege|pause|freeze|rescue|kya|kar|badal|key|address)\b/.test(lower)) {
    return true
  }
  if (/\b(smart\s+contract|contract\s+code|testnet|mainnet)\b/.test(lower)) {
    return true
  }
  return false
}

function buildRestrictedScopeReply(isHindi = false) {
  return isHindi
    ? `### केवल बिज़नेस प्लान और प्लान फ्लो सहायता
सुरक्षा और गोपनीयता नीति के कारण **Sentinel Guard AI** स्मार्ट कॉन्ट्रैक्ट एड्रेस, तकनीकी कोड, एडमिन नियंत्रण या इंटरनल सुरक्षा विवरण साझा नहीं करता है।
• **मैं किस विषय में मदद कर सकता हूँ:** ELZORA के सम्पूर्ण **बिज़नेस प्लान और वर्किंग फ्लो** ($50 पैकेज वितरण, **8 इनकम स्ट्रीम्स**, 20-लेवल एफिलिएट, 8 क्लब रैंक, 1:1 बाइनरी मैचिंग, $25 ग्लोबल क्लब, और 27 लाइफटाइम माइलस्टोन)।
• **उपयोगी उदाहरण:** पूछें *"जॉइन कैसे करें?"*, *"कितनी तरह की इनकम है?"*, या *"ब्रेक-ईवन कैसे होता है?"*।`
    : `### Business Plan & Plan Flow Assistant Only
For security and privacy protection, **Sentinel Guard AI** does not share smart contract addresses, internal code/architecture, admin permissions, or security/technical internals.
• **What I Can Help With:** Complete ELZORA **business plan & user flow** — the **$50 USDT package**, **8 income streams**, 20-level affiliate chain, **8 Club Ranks**, **1:1 Binary Matching**, **$25 Global Club**, and **27 Lifetime Milestones**.
• **Try Asking:** *"How many incomes in this project?"*, *"How much is needed to join?"*, or *"Explain the break-even and weekly pool rules."*`
}

function stripSensitiveTechnicalContext(docText) {
  const raw = String(docText || '')
  const hasElzora = raw.toLowerCase().includes('elzora')
  const cleaned = raw
    .split(/(?=^#{2,3}\s+)/m)
    .filter((section) => {
      const head = (section.split(/\r?\n/)[0] || '').toLowerCase()
      return !/\b(smart contract|architecture|addresses|admin|solvency|security|testnet|mainnet)\b/.test(head)
    })
    .join('\n')
    .split(/\r?\n/)
    .filter((line) => !SENSITIVE_OUTPUT_REGEX.test(line))
    .join('\n')
  if (hasElzora && !cleaned.toLowerCase().includes('elzora')) {
    return `# ELZORA Official Business Plan\n${cleaned}`
  }
  return cleaned
}

function sanitizeBusinessPlanReply(replyText, isHindi = false) {
  const text = String(replyText || '').trim()
  if (!text) return buildRestrictedScopeReply(isHindi)
  if (SENSITIVE_OUTPUT_REGEX.test(text)) {
    return buildRestrictedScopeReply(isHindi)
  }
  return text
}

function formatDocExcerptLines(sectionText, isHindi = false) {
  const lines = String(sectionText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^\|[-\s|:]+\|$/.test(l))

  const rawHeading = lines[0]?.startsWith('#')
    ? lines[0].replace(/^#+\s*/, '').replace(/^\d+\.\s+(?=\p{L})/u, '').trim()
    : 'Official ELZORA Business Plan Specification'
  const bullets = []

  for (const raw of lines.slice(lines[0]?.startsWith('#') ? 1 : 0)) {
    if (raw.startsWith('#')) continue
    if (raw.startsWith('|')) {
      const cells = raw
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean)
      if (cells.length >= 2 && !/^(#|tier|rank|income stream|level|stage|item)$/i.test(cells[0])) {
        bullets.push(`• **${cells[0]}:** ${cells.slice(1).join(' | ')}`)
      }
      continue
    }

    const clean = raw.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim()
    if (clean.length <= 8) continue

    // Split multi-clause "(1) ...; (2) ...; (3) ..." text blobs into crisp individual bullets
    if (/\(\d\)/.test(clean) && clean.includes(';')) {
      const subParts = clean.split(/;\s*(?=\(\d\))/)
      for (const part of subParts) {
        const cleanedPart = part.trim()
        if (cleanedPart.length > 6) {
          bullets.push(`• ${cleanedPart}`)
        }
        if (bullets.length >= 8) break
      }
    } else {
      bullets.push(`• ${clean}`)
    }
    if (bullets.length >= 8) break
  }

  if (!bullets.length) return ''
  const intro = isHindi
    ? 'आधिकारिक ELZORA डॉक्यूमेंटेशन से सत्यापित प्रमुख विवरण:'
    : 'Key verified protocol details from the official documentation:'
  return `### ${rawHeading}\n${intro}\n${bullets.join('\n')}`
}

function searchDocumentChunks(query, docText, maxChunks = 1, isHindi = false) {
  const tokens = tokenize(query)
  const cleanDoc = stripSensitiveTechnicalContext(docText)
  const rawSections = String(cleanDoc || '')
    .split(/(?=^#{1,3}\s+)/m)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && !SENSITIVE_OUTPUT_REGEX.test(s))

  if (!rawSections.length) return []

  const scored = rawSections.map((chunk, idx) => {
    const firstLine = (chunk.split(/\r?\n/)[0] || '').toLowerCase()
    const lower = chunk.toLowerCase()
    let score = 0
    for (const tok of tokens) {
      if (firstLine.includes(tok)) {
        score += 6
      } else if (lower.includes(tok)) {
        score += tok.length > 4 ? 3 : 2
      }
    }
    if (tokens.length === 0 && idx === 0) score = 1
    return { chunk, score, idx }
  })

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .slice(0, maxChunks)
    .map((item) => formatDocExcerptLines(item.chunk, isHindi))
    .filter(Boolean)
}

const MILESTONES_DATA = [
  [1, 5, 5, 25, 1],
  [2, 20, 20, 75, 1],
  [3, 50, 50, 150, 1],
  [4, 100, 100, 300, 1],
  [5, 250, 250, 750, 1],
  [6, 500, 500, 1500, 2],
  [7, 1000, 1000, 3000, 2],
  [8, 2000, 2000, 6000, 2],
  [9, 4000, 4000, 12000, 2],
  [10, 8000, 8000, 25000, 2],
  [11, 15000, 15000, 50000, 3],
  [12, 30000, 30000, 100000, 3],
  [13, 60000, 60000, 200000, 3],
  [14, 120000, 120000, 400000, 3],
  [15, 250000, 250000, 800000, 3],
  [16, 500000, 500000, 1500000, 4],
  [17, 1000000, 1000000, 3000000, 4],
  [18, 1500000, 1500000, 4500000, 4],
  [19, 2000000, 2000000, 6000000, 4],
  [20, 2500000, 2500000, 7500000, 4],
  [21, 3000000, 3000000, 9000000, 5],
  [22, 3500000, 3500000, 10500000, 5],
  [23, 4000000, 4000000, 12000000, 5],
  [24, 4500000, 4500000, 13500000, 5],
  [25, 5000000, 5000000, 15000000, 6],
  [26, 6000000, 6000000, 18000000, 6],
  [27, 7000000, 7000000, 21000000, 6],
]

const CLUB_RANKS_DATA = [
  { rank: 1, name: 'Starter', team: 2, gross: 24, upgrade: '$14 (to Leader)', sponsor: 0, net: 10 },
  { rank: 2, name: 'Leader', team: 4, gross: 56, upgrade: '$30 (to Achiever)', sponsor: 0, net: 26 },
  { rank: 3, name: 'Achiever', team: 8, gross: 240, upgrade: '$96 (to Mentor)', sponsor: 24, net: 120 },
  { rank: 4, name: 'Mentor', team: 16, gross: 1536, upgrade: '$500 (to Director)', sponsor: 125, net: 911 },
  { rank: 5, name: 'Director', team: 32, gross: 16000, upgrade: '$5,000 (to Elite)', sponsor: 1250, net: 9750 },
  { rank: 6, name: 'Elite', team: 64, gross: 320000, upgrade: '$15,000 (to Crown)', sponsor: 3750, net: 301250 },
  { rank: 7, name: 'Crown', team: 128, gross: 1920000, upgrade: '$30,000 (to Legend)', sponsor: 7500, net: 1882500 },
  { rank: 8, name: 'Legend', team: 256, gross: 7680000, upgrade: 'Re-top Up Cycle', sponsor: 0, net: 7680000 },
]

function buildDeterministicElzoraAnswer(question, docText, language = 'en') {
  const q = normalizeText(question)
  const isHindi = detectHindiPreference(question, language)

  // Restricted technical / contract address / admin / unsafe queries guard
  if (isRestrictedTechnicalOrUnsafeQuery(question)) {
    return buildRestrictedScopeReply(isHindi)
  }

  if (!String(docText || '').toLowerCase().includes('elzora')) {
    const customChunks = searchDocumentChunks(question, docText, 2)
    if (customChunks.length > 0) {
      return customChunks.join('\n\n')
    }
    return 'No matching section was found in the active document.'
  }

  // 1. Specific Milestone lookup (e.g., "milestone 10", "m27")
  const msMatch = q.match(/\b(?:milestone|m)\s*#?\s*(\d{1,2})\b/i)
  if (msMatch) {
    const tier = parseInt(msMatch[1], 10)
    const row = MILESTONES_DATA.find((r) => r[0] === tier)
    if (row) {
      const [id, left, right, reward, directs] = row
      const extra =
        id === 1
          ? isHindi
            ? ' (यदि Global Club जॉइन नहीं किया है तो $25 ऑटो-एक्टिवेट करता है; अन्यथा $25 वॉलेट में जाता है)'
            : ' (auto-activates $25 Global Club if not yet joined; otherwise pays $25 USDT to wallet)'
          : ''
      return isHindi
        ? `### लाइफटाइम माइलस्टोन #${id}\n• **आवश्यक टीम:** ${left.toLocaleString()} Left / ${right.toLocaleString()} Right\n• **रिवॉर्ड:** **$${reward.toLocaleString()} USDT**${extra}\n• **डायरेक्ट शर्त:** न्यूनतम **${directs} डायरेक्ट रेफरल** (शर्त पूरी होने तक बिना एक्सपायर हुए सुरक्षित प्रतीक्षा करता है)।`
        : `### Lifetime Milestone #${id}\n• **Required Team:** **${left.toLocaleString()} Left / ${right.toLocaleString()} Right**\n• **Instant Reward:** **$${reward.toLocaleString()} USDT**${extra}\n• **Direct Requirement:** Minimum **${directs} direct referral(s)** (waits safely without expiring or diverting to Treasury).`
    }
  }

  // 2. Complete list of all 27 milestones if requested
  if (/\b(all|list|table|sabhi|puri|27)\b.*\bmilestone/i.test(q) || /\bmilestone.*\b(all|list|table|sabhi|27)\b/i.test(q)) {
    const lines = MILESTONES_DATA.map(
      ([id, l, r, amt, dirs]) =>
        `• **M${id} (${l.toLocaleString()}L / ${r.toLocaleString()}R):** **$${amt.toLocaleString()} USDT** (${dirs} direct${dirs > 1 ? 's' : ''})`
    )
    return isHindi
      ? `### सभी 27 लाइफटाइम माइलस्टोन्स (कुल $123,098,800 USDT)\n${lines.join('\n')}\n• **सुरक्षा नियम:** डायरेक्ट शर्त पूरी न होने पर रिवॉर्ड कभी एक्सपायर नहीं होता और Treasury में भी नहीं जाता।`
      : `### All 27 Lifetime Milestones (Grand Total: $123,098,800 USDT)\n${lines.join('\n')}\n• **Safe-Wait Rule:** Rewards pause safely without expiring until your direct count meets the tier requirement.`
  }

  // 3. Specific Club Rank lookup (e.g., "mentor", "rank 5", "legend")
  const rankByName = CLUB_RANKS_DATA.find((r) => q.includes(r.name.toLowerCase()))
  const rankNumMatch = q.match(/\b(?:rank|club)\s*#?\s*([1-8])\b/i)
  const matchedRank = rankByName || (rankNumMatch ? CLUB_RANKS_DATA[parseInt(rankNumMatch[1], 10) - 1] : null)
  if (matchedRank) {
    return isHindi
      ? `### क्लब रैंक #${matchedRank.rank}: ${matchedRank.name}\n• **टीम आवश्यकता:** **${matchedRank.team} मेंबर्स**\n• **ग्रॉस वॉल्यूम:** $${matchedRank.gross.toLocaleString()} | **ऑटो-अपग्रेड:** ${matchedRank.upgrade}\n• **स्पॉन्सर बोनस:** $${matchedRank.sponsor.toLocaleString()} | **नेट लाभ (सीधे वॉलेट में):** **$${matchedRank.net.toLocaleString()} USDT**`
      : `### Club Rank #${matchedRank.rank}: ${matchedRank.name}\n• **Team Requirement:** **${matchedRank.team} members**\n• **Gross Value:** $${matchedRank.gross.toLocaleString()} | **Auto-Upgrade:** ${matchedRank.upgrade}\n• **Sponsor Bonus:** $${matchedRank.sponsor.toLocaleString()} | **Instant Net Profit:** **$${matchedRank.net.toLocaleString()} USDT**`
  }

  // 4. Specific Affiliate Level lookup (e.g., "level 5", "level 15")
  const lvlMatch = q.match(/\blevel\s*#?\s*(\d{1,2})\b/i)
  if (lvlMatch) {
    const lvl = parseInt(lvlMatch[1], 10)
    if (lvl >= 1 && lvl <= 20) {
      const amt = lvl <= 10 ? '$0.40' : '$0.30'
      return isHindi
        ? `### 20-लेवल एफिलिएट — लेवल #${lvl}\n• **पेआउट:** प्रति $50 रजिस्ट्रेशन पर **${amt} USDT** सीधे अपलाइन वॉलेट में जाता है।\n• **दर संरचना:** लेवल 1–10 पर **$0.40/लेवल** (कुल $4.00) और लेवल 11–20 पर **$0.30/लेवल** (कुल $3.00)।\n• **ट्री नियम:** एफिलिएट पेआउट हमेशा **Sponsor** चेन के अनुसार चलता है; खाली या असक्रिय स्लॉट Treasury में जाते हैं।`
        : `### 20-Level Network Affiliate — Level #${lvl}\n• **Instant Payout:** **${amt} USDT** per $50 registration directly to the eligible sponsor-chain upline.\n• **Tier Structure:** Levels 1–10 pay **$0.40/level** ($4.00 total); Levels 11–20 pay **$0.30/level** ($3.00 total).\n• **Upline Rule:** Follows the **Sponsor** chain (not binary parent); empty/inactive slots route to Treasury.`
    }
  }

  // 5. Dynamic referral/pair/cycle calculation queries
  const numMatch = q.match(/(\d+)\s*(direct|directs|referral|referrals|pair|pairs|member|members|entry|entries|cycle|cycles)/i)
  if (numMatch) {
    const count = Math.min(100000, Math.max(1, parseInt(numMatch[1], 10)))
    const unit = numMatch[2].toLowerCase()
    if (unit.startsWith('direct') || unit.startsWith('referral') || unit.startsWith('member')) {
      const directEarn = (count * 10).toFixed(2)
      const lvl1Earn = (count * 0.4).toFixed(2)
      const balancedPairs = Math.floor(count / 2)
      const pairEarn = (Math.min(balancedPairs, 50) * 2).toFixed(2)
      const bonusNoteEn =
        count >= 30
          ? 'Unlocks **Champion Club Monthly Royalty (6% pool)** permanently and satisfies direct counts through **Milestone 27**.'
          : count >= 3
            ? '3+ directs in the same week unlocks that Sunday\'s **Weekly Performance Pool (6%)** equal share!'
            : 'Balanced Left + Right directs unlock **1:1 Binary Matching ($2/pair)**.'
      const bonusNoteHi =
        count >= 30
          ? 'स्थायी **Champion Club मासिक रॉयल्टी (6% पूल)** अनलॉक होती है और सभी **27 माइलस्टोन** की डायरेक्ट शर्तें पूरी होती हैं।'
          : count >= 3
            ? 'एक ही सप्ताह में 3+ डायरेक्ट करने पर रविवार के **Weekly Performance Pool (6%)** में हिस्सा मिलता है!'
            : '1 Left + 1 Right डायरेक्ट पूरा होते ही **1:1 बाइनरी मैचिंग ($2/पेयर)** शुरू हो जाती है।'

      return isHindi
        ? `### ${count} डायरेक्ट रेफरल कमाई गणना ($50 पैकेज)\n• **डायरेक्ट कमीशन (20% = $10/सदस्य):** **$${directEarn} USDT** तुरंत वॉलेट में।\n• **लेवल 1 एफिलिएट ($0.40/सदस्य):** **$${lvl1Earn} USDT** अतिरिक्त।\n• **अनुमानित बाइनरी मैचिंग:** संतुलित Left/Right पर ~${balancedPairs} पेयर से **$${pairEarn} USDT**।\n• **पूल बोनस:** ${bonusNoteHi}`
        : `### ${count} Direct Referral Earning Estimate ($50 Package)\n• **Direct Commission (20% = $10/direct):** **$${directEarn} USDT** paid instantly.\n• **Level 1 Affiliate ($0.40/direct):** **$${lvl1Earn} USDT** additional.\n• **Estimated Binary Matching:** Balanced placement (~${balancedPairs} pairs) adds **$${pairEarn} USDT**.\n• **Pool Status:** ${bonusNoteEn}`
    }
    if (unit.startsWith('pair')) {
      const cappedPairs = Math.min(count, 50)
      const overflow = Math.max(0, count - 50)
      const earn = (cappedPairs * 2).toFixed(2)
      return isHindi
        ? `### ${count} बाइनरी पेयर गणना\n• **दर:** प्रति 1:1 पेयर **$2.00 USDT** (दैनिक सीमा: **50 पेयर = $100/दिन**)।\n• **आज का पेआउट:** ${cappedPairs} पेयर पर **$${earn} USDT** सीधे वॉलेट में।\n• **अतिरिक्त पेयर:** ${overflow > 0 ? `बचे हुए ${overflow} पेयर फ्लश नहीं होते — अगले दिन की मैचिंग के लिए कैरी फॉरवर्ड में सुरक्षित रहते हैं।` : '00:00 UTC पर दैनिक लिमिट रीसेट होती है।'}`
        : `### ${count} Binary Pairs Calculation\n• **Payout Rate:** **$2.00 USDT** per 1:1 matched pair (Daily Cap: **50 pairs = $100/day**).\n• **Today's Instant Payout:** ${cappedPairs} pairs = **$${earn} USDT** directly to your BSC wallet.\n• **Carry-Forward:** ${overflow > 0 ? `The remaining ${overflow} excess pairs never flush — they remain stored on-chain for subsequent days.` : 'Daily cap counter resets at 00:00 UTC.'}`
    }
    if (unit.startsWith('cycle') || unit.startsWith('entry')) {
      const earn = (count * 25).toFixed(2)
      return isHindi
        ? `### $25 सिंगल लेग ग्लोबल क्लब (${count} साइकिल)\n• **प्रत्येक साइकिल लाभ:** **$25.00 USDT** तुरंत वॉलेट में + क्यू के अंत में **1 ऑटो री-एंट्री**।\n• **कुल कमाई:** ${count} साइकिल से **$${earn} USDT** सीधे वॉलेट में।`
        : `### $25 Single Leg Global Club (${count} Cycles)\n• **Per Cycle:** **$25.00 USDT** instant profit + **1 automatic re-entry** at queue tail.\n• **Total Output:** ${count} cycles = **$${earn} USDT** directly to your wallet.`
    }
  }

  const sections = [
    {
      keys: [
        'how many income', 'how many incomes', 'income stream', 'income streams', 'types of income',
        'sources of income', 'ways to earn', 'all income', 'total income', 'incomes', 'income',
        'kitni income', 'kitne tarah', 'kitne tarike', 'kamai ke tarike', 'earning source', 'earning streams',
      ],
      en: `### ELZORA 8 Core Income Streams
ELZORA distributes rewards across **8 autonomous on-chain income streams** (7 funded from the **$50 Package** + **1 separate $25 Global Club**):
• **1. Direct Referral Commission (20% = $10.00):** Instant **$10.00 USDT** paid for every personal referral.
• **2. 20-Level Network Affiliate (14% = $7.00):** **$0.40/level** (L1–10) and **$0.30/level** (L11–20) across your sponsor upline.
• **3. 8 Club Rank Matrices (24% = $12.00):** Cascading auto-upgrades from Starter (#1) to Legend (#8), up to **$9,874,567** net profit.
• **4. 1:1 Binary Matching Pool (20% = $10.00):** **$2.00/pair**, capped at **50 pairs/day ($100/day)** with perpetual carry-forward.
• **5. Champion Royalty Pool (6% = $3.00):** Monthly 30-day global pool shared equally among qualifying Champions.
• **6. Weekly Performance Pool (6% = $3.00):** Shared every Sunday among members with **3+ directs** during that week.
• **7. 27 Lifetime Milestones (10% = $5.00):** Cumulative team rewards scaling from **$25 (M1)** up to **$21,000,000 (M27)**.
• **8. $25 Single Leg Global Club (Separate Pool):** Independent **1-to-2 re-entry queue** paying **$25.00 USDT** + 1 free re-entry every cycle.`,
      hi: `### ELZORA के 8 मुख्य इनकम स्ट्रीम्स ($50 पैकेज + ग्लोबल क्लब)
ELZORA स्मार्ट कॉन्ट्रैक्ट में कुल **8 स्वचालित इनकम स्ट्रीम्स** काम करती हैं (**7 $50 पैकेज से** + **1 अलग $25 ग्लोबल क्लब**):
• **1. डायरेक्ट रेफरल कमीशन (20% = $10.00):** हर व्यक्तिगत रेफरल पर तुरंत **$10.00 USDT**।
• **2. 20-लेवल एफिलिएट इनकम (14% = $7.00):** लेवल 1–10 पर **$0.40** और लेवल 11–20 पर **$0.30/लेवल**।
• **3. 8 क्लब रैंक मैट्रिक्स (24% = $12.00):** Starter (#1) से Legend (#8) तक ऑटो-अपग्रेड, कुल नेट लाभ **$9,874,567 USDT**।
• **4. 1:1 बाइनरी मैचिंग पूल (20% = $10.00):** प्रति पेयर **$2.00**, सीमा **50 पेयर/दिन ($100/दिन)** और पर्पेचुअल कैरी फॉरवर्ड।
• **5. चैंपियन रॉयल्टी पूल (6% = $3.00):** 30-दिवसीय मासिक ग्लोबल पूल क्वालिफाइंग लीडर्स के लिए।
• **6. साप्ताहिक परफॉर्मेंस पूल (6% = $3.00):** किसी एक सप्ताह में **3+ डायरेक्ट** करने वालों के लिए हर रविवार।
• **7. 27 लाइफटाइम माइलस्टोन (10% = $5.00):** टीम वॉल्यूम पर **$25 (M1)** से **$21,000,000 (M27)** तक इनाम।
• **8. $25 सिंगल लेग ग्लोबल क्लब (अलग पूल):** **1-इन-2 री-एंट्री क्यू** — हर साइकिल पर **$25.00 USDT** + 1 फ्री री-एंट्री।`,
    },
    {
      keys: [
        'what is elzora', 'about elzora', 'overview', 'protocol', 'a to z', 'full plan',
        'complete plan', 'business plan', 'explain plan', 'summary', 'elzora kya', 'kya hai',
        'puri jankari', 'poora plan', 'plan kya', 'details',
      ],
      en: `### ELZORA Complete A-to-Z Business Plan Overview
ELZORA is an **autonomous 100% non-custodial** Binary Matrix, 8-Rank Club & Global Club protocol deployed on **BNB Smart Chain (BSC)**.
• **Activation Cost:** One-time **$50 USDT (BEP-20)** + ~$0.10 BNB gas (zero monthly renewals).
• **$50 IN = $50 OUT Split:** Direct **20% ($10)**, 20-Level Affiliate **14% ($7)**, 8 Club Matrices **24% ($12)**, Binary Matching **20% ($10)**, Champion Pool **6% ($3)**, Weekly Pool **6% ($3)**, 27 Milestones **10% ($5)**.
• **Global Club ($25):** Separate **1-to-2 re-entry queue** ($25 instant profit + 1 free re-entry per cycle), auto-activated at Milestone 1 if not yet joined.
• **Instant Wallet Payouts:** Zero pending locks or manual withdrawal requests — every earned reward settles straight to your BSC wallet.`,
      hi: `### ELZORA सम्पूर्ण A-to-Z बिज़नेस प्लान परिचय
ELZORA **BNB स्मार्ट चेन (BSC)** पर आधारित **100% नॉन-कस्टोडियल** और ऑटोमैटिक बिज़नेस प्लान प्रोटोकॉल है।
• **एक्टिवेशन फीस:** केवल एक बार **$50 USDT (BEP-20)** + ~$0.10 BNB गैस (कोई मासिक रिन्यूअल फीस नहीं)।
• **100% ऑन-चेन वितरण ($50 IN = $50 OUT):** डायरेक्ट **20% ($10)**, 20-लेवल एफिलिएट **14% ($7)**, 8 क्लब मैट्रिक्स **24% ($12)**, बाइनरी मैचिंग **20% ($10)**, चैंपियन पूल **6% ($3)**, साप्ताहिक पूल **6% ($3)**, 27 माइलस्टोन **10% ($5)**।
• **ग्लोबल क्लब ($25):** अलग से **1-इन-2 ऑटो री-एंट्री क्यू** ($25 प्रॉफिट + 1 फ्री री-एंट्री हर साइकिल)।
• **सीधे वॉलेट में पेआउट:** कोई विथड्रॉल बटन या होल्ड नहीं — हर कमाई तुरंत आपके वॉलेट में जाती है।`,
    },
    {
      keys: [
        'how much money', 'money needed', 'needed to join', 'cost to join', 'join cost', 'entry fee',
        'joining fee', 'minimum investment', 'how much to join', 'start cost', 'cost', 'price',
        'investment', 'renewal', 'monthly fee', 'hidden fee', 'owner cut', 'company fee',
        'kitna paisa', 'kitne dollar', 'lagana', 'fees',
      ],
      en: `### Entry Cost, Package Rules & 0% Platform Fee
ELZORA operates on a **single-package, zero-renewal, 100% payout** model on BNB Smart Chain.
• **Core Entry Cost:** One-time **$50.00 USDT (BEP-20)** + **~$0.10 BNB** for BSC network gas.
• **Optional Global Club ($25):** Join separately anytime for **$25.00 USDT**, or unlock it automatically free upon reaching **Milestone 1** (5L / 5R).
• **Zero Renewals or Owner Cut:** No monthly subscriptions, no withdrawal fees, and **$50 IN = $50 OUT** across smart-contract pools.`,
      hi: `### जॉइनिंग लागत, रिन्यूअल और कंपनी फीस नियम
ELZORA में एक बार का प्रवेश शुल्क है और सिस्टम **100% ($50 IN = $50 OUT)** वितरण करता है।
• **मुख्य जॉइनिंग शुल्क:** केवल एक बार **$50.00 USDT (BEP-20)** + नेटवर्क गैस के लिए **~$0.10 BNB**।
• **ग्लोबल क्लब ($25):** आप अलग से **$25.00 USDT** में जुड़ सकते हैं, अन्यथा **माइलस्टोन 1** (5L / 5R) पूरा होने पर यह फ्री ऑटो-एक्टिवेट हो जाता है।
• **कोई छुपा चार्ज नहीं:** कोई मासिक रिन्यूअल फीस नहीं और कोई मैनुअल विथड्रॉल शुल्क नहीं है।`,
    },
    {
      keys: ['distribution', 'package', '50', 'split', 'breakdown', 'allocation', 'पैकेज', 'बंटता', 'वितरण', 'hisab'],
      en: `### $50 USDT Package Distribution Flow
Every **$50.00 USDT** activation splits **100% ($50 IN = $50 OUT)** across 7 core earning pools:
• **Direct Referral (20%):** **$10.00** instant to Sponsor wallet.
• **20-Level Affiliate (14%):** **$7.00** ($0.40 for L1–10, $0.30 for L11–20).
• **8 Club Matrices (24%):** **$12.00** backing Starter–Legend auto-upgrades.
• **1:1 Binary Matching (20%):** **$10.00** ($2.00/pair, 50 pairs/day cap).
• **Champion Royalty Pool (6%):** **$3.00** (monthly 30-day global pool).
• **Weekly Performance Pool (6%):** **$3.00** (Sunday–Saturday pool).
• **27 Lifetime Milestones (10%):** **$5.00** ($25 to $21,000,000 rewards).`,
      hi: `### $50 USDT पैकेज वितरण फ्लो
हर **$50.00 USDT** जॉइनिंग का पूरा **100%** इन 7 मुख्य इनकम पूल्स में बंटता है:
• **डायरेक्ट रेफरल (20%):** **$10.00** तुरंत स्पॉन्सर वॉलेट में।
• **20-लेवल एफिलिएट (14%):** **$7.00** (L1–10 पर $0.40, L11–20 पर $0.30)।
• **8 क्लब मैट्रिक्स (24%):** **$12.00** Starter से Legend ऑटो-अपग्रेड हेतु।
• **1:1 बाइनरी मैचिंग (20%):** **$10.00** ($2/पेयर, 50 पेयर/दिन कैप)।
• **चैंपियन रॉयल्टी पूल (6%):** **$3.00** मासिक ग्लोबल पूल।
• **साप्ताहिक पूल (6%):** **$3.00** हर रविवार वितरित पूल।
• **27 लाइफटाइम माइलस्टोन (10%):** **$5.00** ($25 से $21,000,000 तक रिवॉर्ड)।`,
    },
    {
      keys: ['join', 'register', 'registration', 'wallet', 'metamask', 'trust', 'safepal', 'tokenpocket', 'bnb', 'gas', 'approve', 'step', 'जॉइन', 'रजिस्टर', 'जुड़', 'shuru'],
      en: `### Step-by-Step Joining Flow (/register)
Joining ELZORA takes one quick 2-step confirmation from your BSC Web3 wallet:
• **Wallet & Balance:** Open **MetaMask, Trust Wallet, SafePal, or TokenPocket** on BNB Smart Chain with **$50 USDT (BEP-20)** + **~$0.10 BNB** gas.
• **Referral & Leg Choice:** Open your sponsor link, verify your **Sponsor**, and choose **Left** or **Right** placement.
• **2-Step Activation:** **Step 1:** Approve **$50 USDT** spend limit; **Step 2:** Confirm registration to activate **Rank #1 Starter** immediately.
• **Plan Validation Rules:** Prevents duplicate wallets, self-sponsorship, occupied spots, and invalid circular links.`,
      hi: `### ELZORA जॉइन करने का स्टेप-बाय-स्टेप फ्लो (/register)
अपने Web3 वॉलेट से केवल 2 आसान स्टेप्स में ELZORA जॉइन किया जा सकता है:
• **वॉलेट व बैलेंस:** **MetaMask, Trust Wallet, SafePal, या TokenPocket** में BNB स्मार्ट चेन पर **$50 USDT (BEP-20)** और गैस के लिए ~**$0.10 BNB** रखें।
• **स्पॉन्सर व लेग चुनें:** सक्रिय **Sponsor** दर्ज करें और **Left** या **Right** लेग चुनें।
• **2-स्टेप एक्टिवेशन:** **स्टेप 1:** **$50 USDT** Approve करें; **स्टेप 2:** रजिस्ट्रेशन कन्फर्म करें — जुड़ते ही आप Rank #1 Starter बन जाते हैं।`,
    },
    {
      keys: ['sponsor', 'parent', 'spillover', 'lineage', 'change sponsor', 'change parent', 'change upline', 'immutable', 'badal', 'change'],
      en: `### Sponsor vs. Binary Placement, Auto-Spillover & Lineage Flow
Your **Sponsor** and **Binary Placement** serve distinct roles in your ELZORA plan structure:
• **Sponsor Role:** The member who invited you (receives $10 Direct, L1 Affiliate, Weekly/Champion direct count, and Rank 3–7 Sponsor Bonus).
• **Binary Placement Node:** The position directly above you in the Left/Right team tree.
• **30-Level Auto-Spillover:** If your sponsor's Left or Right spot is full, the system automatically places you in the nearest open spot down that leg (up to 30 depth levels).
• **Permanent Placement Rule:** Once confirmed, Sponsor, Placement, and Left/Right side cannot be modified later.`,
      hi: `### स्पॉन्सर बनाम प्लेसमेंट, ऑटो-स्पिलओवर और स्थायी नियम
रजिस्ट्रेशन कन्फर्म होते ही आपका **Sponsor** और **Placement** ट्री स्थायी रूप से सेट हो जाता है:
• **स्पॉन्सर की भूमिका:** जिसने आपको रेफर किया ($10 डायरेक्ट, L1 एफिलिएट व रैंक बोनस उसी को मिलता है)।
• **बाइनरी प्लेसमेंट:** Left/Right ट्री में आपके ठीक ऊपर की पोजीशन।
• **30-लेवल ऑटो-स्पिलओवर:** यदि स्पॉन्सर के पास चुना हुआ स्थान भरा हो, तो सिस्टम स्वतः **30 लेवल** तक नीचे खाली स्थान में प्लेस कर देता है।
• **स्थायी नियम:** जॉइनिंग के बाद Sponsor या Position को बदला नहीं जा सकता।`,
    },
    {
      keys: ['binary', 'matching', 'pair', 'cap', 'capping', 'carry', 'flush', 'power leg', 'weak leg', 'utc', 'reset', 'बाइनरी', 'मैचिंग', 'पेयर', 'कैप'],
      en: `### 1:1 Binary Matching Pool (20% = $10.00 Reserve)\n• **Pair Payout:** **$2.00 USDT** per 1:1 matched Left & Right member across infinite binary depth.\n• **Qualification Condition:** You MUST personally sponsor at least **1 active Left direct** AND **1 active Right direct** (spillover builds team volume, NOT direct qualification).\n• **Daily Cap & Reset:** Maximum **50 pairs/day ($100.00/day = $3,000/month)**; daily counter resets at **00:00 UTC**.\n• **Perpetual Carry-Forward:** Unmatched power-leg volume — and excess pairs above 50/day — **never flush or expire** at midnight.\n• **Treasury Diversion Warning:** Pairs matched *before* you have 1L + 1R directs divert to Treasury, so qualify 1L + 1R early!`,
      hi: `### 1:1 बाइनरी मैचिंग पूल (20% = $10.00)\n• **पेआउट दर:** हर 1:1 Left-Right पेयर पर **$2.00 USDT** तुरंत वॉलेट में।\n• **अनिवार्य योग्यता:** कम से कम **1 Left डायरेक्ट** और **1 Right डायरेक्ट** खुद स्पॉन्सर करना जरूरी है (स्पिलओवर से सिर्फ वॉल्यूम बढ़ता है, डायरेक्ट योग्यता नहीं)।\n• **दैनिक कैप व रीसेट:** प्रतिदिन अधिकतम **50 पेयर ($100/दिन)**, जो रोज **00:00 UTC** पर रीसेट होता है।\n• **कैरी फॉरवर्ड (No Flush):** पावर लेग का बचा हुआ वॉल्यूम कभी फ्लश नहीं होता — हमेशा अगले मैचिंग के लिए सुरक्षित रहता है।`,
    },
    {
      keys: ['single', 'leg', 'global', 'reentry', 're-entry', '25', 'queue', 'सिंगल', 'लेग', 'ग्लोबल'],
      en: `### $25 Single Leg / Global Club Flow
The Global Club operates as a global **First-In-First-Out 1-to-2 re-entry queue**:
• **Entry Cost:** **$25.00 USDT** (manual entry anytime, or **auto-activated free** upon Milestone 1).
• **1-to-2 Cycle Rule:** Every time **2 new global entries** join after your position, your entry completes its cycle.
• **Cycle Payout:** **$25.00 USDT** sent immediately to your BSC wallet + **1 automatic free re-entry** placed at the end of the queue.`,
      hi: `### $25 सिंगल लेग / ग्लोबल क्लब फ्लो
यह एक ग्लोबल **1-इन-2 ऑटो री-एंट्री क्यू** पर काम करता है:
• **प्रवेश शुल्क:** **$25.00 USDT** (डैशबोर्ड से मैनुअल एंट्री, या माइलस्टोन 1 पूरा करने पर फ्री ऑटो-एक्टिवेशन)।
• **1-इन-2 री-एंट्री नियम:** जब ग्लोबल क्यू में आपके बाद **2 नई एंट्री** जुड़ती हैं, तो आपका स्पॉट साइकिल पूरा करता है।
• **तुरंत लाभ:** **$25.00 USDT** सीधे आपके वॉलेट में + क्यू के अंत में **1 ऑटोमैटिक री-एंट्री**।`,
    },
    {
      keys: ['club', 'rank', 'ranks', 'matrix', 'starter', 'legend', 'leader', 'achiever', 'mentor', 'director', 'elite', 'crown', 'क्लब', 'रैंक'],
      en: `### 8 Cascading Club Rank Matrices (24% = $12.00)\n• **#1 Starter (2 team):** $10 Net Profit + $14 Auto-Upgrade\n• **#2 Leader (4 team):** $26 Net Profit + $30 Auto-Upgrade\n• **#3 Achiever (8 team):** $120 Net Profit + $96 Upgrade + $24 Sponsor\n• **#4 Mentor (16 team):** $911 Net Profit + $500 Upgrade + $125 Sponsor\n• **#5 Director (32 team):** $9,750 Net + $5,000 Upgrade + $1,250 Sponsor\n• **#6 Elite (64 team):** $301,250 Net + $15,000 Upgrade + $3,750 Sponsor\n• **#7 Crown (128 team):** $1,882,500 Net + $30,000 Upgrade + $7,500 Sponsor\n• **#8 Legend (256 team):** $7,680,000 Net Profit + Re-top Up Cycle`,
      hi: `### 8 कैस्केडिंग क्लब रैंक मैट्रिक्स (24% = $12.00)\n• **#1 Starter (2 टीम):** $10 नेट लाभ + $14 अपग्रेड\n• **#2 Leader (4 टीम):** $26 नेट लाभ + $30 अपग्रेड\n• **#3 Achiever (8 टीम):** $120 नेट + $96 अपग्रेड + $24 स्पॉन्सर बोनस\n• **#4 Mentor (16 टीम):** $911 नेट + $500 अपग्रेड + $125 स्पॉन्सर\n• **#5 Director (32 टीम):** $9,750 नेट + $5,000 अपग्रेड\n• **#6 Elite (64 टीम):** $301,250 नेट + $15,000 अपग्रेड\n• **#7 Crown (128 टीम):** $1,882,500 नेट + $30,000 अपग्रेड\n• **#8 Legend (256 टीम):** $7,680,000 नेट लाभ + री-टॉपअप।`,
    },
    {
      keys: ['milestone', 'milestones', '27', 'lifetime', '21000000', '21m', '123098800', 'safe wait', 'expire', 'माइलस्टोन'],
      en: `### 27 Lifetime Milestone Rewards (Total Pool Value: $123,098,800)\n• **Cumulative Scale:** M1 (**5L/5R = $25**) up to M27 (**7,000,000L/7,000,000R = $21,000,000 USDT**).\n• **Direct Referral Tiers:** M1–5 (**1 direct**), M6–10 (**2 directs**), M11–15 (**3 directs**), M16–20 (**4 directs**), M21–24 (**5 directs**), M25–27 (**6 directs**).\n• **Safe-Wait Rule:** If team volume hits a milestone before your directs qualify, it **waits safely without expiring or going to Treasury** until you meet the direct count.\n• **Milestone 1 Special Rule:** Auto-activates your **$25 Global Club** spot if you haven't joined yet; otherwise pays **$25 USDT** directly.\n• **Tip:** Ask **"Milestone 10"** or **"All 27 milestones"** for exact tier numbers.`,
      hi: `### 27 लाइफटाइम माइलस्टोन रिवॉर्ड्स (कुल इनाम: $123,098,800 USDT)\n• **रेंज:** M1 (**5L/5R = $25**) से लेकर M27 (**70 लाख L / 70 लाख R = $21,000,000 USDT**) तक।\n• **डायरेक्ट शर्तें:** M1–5 (**1**), M6–10 (**2**), M11–15 (**3**), M16–20 (**4**), M21–24 (**5**), M25–27 (**6 डायरेक्ट**)।\n• **कोई एक्सपायरी नहीं (Safe Wait):** टीम पूरी होने पर यदि डायरेक्ट कम हों, तो रिवॉर्ड कभी नष्ट नहीं होता और Treasury में भी नहीं जाता — डायरेक्ट पूरे होते ही तुरंत मिल जाता है।\n• **M1 नियम:** Global Club न जुड़ा होने पर M1 ($25) उसे ऑटो-एक्टिवेट करता है।`,
    },
    {
      keys: ['withdraw', 'withdrawal', 'payout', 'instant', 'claim', 'safeerc20', 'विथड्रॉल', 'पेआउट', 'निकाल', 'पैसे'],
      en: `### 100% Instant Wallet Payouts (Zero Withdrawal Button)\n• **No Pending Wallet Lock:** There is no manual withdrawal button or admin approval queue because ELZORA never locks user commissions.\n• **Automatic SafeERC20 Transfer:** Direct, 20-Level Affiliate, Club Net Profit, Binary Matching, Lifetime Milestones, and $25 Global Club payouts transfer **immediately to your connected BSC wallet** inside the triggering transaction.`,
      hi: `### 100% इंस्टेंट वॉलेट पेआउट (कोई विथड्रॉल बटन नहीं)\n• **तुरंत ट्रांसफर:** ELZORA में कोई मैनुअल विथड्रॉल रिक्वेस्ट या होल्ड नहीं है क्योंकि सिस्टम आपका कमीशन खुद नहीं रोकता।\n• **सीधे वॉलेट में पेआउट:** हर अर्जित आय **SafeERC20** के ज़रिए तुरंत ट्रांज़ैक्शन के समय ही आपके जुड़े हुए **BSC वॉलेट** में आ जाती है।`,
    },
    {
      keys: ['safe', 'safety', 'trust', 'legit', 'custody', 'secure', 'सुरक्षा', 'सुरक्षित', 'भरोसा'],
      en: `### Business Plan Protection & Non-Custodial Flow
ELZORA's business plan flow is designed around **instant member payouts and clear earning rules**:
• **Instant Wallet Payouts:** Earned Direct, Affiliate, Club, Binary, Milestone, and Global Club commissions settle **straight to your wallet** with no manual withdrawal hold.
• **No Volume Flush:** Excess Left/Right binary volume and pairs above the daily **50 pairs/day ($100/day)** cap carry forward perpetually without expiring.
• **Safe-Wait Milestones:** Unmet direct counts on Lifetime Milestones wait safely until completed without ever expiring.`,
      hi: `### बिज़नेस प्लान सुरक्षा और नॉन-कस्टोडियल नियम
ELZORA बिज़नेस प्लान **तुरंत वॉलेट पेआउट और पारदर्शी नियमों** पर काम करता है:
• **तुरंत पेआउट:** आपकी अर्जित कमाई होल्ड नहीं होती — तुरंत सीधे आपके वॉलेट में आती है (कोई विथड्रॉल रिक्वेस्ट नहीं)।
• **कोई फ्लशिंग नहीं:** बाइनरी का बचा हुआ वॉल्यूम और **50 पेयर/दिन** के ऊपर के पेयर कभी एक्सपायर नहीं होते।
• **सुरक्षित माइलस्टोन:** डायरेक्ट कम होने पर माइलस्टोन रिवॉर्ड रद्द नहीं होता — डायरेक्ट पूरा होने तक सुरक्षित रहता है।`,
    },
    {
      keys: ['champion', 'royalty', 'weekly', 'sunday', 'saturday', 'monthly', 'pool', '30 direct', 'चैंपियन', 'रॉयल्टी', 'साप्ताहिक'],
      en: `### Champion Royalty (6%) & Weekly Performance Pool (6%)
Together, **12% ($6.00)** of every $50 activation funds recurring global leadership reward pools:
• **Champion Royalty (6% = $3.00):** **30-day monthly pool** shared equally among permanent Champions (**30 direct referrals** standard).
• **Weekly Performance Pool (6% = $3.00):** Accumulates **Sunday 00:00 UTC – Saturday 23:59:59 UTC**; sponsoring **3 directs in that week** earns an equal Sunday payout.
• **Pool Qualification Rule:** Qualified members receive automatic wallet distribution; epochs with 0 qualifiers route to the Treasury reserve.`,
      hi: `### चैंपियन रॉयल्टी (6%) और साप्ताहिक परफॉर्मेंस पूल (6%)
हर $50 जॉइनिंग का कुल **12% ($6.00)** इन दो ग्लोबल लीडरशिप पूल्स में जाता है:
• **चैंपियन रॉयल्टी (6% = $3.00):** **30-दिन मासिक पूल**, **30 डायरेक्ट** करने वाले स्थायी लीडर्स में बराबर बंटता है।
• **साप्ताहिक परफॉर्मेंस पूल (6% = $3.00):** **रविवार 00:00 UTC से शनिवार 23:59 UTC** तक एकत्र होकर, उस सप्ताह **3 डायरेक्ट** करने वालों में हर रविवार बराबर बंटता है।`,
    },
    {
      keys: ['direct', 'level', 'affiliate', '20', 'upline', 'डायरेक्ट', 'लेवल', 'एफिलिएट'],
      en: `### Direct Income & 20-Level Network Affiliate (34% Total)\n• **Direct Referral (20% = $10.00):** Instant **$10.00 USDT** per direct registration (unlimited directs).\n• **Levels 1–10:** **$0.40 USDT** per level ($4.00 total).\n• **Levels 11–20:** **$0.30 USDT** per level ($3.00 total).\n• **Missed Upline Rule:** Any empty/inactive upline slot routes to the Treasury wallet.`,
      hi: `### डायरेक्ट इनकम और 20-लेवल एफिलिएट (कुल 34%)\n• **डायरेक्ट कमीशन (20% = $10.00):** हर डायरेक्ट जॉइनिंग पर तुरंत **$10 USDT**।\n• **लेवल 1–10:** प्रति लेवल **$0.40 USDT** (कुल **$4.00**)।\n• **लेवल 11–20:** प्रति लेवल **$0.30 USDT** (कुल **$3.00**)।`,
    },
    {
      keys: ['treasury', 'missed', 'divert', 'diverted', 'unqualified', 'kahan jata', 'treasurywallet'],
      en: `### Treasury Allocation & Diversion Rules\nFunds route to the **Treasury Reserve** in only **4 exact business plan flow cases**:\n• **1. Missing/Inactive Affiliate Level:** Empty sponsor upline slot above root or inactive upline among Levels 1–20 ($0.40 or $0.30).\n• **2. Unqualified Binary Matching:** Left/Right pairs matched *before* you have completed **1 Left direct + 1 Right direct**.\n• **3. Inactive Club Rank Sponsor (Ranks 3–7):** Sponsor Bonus ($24 to $7,500) when the member's sponsor is inactive.\n• **4. Zero Pool Qualifiers:** Monthly Champion or Weekly Performance epoch closing with 0 qualified members.\n• **Note:** Unmet direct counts on **Lifetime Milestones** do NOT go to Treasury — they wait safely until completed.`,
      hi: `### ट्रेजरी (Treasury) में फंड कब जाता है?\nबिज़नेस प्लान फ्लो के अनुसार केवल इन **4 स्थितियों** में फंड Treasury रिज़र्व में जाता है:\n• **1. खाली 20-लेवल अपलाइन:** रूट से ऊपर या असक्रिय अपलाइन स्लॉट का $0.40 / $0.30।\n• **2. अयोग्य बाइनरी पेयर:** **1 Left + 1 Right डायरेक्ट** पूरा किए बिना बनी बाइनरी मैचिंग का पैसा।\n• **3. असक्रिय क्लब स्पॉन्सर (रैंक 3–7):** जब स्पॉन्सर सक्रिय न हो तो रैंक स्पॉन्सर बोनस।\n• **4. पूल में 0 क्वालिफायर:** यदि किसी महीने या सप्ताह में कोई भी मेंबर पूल के लिए क्वालिफाई न करे।\n• **नोट:** **लाइफटाइम माइलस्टोन** कभी Treasury में नहीं जाते, वे डायरेक्ट पूरे होने तक सुरक्षित रहते हैं।`,
    },
    {
      keys: ['break even', 'breakeven', 'recover', 'recovery', 'example', 'scenario', 'how much earn', 'how much can i earn', 'how much profit', 'max earn', 'maximum', 'earning potential', 'kitna kama', 'kama sakte', 'paisa wapas', 'return'],
      en: `### Break-Even Math & Real Earning Scenarios
Here is the verified recovery and earning potential from a **$50.00 USDT** package:
• **2 Balanced Directs (1L + 1R):** $20 Direct + $0.80 L1 Affiliate + $2 Binary Pair + $10 Starter Rank Net = **$32.80 USDT** (65.6% instant recovery).
• **3 Directs in 1 Week:** **$43.20 USDT** instant + equal share in Sunday's **Weekly Performance Pool (6%)**.
• **5 Directs (100% Break-Even):** **$50.00** Direct Commission alone recovers 100% cost, plus Affiliates ($2), Binary Pairs ($4+), and Club progress.
• **5 Left / 5 Right Team:** Unlocks **Lifetime Milestone 1 ($25 / Free Global Club)** + **5 Binary Pairs ($10)** + Club/Affiliate income.
• **Maximum Earning Caps:** Binary **$100/day** (50 pairs), Club Matrix net **$9,874,567**, 27 Milestones **$123,098,800**, plus uncapped Directs & Global Club cycles.`,
      hi: `### ब्रेक-ईवन गणित और वास्तविक कमाई के उदाहरण
**$50.00 USDT** पैकेज पर आपकी वास्तविक रिकवरी और कमाई इस प्रकार होती है:
• **2 डायरेक्ट (1 Left + 1 Right):** $20 डायरेक्ट + $0.80 एफिलिएट + $2 बाइनरी पेयर + $10 Starter क्लब = **$32.80 USDT** तुरंत वापसी (65.6% रिकवरी)।
• **1 सप्ताह में 3 डायरेक्ट:** **$43.20 USDT** तुरंत + रविवार के **Weekly Performance Pool (6%)** में हिस्सा!
• **5 डायरेक्ट (100% ब्रेक-ईवन):** केवल डायरेक्ट से ही **$50.00** (पूरा निवेश वापस) + एफिलिएट, बाइनरी और क्लब लाभ अतिरिक्त।
• **अधिकतम क्षमता:** बाइनरी **$100/दिन**, 8 क्लब कुल **$9,874,567**, 27 माइलस्टोन कुल **$123,098,800**, तथा असीमित डायरेक्ट व ग्लोबल क्लब साइकिल।`,
    },
    {
      keys: ['dashboard', 'tree', 'team', 'history', 'lookup', 'referral link', 'page', 'pages', 'modules', 'features', 'voice ai', 'kore'],
      en: `### ELZORA DApp Modules & Navigation Directory
Every on-chain tool and live analytics module is accessible from the main navigation bar:
• **Public Info & Joining:** Overview (**/**), Business Plan (**/business-plan**), FAQ (**/faq**), 2-Step Registration (**/register**), Voice Explainer AI (**/ai/plan-explainer**).
• **Member Workspace:** Live Dashboard & Solvency (**/dashboard**), Binary Tree Visualizer (**/tree**), Directs & Team Stats (**/team**), Referral Link Generator (**/referral**), On-Chain User Inspector (**/user-lookup**).
• **Clubs & Ledger:** $25 Single Leg Global Club (**/packages**), 8 Club Ranks & Champion Club (**/ranks**), Earnings & Income History (**/earnings**, **/income-history**).`,
      hi: `### ELZORA प्लेटफॉर्म के मुख्य मॉड्यूल और पेजेज़
DApp में हर ऑन-चेन डेटा और टूल अलग सेक्शन में उपलब्ध है:
• **पब्लिक व जॉइनिंग:** Overview (**/**), Business Plan (**/business-plan**), FAQ (**/faq**), Register (**/register**), Voice Plan Explainer (**/ai/plan-explainer**)।
• **मेंबर टूल्स:** Dashboard (**/dashboard**), Binary Tree (**/tree**), Team (**/team**), Referral Links (**/referral**), User Lookup (**/user-lookup**)।
• **क्लब व इनकम लेजर:** Single Leg Global Club (**/packages**), 8 Club Ranks & Champion (**/ranks**), Earnings व History (**/earnings**, **/income-history**)।`,
    },
  ]

  let bestSection = null
  let bestScore = 0
  for (const sec of sections) {
    let score = 0
    for (const k of sec.keys) {
      if (k.includes(' ') ? q.includes(k) : new RegExp(`(?:^|\\s)${k}(?:$|\\s)`, 'i').test(q)) {
        score += k.includes(' ') ? 5 : 2.5
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestSection = sec
    }
  }

  if (bestSection && bestScore > 0) {
    return isHindi ? bestSection.hi : bestSection.en
  }

  // Fallback to exact clean formatted section from the active A-to-Z document
  const excerpts = searchDocumentChunks(question, docText, 1, isHindi)
  if (excerpts.length > 0) {
    return excerpts.join('\n\n')
  }

  return isHindi
    ? `### ELZORA A-to-Z प्लान सहायता
मैं **ELZORA के सम्पूर्ण A-to-Z बिज़नेस प्लान** पर आधारित हर सवाल का सटीक और व्यवस्थित जवाब देता हूँ:
• **8 इनकम स्ट्रीम्स व $50 पैकेज वितरण:** डायरेक्ट (20%), 20-लेवल (14%), 8 क्लब (24%), बाइनरी (20%), पूल (12%), 27 माइलस्टोन (10%), और $25 ग्लोबल क्लब
• **जॉइनिंग व ट्री नियम:** 2-स्टेप रजिस्ट्रेशन, 30-लेवल Auto-Spillover, और Sponsor बनाम Parent
• **सुरक्षा व गणित:** ब्रेक-ईवन गणना, 4 Treasury नियम, और एडमिन सीमाएं`
    : `### ELZORA A-to-Z Plan Assistant
I answer strictly from the official **ELZORA A-to-Z Business Plan & Smart Contract Specification**:
• **8 Income Streams & $50 Split:** Direct (20%), 20-Level Affiliate (14%), 8 Club Ranks (24%), Binary (20%), Champion/Weekly Pools (12%), 27 Milestones (10%), & $25 Global Club
• **Joining & Lineage:** 2-step registration, 30-level Auto-Spillover, and Sponsor vs. Binary Parent
• **Math & Security:** Break-even scenarios, 4 Treasury diversion rules, and immutable contract protections`
}

async function tryBackendChatApi(apiBase, question, history) {
  if (!apiBase) return null
  const base = apiBase.replace(/\/+$/, '')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)
  try {
    const healthRes = await fetch(`${base}/api/health`, { signal: controller.signal })
    clearTimeout(timer)
    if (!healthRes.ok) return null
    const health = await healthRes.json()
    if (!health?.ok) return null

    const chatRes = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, history }),
    })
    if (!chatRes.ok) return null
    const data = await chatRes.json()
    return data?.answer || data?.reply || null
  } catch {
    clearTimeout(timer)
    return null
  }
}

async function callGeminiText({ apiKey, model, systemInstruction, userPrompt, temperature = 0.1, maxOutputTokens = 1000 }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens,
      },
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Gemini API error (${res.status}): ${errText.slice(0, 180)}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n').trim()
  if (!text) {
    throw new Error('Empty response from Gemini API')
  }
  return text
}

/**
 * Sentinel Guard AI 3-Tier Query Pipeline
 */
export async function askSentinelGuard(question, history = []) {
  const trimmed = String(question || '').trim()
  if (!trimmed) {
    throw new Error('Please enter a non-empty question.')
  }

  const isHindi = detectHindiPreference(trimmed, 'en')
  if (isRestrictedTechnicalOrUnsafeQuery(trimmed)) {
    return { answer: buildRestrictedScopeReply(isHindi), tier: 'policy' }
  }

  const safeDocText = stripSensitiveTechnicalContext(getActivePlanDocument())
  const { apiKey, model, apiBase } = getGeminiConfig()

  // Tier 1: Optional microservice/backend API
  const tier1 = await tryBackendChatApi(apiBase, trimmed, history)
  if (tier1) {
    return { answer: sanitizeBusinessPlanReply(tier1, isHindi), tier: 'api' }
  }

  // Tier 2: Google Gemini API strict business-plan-only mode
  if (apiKey) {
    try {
      const recentHistory = history
        .slice(-6)
        .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`)
        .join('\n')

      const systemInstruction = `You are ELZORA's Official Business Plan Assistant (Sentinel Guard AI). STRICT SCOPE RULE: Only explain the ELZORA business plan, income streams, package math, ranks, binary rules, milestones, and user flow in the user's language (English or Hindi/Hinglish -> answer in crisp Devanagari Hindi). NEVER reveal contract addresses (0x...), Solidity/code/function internals, RPC/chain IDs, admin privileges, or security/exploit details. If asked anything technical or outside business plan flow, politely refuse and guide the user back to business plan topics.
MANDATORY PROFESSIONAL FORMAT FOR EVERY REPLY:
1. Line 1: Clean heading "### Clear Title" (never include leading section numbers like "5.").
2. Line 2: One concise 1-sentence executive summary directly answering the question.
3. Remaining lines: Clean bullet list using "• **Bold Label:** concise detail" (avoid walls of text, avoid raw markdown pipe tables, and never output "Document Reference:").`

      const userPrompt = `BUSINESS PLAN DOCUMENTATION:\n${safeDocText.slice(0, 30000)}\n\n${recentHistory ? `CONVERSATION HISTORY:\n${recentHistory}\n\n` : ''}USER QUESTION:\n${trimmed}`

      const answer = await callGeminiText({
        apiKey,
        model,
        systemInstruction,
        userPrompt,
        temperature: 0.1,
        maxOutputTokens: 1100,
      })
      return { answer: sanitizeBusinessPlanReply(answer, isHindi), tier: 'gemini' }
    } catch {
      // Automatic fallback to Tier 3 on timeout/error
    }
  }

  // Tier 3: Zero-downtime local business-plan extraction engine
  const fallbackAnswer = buildDeterministicElzoraAnswer(trimmed, safeDocText, 'en')
  return { answer: sanitizeBusinessPlanReply(fallbackAnswer, isHindi), tier: 'local' }
}

/**
 * Plan Explainer Interactive Q&A Pipeline (supports Hindi & English)
 */
export async function askPlanExplainer({ message, language = 'en' }) {
  const trimmed = String(message || '').trim()
  if (!trimmed) {
    throw new Error('Question cannot be empty.')
  }

  const isHindi = detectHindiPreference(trimmed, language)
  if (isRestrictedTechnicalOrUnsafeQuery(trimmed)) {
    return { answer: buildRestrictedScopeReply(isHindi), tier: 'policy' }
  }

  const safeDocText = stripSensitiveTechnicalContext(getActivePlanDocument())
  const { apiKey, model } = getGeminiConfig()
  const langLabel = language === 'hi' ? 'Hindi (Devanagari script, clear conversational tone)' : 'English'

  if (apiKey) {
    try {
      const systemInstruction = `You are ELZORA's Plan Explainer AI (Kore voice persona). Answer strictly about the ELZORA business plan and user flow in ${langLabel}. NEVER reveal smart contract addresses (0x...), Solidity/code internals, admin privileges, or unsafe technical details. Format cleanly with a short "### Title" heading, a 1-sentence summary, and concise "• **Label:** value" bullets.`
      const userPrompt = `BUSINESS PLAN DOCUMENT:\n${safeDocText.slice(0, 28000)}\n\nUSER QUESTION:\n${trimmed}`
      const answer = await callGeminiText({
        apiKey,
        model,
        systemInstruction,
        userPrompt,
        temperature: 0.25,
        maxOutputTokens: 800,
      })
      return { answer: sanitizeBusinessPlanReply(answer, isHindi), tier: 'gemini' }
    } catch {
      // Fall through to deterministic fallback
    }
  }

  const answer = buildDeterministicElzoraAnswer(trimmed, safeDocText, language)
  return { answer: sanitizeBusinessPlanReply(answer, isHindi), tier: 'local' }
}

/**
 * Lightweight client-side PDF text extractor fallback (when Gemini API key is not configured)
 */
function extractReadableTextFromPdfBytes(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer)
  const decoder = new TextDecoder('latin1')
  const raw = decoder.decode(bytes)

  const textPieces = []
  // Match literal PDF text strings inside Tj / TJ blocks
  const stringRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*(?:Tj|'|")|\[([^\]]+)\]\s*TJ/g
  let match
  while ((match = stringRegex.exec(raw)) !== null) {
    if (match[1]) {
      textPieces.push(
        match[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, ' ')
          .replace(/\\t/g, ' ')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\')
      )
    } else if (match[2]) {
      const inner = match[2].match(/\(([^()\\]*(?:\\.[^()\\]*)*)\)/g) || []
      const joined = inner
        .map((s) =>
          s
            .slice(1, -1)
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\')
        )
        .join('')
      if (joined) textPieces.push(joined)
    }
  }

  const combined = textPieces
    .join(' ')
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return combined
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...slice)
  }
  return btoa(binary)
}

/**
 * Extract plan document text from uploaded .txt or .pdf file (max 25MB)
 */
export async function extractPlanDocumentFromFile(file, overrideApiKey = '') {
  if (!file) throw new Error('No file selected.')
  const maxBytes = 25 * 1024 * 1024
  if (file.size > maxBytes) {
    throw new Error('File exceeds the 25MB maximum limit.')
  }

  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (ext !== 'txt' && ext !== 'pdf') {
    throw new Error('Only .pdf or .txt files are supported.')
  }

  if (ext === 'txt') {
    const text = (await file.text()).trim()
    if (!text) throw new Error('The uploaded .txt file is empty.')
    return { text, method: 'txt-direct' }
  }

  // .pdf handling
  const buffer = await file.arrayBuffer()
  const { apiKey: configKey, model } = getGeminiConfig()
  const effectiveKey = String(overrideApiKey || '').trim() || configKey

  if (effectiveKey) {
    const base64Pdf = arrayBufferToBase64(buffer)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(effectiveKey)}`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: base64Pdf,
                },
              },
              {
                text: 'Extract the complete business plan document text from this PDF verbatim in clean structured Markdown (# headings, ## subheadings, - bullet points). Preserve every tier, dollar figure, percentage, level, qualification rule, and limit accurately without omitting any detail.',
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4500,
        },
      }),
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      throw new Error(`Gemini PDF extraction failed (${res.status}): ${errBody.slice(0, 160)}`)
    }

    const data = await res.json()
    const extracted = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n').trim()
    if (!extracted) {
      throw new Error('Gemini returned empty text for this PDF.')
    }
    return { text: extracted, method: 'gemini-pdf' }
  }

  // Client-side PDF text extraction fallback when no Gemini key is provided
  const localExtracted = extractReadableTextFromPdfBytes(buffer)
  if (localExtracted && localExtracted.length >= 60) {
    return { text: localExtracted, method: 'local-pdf' }
  }

  throw new Error(
    'This PDF appears compressed or scanned. Please enter a Gemini API Key above for full AI PDF extraction, or upload a .txt file.'
  )
}
