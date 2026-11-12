import React, { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { PublicNavbar } from '../components/PublicNavbar'
import BackgroundCanvas from '../components/BackgroundCanvas'
import { useWalletAuth } from '../hooks/useWalletAuth'
import { PageTransitionShell } from '../components/MotionPrimitives'
import {
  HelpCircle,
  ChevronDown,
  Search,
  Sparkles,
  ShieldCheck,
  Zap,
  RefreshCw,
  GitCommit,
  Layers,
  Award,
  Wallet,
  ArrowRight,
} from 'lucide-react'

export function FaqPage() {
  const navigate = useNavigate()
  const { isConnected } = useWalletAuth()

  const [activeCategory, setActiveCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState(1) // Open first by default

  const faqList = [
    {
      id: 1,
      category: 'GENERAL',
      question: 'What is ELZORA and how does it operate?',
      answer:
        'ELZORA is an autonomous, decentralized MLM protocol deployed on BNB Smart Chain (BSC). It features an innovative dual-leg binary matrix, 8 cascading club matrices, a 20-level affiliate network, and an automated $25 Single Leg Global Club queue. All operations and distributions are governed 100% by smart contracts without human intervention or centralized custody.',
    },
    {
      id: 2,
      category: 'REGISTRATION',
      question: 'How do I join ELZORA and what is the joining cost?',
      answer:
        'To join ELZORA, you need a Web3 wallet (such as MetaMask, Trust Wallet, SafePal, or TokenPocket) configured on the BNB Smart Chain network with at least 50 USDT (BEP-20) and a small amount of BNB for gas fees (~$0.10). You simply connect your wallet, specify your sponsor wallet address and placement (Left or Right), approve the USDT, and complete registration.',
    },
    {
      id: 3,
      category: 'PAYOUTS',
      question: 'Why is there no withdrawal button in the ELZORA member panel?',
      answer:
        'In traditional platforms, members must request manual withdrawals which admins can delay or block. ELZORA is 100% non-custodial: every commission (Direct 20%, 20-Level Affiliate 14%, Club Matrix 24%, Binary Matching 20%, and Single Leg $25 cycles) is automatically and instantly transferred directly into your personal connected BSC wallet via SafeERC20. There is no central wallet holding your earned funds.',
    },
    {
      id: 4,
      category: 'BINARY',
      question: 'What are the qualification conditions for Binary Matching Income?',
      answer:
        'To qualify for 1:1 Binary Matching Income, an account must sponsor at least 1 active member on their Left direct leg and 1 active member on their Right direct leg. Once this condition is satisfied, the system matches 1 Left volume with 1 Right volume at the rate of $2.00 USDT per matched pair.',
    },
    {
      id: 5,
      category: 'BINARY',
      question: 'Does unmatched binary leg volume expire or flush out?',
      answer:
        'No! ELZORA implements a perpetual carry-forward system. Any unpaid volume on your strong power leg never flushes or resets at midnight. It remains stored on-chain until new matching volume enters your weaker leg.',
    },
    {
      id: 6,
      category: 'CLUBS',
      question: 'How do the 8 Cascading Club Matrices function?',
      answer:
        'Every registered member automatically enters Club 1 (Starter). When your personal team members advance, you cycle through the 8 Club ranks (Starter → Bronze → Silver → Gold → Platinum → Diamond → Crown Diamond → Legend). At each rank, you receive an instant net profit to your wallet while an automated portion funds your upgrade to the subsequent higher club with zero out-of-pocket re-investment.',
    },
    {
      id: 7,
      category: 'SINGLE_LEG',
      question: 'What is the Single Leg / Global Club ($25) and how does it cycle?',
      answer:
        'The Single Leg / Global Club is an autonomous, decentralized 1-to-2 cycling queue available for $25 USDT. It operates on a global single line: whenever 2 new entries enter the queue anywhere in the ecosystem behind your spot, your position completes its cycle. You instantly receive $25.00 USDT in your wallet and the remaining $25 automatically purchases a new re-entry position at the end of the line, creating a continuous perpetual earning loop.',
    },
    {
      id: 8,
      category: 'ROYALTY',
      question: 'What is the Champion Club Royalty and Weekly Performance Pool?',
      answer:
        'The Champion Club accumulates 6% of the entire protocol turnover every month and distributes it as a lifetime royalty dividend in batches among qualified leaders who have sponsored direct active referrals (testing: 3 directs, live standard: 30 directs). The Weekly Performance Pool takes 6% weekly protocol turnover and distributes it every Sunday to active top sponsors of the week.',
    },
    {
      id: 9,
      category: 'GENERAL',
      question: 'What are the 27 Lifetime Milestone Rewards?',
      answer:
        'ELZORA features 27 progressive lifetime milestone rewards ranging from $25 USDT (at 5 Left / 5 Right team volume) up to $21,000,000 USDT. These milestones are cumulative, have no expiration deadlines, and are paid out immediately to your wallet once achieved.',
    },
    {
      id: 10,
      category: 'SECURITY',
      question: 'Are my funds secure? Can admins freeze my wallet or modify calculations?',
      answer:
        'ELZORA contracts are immutable once deployed on the BNB Smart Chain. The smart contracts contain no backdoors, no emergency draining mechanisms for earned user rewards, and no ability for administrators to modify recorded downlines or reduce compensation percentages. All funds move directly peer-to-contract and contract-to-peer.',
    },
    {
      id: 11,
      category: 'REGISTRATION',
      question: 'Can I change my sponsor or binary parent after registration?',
      answer:
        'No. Once a wallet address is registered under a sponsor and parent in the smart contract on the blockchain, the tree lineage is permanent and immutable. Please verify your sponsor address before confirming your registration transaction.',
    },
    {
      id: 12,
      category: 'SINGLE_LEG',
      question: 'Can I purchase multiple entries in the $25 Single Leg Global Club?',
      answer:
        'Yes! Active members can participate and hold multiple queue positions in the Global Club ($25). Each position cycles independently on the 1-to-2 automated queue, generating $25 USDT instant cycle profit and 1 automatic re-entry position per completed cycle.',
    },
  ]

  const categories = [
    { id: 'ALL', label: 'All FAQs' },
    { id: 'GENERAL', label: 'General & Overview' },
    { id: 'REGISTRATION', label: 'Registration & $50 Package' },
    { id: 'PAYOUTS', label: '100% Instant Payouts' },
    { id: 'BINARY', label: '1:1 Binary System' },
    { id: 'CLUBS', label: '8 Club Matrices' },
    { id: 'SINGLE_LEG', label: 'Single Leg / Global ($25)' },
    { id: 'ROYALTY', label: 'Royalty & Milestones' },
    { id: 'SECURITY', label: 'Security & Contracts' },
  ]

  const filteredFaqs = useMemo(() => {
    return faqList.filter((item) => {
      const matchCat = activeCategory === 'ALL' || item.category === activeCategory
      const matchQuery =
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCat && matchQuery
    })
  }, [activeCategory, searchQuery])

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <PageTransitionShell
      style={{
        minHeight: '100vh',
        background: '#050611',
        color: '#f8fafc',
        fontFamily: "'Space Grotesk', sans-serif",
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      <BackgroundCanvas />
      <PublicNavbar />

      <main
        style={{
          maxWidth: 1040,
          margin: '0 auto',
          width: '100%',
          padding: '36px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* HEADER HERO */}
        <div
          className="glass-card glass-card-glow"
          style={{
            padding: '32px',
            borderRadius: 24,
            border: '1px solid rgba(139, 92, 246, 0.35)',
            background: 'linear-gradient(135deg, rgba(16, 21, 54, 0.95) 0%, rgba(10, 14, 38, 0.98) 100%)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 14px',
              borderRadius: 20,
              background: 'rgba(139, 92, 246, 0.18)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              color: '#c084fc',
              fontSize: '0.8rem',
              fontWeight: 800,
              marginBottom: 10,
            }}
          >
            <HelpCircle size={14} /> KNOWLEDGE BASE & FREQUENTLY ASKED QUESTIONS
          </div>
          <h1 className="elzora-hero-title" style={{ fontSize: 'clamp(1.85rem, 4vw, 2.4rem)', margin: '0 0 8px' }}>
            Frequently Asked Questions (FAQ)
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.94rem', maxWidth: 640, margin: '0 auto 20px' }}>
            Everything you need to know about ELZORA smart contracts, the 1:1 binary matrix, instant BSC payouts, and the $25 Single Leg Global Club.
          </p>

          {/* Search Box */}
          <div style={{ maxWidth: 520, margin: '0 auto', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by keyword (e.g. binary, single leg, withdrawal, $50)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(6, 8, 20, 0.8)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: 14,
                padding: '12px 42px 12px 16px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
            <Search
              size={18}
              style={{
                position: 'absolute',
                right: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#c084fc',
              }}
            />
          </div>
        </div>

        {/* CATEGORY TABS */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                background: activeCategory === cat.id ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.04)',
                color: activeCategory === cat.id ? '#fff' : '#94a3b8',
                border: activeCategory === cat.id ? 'none' : '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.2s',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ACCORDION LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredFaqs.length === 0 ? (
            <div className="glass-card" style={{ padding: 40, textAlign: 'center', borderRadius: 20, color: '#94a3b8' }}>
              No questions found matching "<b>{searchQuery}</b>". Try another search keyword.
            </div>
          ) : (
            filteredFaqs.map((item) => {
              const isOpen = expandedId === item.id
              return (
                <div
                  key={item.id}
                  className="elzora-glass"
                  style={{
                    border: isOpen ? '1px solid rgba(192, 132, 252, 0.55)' : '1px solid rgba(139, 92, 246, 0.22)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    transition: 'all 0.24s cubic-bezier(0.22, 1, 0.36, 1)',
                    boxShadow: isOpen ? '0 12px 30px rgba(139, 92, 246, 0.22)' : 'none',
                  }}
                >
                  <button
                    onClick={() => toggleExpand(item.id)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      background: 'transparent',
                      border: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 14,
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: isOpen ? '#c084fc' : '#f8fafc',
                    }}
                  >
                    <span style={{ fontSize: '0.96rem', fontWeight: 800 }}>
                      {item.question}
                    </span>
                    <ChevronDown
                      size={18}
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        color: isOpen ? '#c084fc' : '#94a3b8',
                        flexShrink: 0,
                      }}
                    />
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: '0 20px 18px',
                        color: '#cbd5e1',
                        fontSize: '0.88rem',
                        lineHeight: 1.6,
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        paddingTop: 12,
                      }}
                    >
                      {item.answer}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* BOTTOM HELP BANNER */}
        <div
          style={{
            padding: '24px 28px',
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.9) 0%, rgba(10, 14, 38, 0.95) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#fff' }}>
              Still Have Questions or Need Clarification?
            </h3>
            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Inspect the comprehensive Business Plan or connect directly to audit your on-chain dossier.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Link
              to="/business-plan"
              className="btn btn-outline btn-sm"
              style={{
                borderColor: '#c084fc',
                color: '#c084fc',
                padding: '9px 16px',
                borderRadius: 10,
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              View Business Plan
            </Link>
            <button
              onClick={() => navigate(isConnected ? '/dashboard' : '/login')}
              className="btn btn-primary btn-sm"
              style={{ padding: '9px 16px', borderRadius: 10, fontWeight: 800 }}
            >
              {isConnected ? 'Dashboard →' : 'Connect Wallet →'}
            </button>
          </div>
        </div>

      </main>
    </PageTransitionShell>
  )
}

export default FaqPage

