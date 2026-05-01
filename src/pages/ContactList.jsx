import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout, { TopBar } from '../components/Layout.jsx'
import { getContacts } from '../lib/supabase.js'

const INDUSTRIES = ['Shipping', 'Legal', 'Finance', 'Government', 'Port Authority', 'Technology', 'Insurance', 'Trade Association', 'Academic', 'Other']
const RELATIONSHIP_TYPES = ['Client', 'Counterparty', 'Regulator', 'Industry peer', 'Vendor/supplier', 'Advisor/counsel', 'Internal colleague', 'Investor', 'Media', 'Other']
const GEOGRAPHIES = ['Singapore', 'China', 'Europe', 'Middle East', 'South Asia', 'Southeast Asia', 'Americas', 'Africa', 'Global']

export default function ContactList() {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ industry: '', relationship_type: '', geography: '' })
  const [viewMode, setViewMode] = useState('list') // 'list' | 'timeline'
  const [showFilters, setShowFilters] = useState(false)
  const [filterCounts, setFilterCounts] = useState({})

  const load = useCallback(async () => {
    try {
      const data = await getContacts({
        search: search || undefined,
        industry: filters.industry || undefined,
        relationship_type: filters.relationship_type || undefined,
        geography: filters.geography || undefined,
      })
      setContacts(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, filters])

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [load])

  // Compute timeline groups
  const timelineGroups = viewMode === 'timeline'
    ? contacts.reduce((acc, c) => {
        const key = c.where_met || 'Unknown event'
        if (!acc[key]) acc[key] = []
        acc[key].push(c)
        return acc
      }, {})
    : {}

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  function setFilter(key, val) {
    setFilters((f) => ({ ...f, [key]: f[key] === val ? '' : val }))
  }

  return (
    <Layout>
      <TopBar
        title="CardStack"
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(v => v === 'list' ? 'timeline' : 'list')}
              className={`text-[12px] px-2 py-1 rounded-[6px] transition-colors
                ${viewMode === 'timeline' ? 'bg-[#2a2a2a] text-[#c8a97e]' : 'text-[#555] hover:text-[#888]'}`}
            >
              {viewMode === 'list' ? <GridIcon /> : <ListIcon />}
            </button>
          </div>
        }
      />

      {/* Search + Filter bar */}
      <div className="px-4 pt-3 pb-2 flex flex-col gap-2 border-b border-[#1f1f1f]">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts…"
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-[8px] pl-9 pr-3 h-9
                text-[14px] text-[#e5e5e5] placeholder-[#444] outline-none focus:border-[#2a2a2a]"
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 h-9 rounded-[8px] text-[13px] border transition-colors
              ${showFilters || activeFilterCount > 0
                ? 'bg-[#c8a97e]/10 border-[#c8a97e]/30 text-[#c8a97e]'
                : 'bg-[#111] border-[#2a2a2a] text-[#555] hover:text-[#888]'}`}
          >
            <FilterIcon />
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#c8a97e] text-[#0a0a0a] text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-col gap-2 pb-1 fade-in">
            <FilterRow label="Industry" options={INDUSTRIES} active={filters.industry} onSelect={(v) => setFilter('industry', v)} />
            <FilterRow label="Relationship" options={RELATIONSHIP_TYPES} active={filters.relationship_type} onSelect={(v) => setFilter('relationship_type', v)} />
            <FilterRow label="Geography" options={GEOGRAPHIES} active={filters.geography} onSelect={(v) => setFilter('geography', v)} />
            {activeFilterCount > 0 && (
              <button
                onClick={() => setFilters({ industry: '', relationship_type: '', geography: '' })}
                className="self-start text-[12px] text-[#555] hover:text-[#888] transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Contact count */}
      <div className="px-4 py-2 flex items-center justify-between">
        <span className="text-[12px] text-[#444]">
          {loading ? '…' : `${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`}
        </span>
        {viewMode === 'timeline' && (
          <span className="text-[12px] text-[#c8a97e]">Timeline view</span>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-24">
        {loading ? (
          <SkeletonList />
        ) : contacts.length === 0 ? (
          <EmptyState search={search} hasFilters={activeFilterCount > 0} />
        ) : viewMode === 'list' ? (
          <div className="px-4 flex flex-col gap-2">
            {contacts.map((c) => (
              <ContactCard key={c.id} contact={c} onClick={() => navigate(`/contact/${c.id}`)} />
            ))}
          </div>
        ) : (
          <div className="px-4 flex flex-col gap-5">
            {Object.entries(timelineGroups).map(([event, group]) => (
              <div key={event}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-[12px] font-semibold text-[#555] uppercase tracking-wider">{event}</h3>
                  <div className="h-px flex-1 bg-[#1f1f1f]" />
                  <span className="text-[11px] text-[#444]">{group.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {group.map((c) => (
                    <ContactCard key={c.id} contact={c} onClick={() => navigate(`/contact/${c.id}`)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-6 right-5 safe-bottom">
        <button
          onClick={() => navigate('/add')}
          className="w-14 h-14 rounded-full bg-[#c8a97e] flex items-center justify-center
            shadow-lg active:scale-90 transition-all hover:bg-[#d4b98a]"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </Layout>
  )
}

function ContactCard({ contact, onClick }) {
  const initials = contact.name
    ? contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-[#111] border border-[#1f1f1f] rounded-[12px]
        px-4 py-3 text-left hover:border-[#2a2a2a] hover:bg-[#131313] transition-all active:scale-[0.98]"
    >
      {/* Avatar or image */}
      <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center flex-shrink-0 overflow-hidden">
        {contact.card_front_url ? (
          <img src={contact.card_front_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[13px] font-medium text-[#888]">{initials}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium text-[#e5e5e5] truncate">{contact.name || 'Unknown'}</span>
          {contact.follow_up_flag && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#c8a97e] flex-shrink-0" />
          )}
        </div>
        <p className="text-[12px] text-[#555] truncate mt-0.5">
          {[contact.title, contact.company].filter(Boolean).join(' · ') || '—'}
        </p>
      </div>

      <div className="flex-shrink-0 text-right">
        {contact.date_met && (
          <span className="text-[11px] text-[#444]">{formatDate(contact.date_met)}</span>
        )}
        {contact.industry && (
          <p className="text-[11px] text-[#555] mt-0.5 truncate max-w-20">{contact.industry}</p>
        )}
      </div>
    </button>
  )
}

function FilterRow({ label, options, active, onSelect }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
      <span className="text-[11px] text-[#444] flex-shrink-0 w-16">{label}</span>
      <div className="flex gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] border transition-all
              ${active === opt
                ? 'bg-[#c8a97e]/15 border-[#c8a97e]/40 text-[#c8a97e]'
                : 'bg-[#111] border-[#2a2a2a] text-[#555] hover:text-[#888]'}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="px-4 flex flex-col gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 bg-[#111] border border-[#1f1f1f] rounded-[12px] px-4 py-3">
          <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-3.5 skeleton rounded-full w-32" />
            <div className="h-3 skeleton rounded-full w-48" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ search, hasFilters }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 gap-3">
      <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5">
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <line x1="7" y1="10" x2="14" y2="10" />
          <line x1="7" y1="14" x2="11" y2="14" />
        </svg>
      </div>
      <p className="text-[#555] text-[14px] text-center">
        {search || hasFilters ? 'No contacts match your search' : 'No contacts yet'}
      </p>
      {!search && !hasFilters && (
        <p className="text-[#444] text-[13px] text-center">Tap + to add your first contact</p>
      )}
    </div>
  )
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
}

function SearchIcon({ className }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}
