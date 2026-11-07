import React, { useState, useMemo } from 'react'
import { AdminLayout } from '../../components/AdminLayout'
import { useAdminMembers } from '../../hooks/useAdminMembers'
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ExternalLink,
  X,
  Copy,
  Check,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  DollarSign,
  Award,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Layers,
  Activity,
} from 'lucide-react'

export function AdminMembersPage() {
  const { members, stats, loading, refreshing, error, refresh, fetchMemberDirectReferrals } = useAdminMembers()

  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('id-asc')
  const [selectedMember, setSelectedMember] = useState(null)
  const [copiedAddress, setCopiedAddress] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [memberDirects, setMemberDirects] = useState([])
  const [loadingDirects, setLoadingDirects] = useState(false)

  // Copy helper with feedback
  const handleCopy = (text, key) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedAddress(key)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  // Load details modal and fetch direct referrals
  const handleOpenDetails = async (m) => {
    setSelectedMember(m)
    setLoadingDirects(true)
    try {
      const directs = await fetchMemberDirectReferrals(m.wallet)
      setMemberDirects(directs)
    } catch (e) {
      setMemberDirects(m.directReferralsList || [])
    } finally {
      setLoadingDirects(false)
    }
  }

  // Filtered and Sorted Members List
  const filteredAndSortedMembers = useMemo(() => {
    return members
      .filter((m) => {
        // Tab Filter
        if (activeTab === 'active' && !m.active) return false
        if (activeTab === 'inactive' && m.active) return false
        if (activeTab === 'rank' && (!m.rank || m.rank <= 1)) return false

        // Search Filter
        if (!searchTerm.trim()) return true
        const term = searchTerm.toLowerCase().trim()
        const matchWallet = m.wallet.toLowerCase().includes(term)
        const matchSponsor = m.sponsor.toLowerCase().includes(term)
        const matchId = `#${m.id}`.includes(term) || `${m.id}` === term
        const matchPackage = m.packageName.toLowerCase().includes(term)
        return matchWallet || matchSponsor || matchId || matchPackage
      })
      .sort((a, b) => {
        if (sortBy === 'id-asc') return a.id - b.id
        if (sortBy === 'id-desc') return b.id - a.id
        if (sortBy === 'investment-desc') return b.investment - a.investment
        if (sortBy === 'investment-asc') return a.investment - b.investment
        if (sortBy === 'income-desc') return b.totalIncome - a.totalIncome
        if (sortBy === 'directs-desc') return b.directCount - a.directCount
        if (sortBy === 'reg-desc') return b.registrationTime - a.registrationTime
        if (sortBy === 'reg-asc') return a.registrationTime - b.registrationTime
        return 0
      })
  }, [members, activeTab, searchTerm, sortBy])

  // Pagination calculation
  const totalPages = Math.ceil(filteredAndSortedMembers.length / itemsPerPage) || 1
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAndSortedMembers.slice(start, start + itemsPerPage)
  }, [filteredAndSortedMembers, currentPage, itemsPerPage])

  // CSV Export helper
  const handleExportCSV = () => {
    if (members.length === 0) return
    const headers = ['ID', 'Wallet Address', 'Sponsor Address', 'Status', 'Package', 'Investment USD', 'Total Income USD', 'Remaining Cap USD', 'Directs', 'Team Volume USD', 'Rank', 'Registration Date']
    const rows = members.map((m) => [
      m.id,
      m.wallet,
      m.sponsor,
      m.status,
      m.packageName,
      m.investment,
      m.totalIncome,
      m.remainingCap,
      m.directCount,
      m.teamVolume,
      m.rank,
      m.regDate,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `aventrax_members_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Generate identicon gradient color from address
  const getAvatarGradient = (addr) => {
    const hash = addr.slice(2, 8)
    const r = parseInt(hash.slice(0, 2), 16) || 100
    const g = parseInt(hash.slice(2, 4), 16) || 150
    const b = parseInt(hash.slice(4, 6), 16) || 220
    return `linear-gradient(135deg, rgb(${r}, ${g}, ${b}), rgb(${(r + 60) % 255}, ${(g + 80) % 255}, ${(b + 100) % 255}))`
  }

  return (
    <AdminLayout pageTitle="Member Management">
      {/* HEADER BAR */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '1.75rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #fff 0%, #ffd700 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Users size={28} color="#ffd700" />
            Network Member Directory
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
            Live BSC smart contract registry with real-time participation metrics
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={handleExportCSV}
            disabled={members.length === 0}
            style={{
              padding: '10px 16px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: members.length === 0 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
            }}
            title="Download CSV report"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => refresh()}
            disabled={refreshing}
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,140,0,0.15))',
              border: '1px solid rgba(255,215,0,0.3)',
              color: '#ffd700',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: refreshing ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 15px rgba(255,215,0,0.1)',
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={16} className={refreshing ? 'spin-anim' : ''} />
            <span>{refreshing ? 'Syncing Contract...' : 'Sync On-Chain'}</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* CARD 1: TOTAL MEMBERS */}
        <div
          className="glass-card"
          style={{
            padding: 20,
            borderRadius: 18,
            border: '1px solid rgba(255,215,0,0.2)',
            background: 'linear-gradient(145deg, rgba(255,215,0,0.05) 0%, rgba(20,25,40,0.6) 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Registered
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(255,215,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffd700',
              }}
            >
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', marginTop: 8 }}>
            {loading ? '...' : stats.totalCount}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: '0.78rem', color: '#00f2fe' }}>
            <Sparkles size={13} />
            <span>On-Chain Verified Registry</span>
          </div>
        </div>

        {/* CARD 2: ACTIVE MEMBERS */}
        <div
          className="glass-card"
          style={{
            padding: 20,
            borderRadius: 18,
            border: '1px solid rgba(0,255,136,0.25)',
            background: 'linear-gradient(145deg, rgba(0,255,136,0.05) 0%, rgba(20,25,40,0.6) 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Active Stakers
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(0,255,136,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00ff88',
              }}
            >
              <UserCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#00ff88', marginTop: 8 }}>
            {loading ? '...' : stats.activeCount}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>
            <span style={{ color: '#00ff88', fontWeight: 700 }}>{stats.activeRate}%</span>
            <span>of total network active</span>
          </div>
        </div>

        {/* CARD 3: INACTIVE MEMBERS */}
        <div
          className="glass-card"
          style={{
            padding: 20,
            borderRadius: 18,
            border: '1px solid rgba(255,100,100,0.2)',
            background: 'linear-gradient(145deg, rgba(255,100,100,0.05) 0%, rgba(20,25,40,0.6) 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Inactive / Unfunded
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(255,100,100,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff6b6b',
              }}
            >
              <UserX size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ff6b6b', marginTop: 8 }}>
            {loading ? '...' : stats.inactiveCount}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: '0.78rem', color: 'var(--muted)' }}>
            <span>Awaiting package activation</span>
          </div>
        </div>

        {/* CARD 4: TOTAL CAPITAL INVESTED */}
        <div
          className="glass-card"
          style={{
            padding: 20,
            borderRadius: 18,
            border: '1px solid rgba(0,242,254,0.25)',
            background: 'linear-gradient(145deg, rgba(0,242,254,0.05) 0%, rgba(20,25,40,0.6) 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Network Staked
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(0,242,254,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00f2fe',
              }}
            >
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#00f2fe', marginTop: 8 }}>
            ${loading ? '...' : stats.totalInvestedUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: '0.78rem', color: 'var(--muted)' }}>
            <span>Combined user deposits</span>
          </div>
        </div>

        {/* CARD 5: TOTAL INCOME DISTRIBUTED */}
        <div
          className="glass-card"
          style={{
            padding: 20,
            borderRadius: 18,
            border: '1px solid rgba(168,85,247,0.25)',
            background: 'linear-gradient(145deg, rgba(168,85,247,0.05) 0%, rgba(20,25,40,0.6) 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Income Paid Out
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(168,85,247,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a855f7',
              }}
            >
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#c084fc', marginTop: 8 }}>
            ${loading ? '...' : stats.totalIncomePaidUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: '0.78rem', color: 'var(--muted)' }}>
            <span>ROI + Direct + Level + Rank</span>
          </div>
        </div>
      </div>

      {/* TOOLBAR CONTROLS & FILTER TABS */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          borderRadius: 20,
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        {/* TABS */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Members', count: stats.totalCount },
            { id: 'active', label: 'Active Stakers', count: stats.activeCount },
            { id: 'inactive', label: 'Inactive', count: stats.inactiveCount },
            { id: 'rank', label: 'Rank Holders' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setCurrentPage(1)
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: '0.84rem',
                border: 'none',
                cursor: 'pointer',
                background:
                  activeTab === tab.id
                    ? 'linear-gradient(135deg, #ffd700, #ff8c00)'
                    : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? '#0a101e' : '#fff',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  style={{
                    fontSize: '0.74rem',
                    padding: '2px 6px',
                    borderRadius: 10,
                    background: activeTab === tab.id ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)',
                    fontWeight: 800,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* SEARCH AND SORT CONTROLS */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* SEARCH */}
          <div style={{ position: 'relative', width: 280 }}>
            <Search
              size={16}
              color="var(--muted)"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search ID, Wallet, Sponsor..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff',
                outline: 'none',
                fontSize: '0.86rem',
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* SORT DROPDOWN */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff',
              outline: 'none',
              fontSize: '0.84rem',
              cursor: 'pointer',
            }}
          >
            <option value="id-asc" style={{ background: '#0e1526' }}>ID (Ascending: 1 → N)</option>
            <option value="id-desc" style={{ background: '#0e1526' }}>ID (Descending: N → 1)</option>
            <option value="investment-desc" style={{ background: '#0e1526' }}>Investment (High to Low)</option>
            <option value="investment-asc" style={{ background: '#0e1526' }}>Investment (Low to High)</option>
            <option value="income-desc" style={{ background: '#0e1526' }}>Total Earnings (High to Low)</option>
            <option value="directs-desc" style={{ background: '#0e1526' }}>Direct Referrals (High to Low)</option>
            <option value="reg-desc" style={{ background: '#0e1526' }}>Registration (Newest First)</option>
            <option value="reg-asc" style={{ background: '#0e1526' }}>Registration (Oldest First)</option>
          </select>
        </div>
      </div>

      {/* MEMBER TABLE */}
      <div className="glass-card" style={{ padding: 20, borderRadius: 20, marginBottom: 20 }}>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>
            <RefreshCw size={32} className="spin-anim" style={{ margin: '0 auto 16px', display: 'block', color: '#ffd700' }} />
            <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>Reading Smart Contract State...</div>
            <div style={{ fontSize: '0.85rem', marginTop: 4 }}>Loading registered members from BSC Testnet</div>
          </div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#ff6b6b' }}>
            <XCircle size={36} style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Failed to load on-chain members</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 4 }}>{error}</div>
            <button
              onClick={() => refresh()}
              style={{
                marginTop: 16,
                padding: '8px 18px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        ) : filteredAndSortedMembers.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>
            <Users size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
            <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>No Members Found</div>
            <div style={{ fontSize: '0.85rem', marginTop: 4 }}>
              {searchTerm ? `No records matching "${searchTerm}"` : 'No members found in this category'}
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  marginTop: 14,
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: 'rgba(255,215,0,0.15)',
                  color: '#ffd700',
                  border: '1px solid rgba(255,215,0,0.3)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                }}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', color: 'var(--muted)' }}>
                  <th style={{ padding: '12px 14px', width: 60 }}>ID</th>
                  <th style={{ padding: '12px 14px' }}>Participant</th>
                  <th style={{ padding: '12px 14px' }}>Sponsor</th>
                  <th style={{ padding: '12px 14px' }}>Package & Rank</th>
                  <th style={{ padding: '12px 14px' }}>Registration</th>
                  <th style={{ padding: '12px 14px' }}>Directs</th>
                  <th style={{ padding: '12px 14px' }}>Earned / Withdrawable</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                  <th style={{ padding: '12px 14px' }}>Registered</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.map((m) => {
                  const isCopied = copiedAddress === m.wallet
                  const isSponsorCopied = copiedAddress === m.sponsor

                  return (
                    <tr
                      key={m.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        transition: 'background 0.2s ease',
                      }}
                      className="table-row-hover"
                    >
                      {/* ID */}
                      <td style={{ padding: '14px', fontWeight: 800 }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: 8,
                            fontSize: '0.78rem',
                            background: m.isRoot ? 'linear-gradient(135deg, #ffd700, #ff8c00)' : 'rgba(255,255,255,0.08)',
                            color: m.isRoot ? '#0a101e' : '#fff',
                            fontWeight: 800,
                            display: 'inline-block',
                          }}
                        >
                          #{m.id}
                        </span>
                      </td>

                      {/* PARTICIPANT WALLET */}
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: getAvatarGradient(m.wallet),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              color: '#fff',
                              flexShrink: 0,
                            }}
                          >
                            {m.wallet.slice(2, 4).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#fff' }}>
                                {m.wallet.slice(0, 6)}...{m.wallet.slice(-4)}
                              </span>
                              <button
                                onClick={() => handleCopy(m.wallet, m.wallet)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: isCopied ? '#00ff88' : 'var(--muted)',
                                  cursor: 'pointer',
                                  padding: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                                title="Copy Wallet Address"
                              >
                                {isCopied ? <Check size={13} /> : <Copy size={13} />}
                              </button>
                              <a
                                href={`https://testnet.bscscan.com/address/${m.wallet}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center' }}
                                title="View on BSCScan"
                              >
                                <ExternalLink size={13} />
                              </a>
                            </div>
                            {m.isRoot && (
                              <span style={{ fontSize: '0.72rem', color: '#ffd700', fontWeight: 700 }}>
                                👑 Root Node
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SPONSOR */}
                      <td style={{ padding: '14px' }}>
                        {m.isRoot || !m.sponsor || m.sponsor === '0x0000000000000000000000000000000000000000' ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                            Genesis Node (No Sponsor)
                          </span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--cyan)' }}>
                              {m.sponsor.slice(0, 6)}...{m.sponsor.slice(-4)}
                            </span>
                            <button
                              onClick={() => handleCopy(m.sponsor, m.sponsor)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isSponsorCopied ? '#00ff88' : 'var(--muted)',
                                cursor: 'pointer',
                                padding: 2,
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title="Copy Sponsor Address"
                            >
                              {isSponsorCopied ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          </div>
                        )}
                      </td>

                      {/* PACKAGE */}
                      <td style={{ padding: '14px' }}>
                        <div>
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: 12,
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              background:
                                m.packageTier === 'Tier 3'
                                  ? 'rgba(168,85,247,0.18)'
                                  : m.packageTier === 'Tier 2'
                                  ? 'rgba(0,242,254,0.18)'
                                  : m.packageTier === 'Tier 1'
                                  ? 'rgba(0,255,136,0.18)'
                                  : 'rgba(255,255,255,0.06)',
                              color:
                                m.packageTier === 'Tier 3'
                                  ? '#c084fc'
                                  : m.packageTier === 'Tier 2'
                                  ? '#00f2fe'
                                  : m.packageTier === 'Tier 1'
                                  ? '#00ff88'
                                  : 'var(--muted)',
                              border:
                                m.packageTier === 'Tier 3'
                                  ? '1px solid rgba(168,85,247,0.3)'
                                  : m.packageTier === 'Tier 2'
                                  ? '1px solid rgba(0,242,254,0.3)'
                                  : m.packageTier === 'Tier 1'
                                  ? '1px solid rgba(0,255,136,0.3)'
                                  : '1px solid rgba(255,255,255,0.1)',
                            }}
                          >
                            {m.packageName}
                          </span>
                        </div>
                      </td>

                      {/* INVESTMENT */}
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 800, color: m.investment > 0 ? '#00ff88' : 'var(--muted)' }}>
                          ${m.investment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                        </div>
                      </td>

                      {/* DIRECTS */}
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 10,
                              background: m.directCount > 0 ? 'rgba(0,242,254,0.15)' : 'rgba(255,255,255,0.05)',
                              color: m.directCount > 0 ? '#00f2fe' : 'var(--muted)',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                            }}
                          >
                            {m.directCount} Directs
                          </span>
                        </div>
                      </td>

                      {/* INCOME & BALANCE */}
                      <td style={{ padding: '14px' }}>
                        <div>
                          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: '0.9rem' }}>
                            ${Number(m.totalIncome || 0).toFixed(2)} USDT
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: 2 }}>
                            Withdrawable: <b style={{ color: 'var(--cyan)' }}>${Number(m.withdrawableBalance || 0).toFixed(2)}</b>
                          </div>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td style={{ padding: '14px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: 20,
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            background: m.active ? 'rgba(0,255,136,0.15)' : 'rgba(255,100,100,0.15)',
                            color: m.active ? '#00ff88' : '#ff6b6b',
                            border: m.active ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,100,100,0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: m.active ? '#00ff88' : '#ff6b6b',
                            }}
                          />
                          {m.status}
                        </span>
                      </td>

                      {/* REG DATE */}
                      <td style={{ padding: '14px', color: 'var(--muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {m.regDate}
                      </td>

                      {/* ACTIONS */}
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenDetails(m)}
                          className="btn btn-ghost"
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            borderRadius: 10,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            border: '1px solid rgba(255,255,255,0.12)',
                          }}
                        >
                          <Eye size={13} />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION BAR */}
        {!loading && filteredAndSortedMembers.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
              paddingTop: 16,
              marginTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ color: 'var(--muted)', fontSize: '0.84rem' }}>
              Showing{' '}
              <span style={{ color: '#fff', fontWeight: 700 }}>
                {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAndSortedMembers.length)}
              </span>{' '}
              to{' '}
              <span style={{ color: '#fff', fontWeight: 700 }}>
                {Math.min(currentPage * itemsPerPage, filteredAndSortedMembers.length)}
              </span>{' '}
              of <span style={{ color: '#ffd700', fontWeight: 700 }}>{filteredAndSortedMembers.length}</span> members
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* ITEMS PER PAGE */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--muted)' }}>
                <span>Per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    borderRadius: 8,
                    padding: '4px 8px',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value={10} style={{ background: '#0e1526' }}>10</option>
                  <option value={25} style={{ background: '#0e1526' }}>25</option>
                  <option value={50} style={{ background: '#0e1526' }}>50</option>
                  <option value={100} style={{ background: '#0e1526' }}>100</option>
                </select>
              </div>

              {/* PAGE BUTTONS */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.4 : 1,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ChevronLeft size={16} />
                </button>

                <div
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'rgba(255,215,0,0.1)',
                    border: '1px solid rgba(255,215,0,0.3)',
                    color: '#ffd700',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                  }}
                >
                  {currentPage} / {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.4 : 1,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MEMBER DETAILS MODAL */}
      {selectedMember && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedMember(null)
          }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: 720,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 24,
              padding: 28,
              position: 'relative',
              border: '1px solid rgba(255,215,0,0.35)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(255,215,0,0.15)',
            }}
          >
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setSelectedMember(null)}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#fff',
                width: 34,
                height: 34,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              <X size={18} />
            </button>

            {/* MODAL HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: getAvatarGradient(selectedMember.wallet),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  color: '#fff',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                }}
              >
                #{selectedMember.id}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#ffd700', fontWeight: 800 }}>
                    Member #{selectedMember.id} Telemetry
                  </h3>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 20,
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      background: selectedMember.active ? 'rgba(0,255,136,0.15)' : 'rgba(255,100,100,0.15)',
                      color: selectedMember.active ? '#00ff88' : '#ff6b6b',
                      border: selectedMember.active ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,100,100,0.3)',
                    }}
                  >
                    {selectedMember.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 2 }}>
                  Registered on {selectedMember.regTimeFormatted}
                </div>
              </div>
            </div>

            {/* WALLET & REFERRAL LINK BAR */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14,
                padding: 14,
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Participant Wallet Address
                  </div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#fff', fontSize: '0.88rem', wordBreak: 'break-all', marginTop: 3 }}>
                    {selectedMember.wallet}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleCopy(selectedMember.wallet, 'modal-wallet')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: copiedAddress === 'modal-wallet' ? '#00ff88' : '#fff',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {copiedAddress === 'modal-wallet' ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedAddress === 'modal-wallet' ? 'Copied' : 'Copy'}</span>
                  </button>
                  <a
                    href={`https://testnet.bscscan.com/address/${selectedMember.wallet}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      background: 'rgba(255,215,0,0.12)',
                      border: '1px solid rgba(255,215,0,0.3)',
                      color: '#ffd700',
                      fontSize: '0.78rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <ExternalLink size={13} />
                    <span>BSCScan</span>
                  </a>
                </div>
              </div>

              {/* REFERRAL LINK COPY SHORTCUT */}
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Share2 size={13} color="var(--cyan)" />
                  <span>Member Referral Link:</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--cyan)' }}>
                    {`${window.location.origin}/register?ref=${selectedMember.wallet.slice(0, 6)}...`}
                  </span>
                </div>
                <button
                  onClick={() =>
                    handleCopy(`${window.location.origin}/register?ref=${selectedMember.wallet}`, 'modal-reflink')
                  }
                  style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    background: 'rgba(0,242,254,0.12)',
                    border: '1px solid rgba(0,242,254,0.3)',
                    color: '#00f2fe',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  {copiedAddress === 'modal-reflink' ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedAddress === 'modal-reflink' ? 'Link Copied!' : 'Copy Full Ref Link'}</span>
                </button>
              </div>
            </div>

            {/* ELZORA BINARY & FINANCIAL METRICS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
              {/* SPONSOR */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 14 }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.74rem', textTransform: 'uppercase' }}>Sponsor Upline</div>
                <div style={{ fontWeight: 700, color: '#c084fc', marginTop: 4, fontFamily: 'monospace', fontSize: '0.84rem' }}>
                  {selectedMember.isRoot ? '👑 Genesis Root Node' : `${selectedMember.sponsor.slice(0, 8)}...${selectedMember.sponsor.slice(-6)}`}
                </div>
              </div>

              {/* BINARY PARENT & POSITION */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 14 }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.74rem', textTransform: 'uppercase' }}>Binary Parent & Leg</div>
                <div style={{ fontWeight: 800, color: 'var(--cyan)', marginTop: 4, fontSize: '0.86rem' }}>
                  {selectedMember.position === 2 ? 'Right Leg (Pos: 2)' : 'Left Leg (Pos: 1)'}
                </div>
              </div>

              {/* CURRENT RANK */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 14 }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.74rem', textTransform: 'uppercase' }}>Club Rank</div>
                <div style={{ fontWeight: 900, color: '#a855f7', marginTop: 4, fontSize: '0.96rem' }}>
                  {selectedMember.rankName}
                </div>
              </div>

              {/* TOTAL EARNED */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 14 }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.74rem', textTransform: 'uppercase' }}>Total Earned Income</div>
                <div style={{ fontWeight: 900, color: '#4ade80', marginTop: 4, fontSize: '1.1rem' }}>
                  ${Number(selectedMember.totalIncome || 0).toFixed(2)} USDT
                </div>
              </div>

              {/* WITHDRAWABLE BALANCE */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 14 }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.74rem', textTransform: 'uppercase' }}>Withdrawable Balance</div>
                <div style={{ fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
                  ${Number(selectedMember.withdrawableBalance || 0).toFixed(2)} USDT
                </div>
              </div>

              {/* BINARY TEAM */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 14 }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.74rem', textTransform: 'uppercase' }}>Binary Team Members</div>
                <div style={{ fontWeight: 800, color: '#fff', marginTop: 4 }}>
                  L: {selectedMember.leftTeamCount || 0} | R: {selectedMember.rightTeamCount || 0}
                </div>
              </div>

              {/* CARRY VOLUME */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 14 }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.74rem', textTransform: 'uppercase' }}>Binary Carry Volume</div>
                <div style={{ fontWeight: 800, color: '#fbbf24', marginTop: 4 }}>
                  L: {selectedMember.leftCarryVolume || 0} | R: {selectedMember.rightCarryVolume || 0}
                </div>
              </div>

              {/* DIRECTS BREAKDOWN */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 14 }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.74rem', textTransform: 'uppercase' }}>Direct Referrals</div>
                <div style={{ fontWeight: 800, color: '#fff', marginTop: 4 }}>
                  {selectedMember.directCount || 0} (L: {selectedMember.leftDirectCount || 0}, R: {selectedMember.rightDirectCount || 0})
                </div>
              </div>
            </div>

            {/* DIRECT REFERRALS LIST SECTION */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={16} color="#ffd700" />
                  <span>Direct Downlines ({memberDirects.length})</span>
                </div>
                {loadingDirects && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Loading on-chain downlines...</span>
                )}
              </div>

              {memberDirects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--muted)', fontSize: '0.84rem' }}>
                  No direct referrals registered under this wallet yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                  {memberDirects.map((dAddr, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.03)',
                        padding: '8px 12px',
                        borderRadius: 10,
                        fontSize: '0.82rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: 'var(--muted)', fontWeight: 700 }}>#{idx + 1}</span>
                        <span style={{ fontFamily: 'monospace', color: '#fff' }}>
                          {dAddr}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleCopy(dAddr, `direct-${idx}`)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: copiedAddress === `direct-${idx}` ? '#00ff88' : 'var(--muted)',
                            cursor: 'pointer',
                            padding: 2,
                          }}
                          title="Copy Direct Address"
                        >
                          {copiedAddress === `direct-${idx}` ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                        <a
                          href={`https://testnet.bscscan.com/address/${dAddr}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--muted)' }}
                          title="View on BSCScan"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
