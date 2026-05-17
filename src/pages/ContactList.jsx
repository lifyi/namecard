import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, SlidersHorizontal } from 'lucide-react'
import Layout, { TopBar } from '../components/Layout.jsx'
import { getContacts } from '../lib/supabase.js'
import { industryColor, hex2rgba } from '../lib/industryColors.js'

const INDUSTRIES = ['Shipping', 'Legal', 'Finance', 'Government', 'Port Authority', 'Technology', 'Insurance', 'Trade Association', 'Academic', 'Other']
const RELATIONSHIP_TYPES = ['Client', 'Counterparty', 'Regulator', 'Industry peer', 'Vendor/supplier', 'Advisor/counsel', 'Internal colleague', 'Investor', 'Media', 'Other']
const GEOGRAPHIES = ['Singapore', 'China', 'Europe', 'Middle East', 'South Asia', 'Southeast Asia', 'Americas', 'Africa', 'Global']
const SORT_OPTIONS = [{ value: 'date_met', label: 'Date met' }, { value: 'last_seen', label: 'Last seen' }]

export default function ContactList() {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ industry: '', relationship_type: '', geography: '' })
  const [sort, setSort] = useState('date_met')
  const [viewMode, setViewMode] = useState('list')
  const [showFilters, setShowFilters] = useState(false)
  const [showAddSheet, setShowAddSheet] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await getContacts({
        search: search || undefined,
        industry: filters.industry || undefined,
        relationship_type: filters.relationship_type || undefined,
        geography: filters.geography || undefined,
        sort,
      })
      setContacts(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, filters, sort])

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(load, 150)
    return () => clearTimeout(t)
  }, [load])

  const timelineGroups = viewMode === 'timeline'
    ? contacts.reduce((acc, c) => {
        const key = c.where_met || 'Unknown event'
        if (!acc[key]) acc[key] = []
        acc[key].push(c)
        return acc
      }, {})
    : {}

  const activeFilterCount = Object.values(filters).filter(Boolean).length
  function setFilter(key, val) { setFilters(f => ({ ...f, [key]: f[key] === val ? '' : val })) }

  return (
    <Layout>
      {showAddSheet && (
        <AddSheet
          onClose={() => setShowAddSheet(false)}
          onScan={() => { setShowAddSheet(false); navigate('/add?mode=scan') }}
          onManual={() => { setShowAddSheet(false); navigate('/add?mode=manual') }}
          onImport={() => { setShowAddSheet(false); navigate('/import') }}
        />
      )}

      <TopBar
        title="CardStack"
        titleFont="display"
        right={
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/import')}
              title="Import contacts"
              style={{ color: 'var(--text-tertiary)', transition: 'color 150ms' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
            >
              <Upload size={18} />
            </button>
            <button
              onClick={() => setShowFilters(v => !v)}
              title="Filter contacts"
              style={{
                color: showFilters || activeFilterCount > 0 ? 'var(--accent)' : 'var(--text-tertiary)',
                transition: 'color 150ms',
                position: 'relative',
              }}
            >
              <SlidersHorizontal size={18} />
              {activeFilterCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-5px', right: '-5px',
                  width: '15px', height: '15px', borderRadius: '50%',
                  background: 'var(--accent)', color: '#fff',
                  fontSize: '9px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{activeFilterCount}</span>
              )}
            </button>
          </div>
        }
      />

      {/* Search bar */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '10px 16px' }}>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search contacts…"
            style={{
              width: '100%', background: '#ffffff', border: '1px solid var(--border)',
              borderRadius: '10px', height: '38px', paddingLeft: '36px', paddingRight: '12px',
              fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', outline: 'none',
              boxShadow: '0 1px 2px var(--shadow)',
            }}
          />
        </div>

        {showFilters && (
          <div className="flex flex-col gap-2 mt-3 fade-in">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', width: '52px', flexShrink: 0, fontFamily: 'var(--font-body)' }}>Sort</span>
              <div className="flex gap-2">
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setSort(opt.value)} style={{
                    padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontFamily: 'var(--font-body)',
                    border: `1px solid ${sort === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                    background: sort === opt.value ? 'rgba(138,104,48,0.1)' : '#ffffff',
                    color: sort === opt.value ? 'var(--accent)' : 'var(--text-secondary)',
                    transition: 'all 150ms',
                  }}>{opt.label}</button>
                ))}
              </div>
            </div>
            <FilterRow label="Industry" options={INDUSTRIES} active={filters.industry} onSelect={v => setFilter('industry', v)} />
            <FilterRow label="Relation" options={RELATIONSHIP_TYPES} active={filters.relationship_type} onSelect={v => setFilter('relationship_type', v)} />
            <FilterRow label="Geography" options={GEOGRAPHIES} active={filters.geography} onSelect={v => setFilter('geography', v)} />
            {activeFilterCount > 0 && (
              <button onClick={() => setFilters({ industry: '', relationship_type: '', geography: '' })}
                style={{ alignSelf: 'flex-start', fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Count + view toggle */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
          {loading ? '…' : `${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`}
        </span>
        <div className="flex" style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border)' }}>
          {['list', 'timeline'].map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontFamily: 'var(--font-body)',
              fontWeight: viewMode === mode ? 500 : 400,
              background: viewMode === mode ? '#ffffff' : 'transparent',
              color: viewMode === mode ? 'var(--text-primary)' : 'var(--text-tertiary)',
              boxShadow: viewMode === mode ? '0 1px 2px var(--shadow)' : 'none',
              transition: 'all 150ms',
              textTransform: 'capitalize',
            }}>{mode}</button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-24">
        {loading ? <SkeletonList /> : contacts.length === 0
          ? <EmptyState search={search} hasFilters={activeFilterCount > 0} />
          : viewMode === 'list'
            ? contacts.map(c => <ContactRow key={c.id} contact={c} sort={sort} onClick={() => navigate(`/contact/${c.id}`)} />)
            : Object.entries(timelineGroups).map(([event, group]) => (
                <div key={event}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span style={{ fontSize: '12px', fontStyle: 'italic', fontFamily: 'var(--font-display)', color: 'var(--text-tertiary)', flexShrink: 0 }}>{event}</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)', flexShrink: 0 }}>{group.length}</span>
                  </div>
                  {group.map(c => <ContactRow key={c.id} contact={c} sort={sort} onClick={() => navigate(`/contact/${c.id}`)} />)}
                </div>
              ))
        }
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddSheet(true)}
        className="fixed bottom-6 right-5 w-14 h-14 rounded-full flex items-center justify-center active:scale-90"
        style={{
          background: 'var(--accent)',
          boxShadow: '0 4px 16px rgba(138,104,48,0.3)',
          transition: 'all 150ms',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </Layout>
  )
}

function ContactRow({ contact, sort, onClick }) {
  const [hovered, setHovered] = useState(false)
  const initials = contact.name ? contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'
  const color = industryColor(contact.industry)
  const interactions = contact.interactions || []
  const lastSeen = interactions.length
    ? [...interactions].sort((a, b) => b.date.localeCompare(a.date))[0].date
    : contact.date_met
  const dateToShow = sort === 'last_seen' ? lastSeen : contact.date_met

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full text-left flex items-center gap-3"
      style={{
        background: hovered ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 16px',
        transition: 'background 150ms',
      }}
    >
      <div className="flex-shrink-0 flex items-center justify-center rounded-full"
        style={{ width: 44, height: 44, background: hex2rgba(color, 0.15), border: `1.5px solid ${hex2rgba(color, 0.3)}` }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color, fontFamily: 'var(--font-body)' }}>{initials}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {contact.name || 'Unknown'}
          </span>
          {contact.follow_up_flag && (
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
          )}
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
          {[contact.title, contact.company].filter(Boolean).join(' · ') || '—'}
        </p>
      </div>

      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        {dateToShow && <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>{fmtDate(dateToShow)}</span>}
        {contact.industry && (
          <span style={{
            fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
            background: hex2rgba(color, 0.12), color, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
          }}>{contact.industry}</span>
        )}
        {interactions.length > 0 && (
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
            {interactions.length} interaction{interactions.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </button>
  )
}

function AddSheet({ onClose, onScan, onManual, onImport }) {
  const options = [
    { label: 'Scan a card', icon: <CameraIcon />, action: onScan },
    { label: 'Enter details manually', icon: <PencilIcon />, action: onManual },
    { label: 'Import from Excel', icon: <UploadSheetIcon />, action: onImport },
  ]
  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(26,24,20,0.4)' }} onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 slide-up"
        style={{ background: '#ffffff', borderTop: '1px solid var(--border)', borderRadius: '16px 16px 0 0', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-center pt-3 pb-2">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>
        <div className="px-4 pb-5 flex flex-col gap-2">
          {options.map((opt, i) => <SheetOption key={i} icon={opt.icon} label={opt.label} onTap={opt.action} />)}
        </div>
      </div>
    </>
  )
}

function SheetOption({ icon, label, onTap }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button onClick={onTap}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center gap-4 active:scale-[0.98]"
      style={{
        height: 56, background: hovered ? 'var(--bg-card-hover)' : 'var(--bg-secondary)',
        border: '1px solid var(--border)', borderRadius: 10, padding: '0 16px', transition: 'all 150ms',
      }}>
      <span style={{ color: 'var(--accent)' }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 15, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', textAlign: 'left' }}>{label}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
    </button>
  )
}

function FilterRow({ label, options, active, onSelect }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', width: '52px', flexShrink: 0, fontFamily: 'var(--font-body)' }}>{label}</span>
      <div className="flex gap-1.5">
        {options.map(opt => (
          <button key={opt} onClick={() => onSelect(opt)} style={{
            flexShrink: 0, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontFamily: 'var(--font-body)',
            border: `1px solid ${active === opt ? 'var(--accent)' : 'var(--border)'}`,
            background: active === opt ? 'rgba(138,104,48,0.1)' : '#ffffff',
            color: active === opt ? 'var(--accent)' : 'var(--text-secondary)',
            transition: 'all 150ms', whiteSpace: 'nowrap',
          }}>{opt}</button>
        ))}
      </div>
    </div>
  )
}

function SkeletonList() {
  return (
    <div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="skeleton rounded-full flex-shrink-0" style={{ width: 44, height: 44 }} />
          <div className="flex-1 flex flex-col gap-2">
            <div className="skeleton rounded" style={{ height: 14, width: 130 }} />
            <div className="skeleton rounded" style={{ height: 12, width: 180 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ search, hasFilters }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 gap-3">
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5">
          <rect x="3" y="5" width="18" height="14" rx="3" /><line x1="7" y1="10" x2="14" y2="10" /><line x1="7" y1="14" x2="11" y2="14" />
        </svg>
      </div>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', textAlign: 'center' }}>
        {search || hasFilters ? 'No contacts match' : 'No contacts yet'}
      </p>
    </div>
  )
}

function fmtDate(s) {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d)) return s
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function CameraIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg> }
function PencilIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg> }
function UploadSheetIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg> }
