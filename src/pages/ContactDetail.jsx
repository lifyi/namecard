import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout, { TopBar } from '../components/Layout.jsx'
import Button from '../components/Button.jsx'
import { getContact, toggleFollowUp, deleteContact } from '../lib/supabase.js'
import { addMockInteraction, getContactStats } from '../lib/mockData.js'
import { industryColor, hex2rgba } from '../lib/industryColors.js'
import useSpeech from '../hooks/useSpeech.js'

export default function ContactDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [contact, setContact] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imageViewer, setImageViewer] = useState(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showAddInteraction, setShowAddInteraction] = useState(false)

  useEffect(() => {
    getContact(id).then(setContact).catch(() => navigate('/')).finally(() => setLoading(false))
  }, [id])

  async function handleToggleFollowUp() {
    if (!contact) return
    await toggleFollowUp(id)
    setContact(c => ({ ...c, follow_up_flag: !c.follow_up_flag }))
  }

  async function handleDelete() {
    setDeleting(true)
    try { await deleteContact(id); navigate('/', { replace: true }) }
    catch { setDeleting(false); setShowDelete(false) }
  }

  function handleInteractionAdded(entry) {
    setContact(c => ({
      ...c,
      interactions: [...(c.interactions || []), entry].sort((a, b) => a.date.localeCompare(b.date)),
    }))
    setShowAddInteraction(false)
  }

  if (loading) {
    return (
      <Layout>
        <TopBar title="" titleFont="body" left={<BackBtn onClick={() => navigate('/')} />} />
        <div className="px-4 pt-4 flex flex-col gap-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton rounded-[10px]" style={{ height: 80 }} />)}
        </div>
      </Layout>
    )
  }
  if (!contact) return null

  const stats = getContactStats(contact)
  const color = industryColor(contact.industry)

  return (
    <Layout>
      {imageViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(26,24,20,0.85)' }} onClick={() => setImageViewer(null)}>
          <img src={imageViewer} alt="" className="max-w-full max-h-full rounded-[8px]" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }} />
          <button className="absolute top-5 right-5 text-3xl leading-none" style={{ color: 'rgba(255,255,255,0.5)' }}>×</button>
        </div>
      )}

      {showDelete && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: 'rgba(26,24,20,0.5)' }} onClick={() => setShowDelete(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 slide-up"
            style={{ background: '#ffffff', borderTop: '1px solid var(--border)', borderRadius: '16px 16px 0 0', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)', padding: '20px 16px 32px' }}>
            <h3 style={{ fontSize: 17, fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--text-primary)', marginBottom: 6 }}>Delete contact?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', marginBottom: 20 }}>This cannot be undone.</p>
            <Button variant="danger" fullWidth onClick={handleDelete} loading={deleting}>Delete {contact.name}</Button>
            <div style={{ height: 10 }} />
            <Button variant="secondary" fullWidth onClick={() => setShowDelete(false)}>Cancel</Button>
          </div>
        </>
      )}

      {showAddInteraction && (
        <AddInteractionSheet contactId={id} onSave={handleInteractionAdded} onClose={() => setShowAddInteraction(false)} />
      )}

      <TopBar
        title={contact.name || 'Contact'}
        titleFont="display"
        subtitle={[contact.title, contact.company].filter(Boolean).join(' · ')}
        left={<BackBtn onClick={() => navigate('/')} />}
        right={
          <button onClick={() => navigate(`/contact/${id}/edit`)}
            style={{ color: 'var(--accent)', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
            Edit
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-28">
        {/* Card thumbnails */}
        <div className="flex gap-2 px-4 pt-4">
          {contact.card_front_url ? (
            <button className="flex-1 active:opacity-80"
              style={{ height: 90, borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 3px var(--shadow)' }}
              onClick={() => setImageViewer(contact.card_front_url)}>
              <img src={contact.card_front_url} alt="" className="w-full h-full object-cover" />
            </button>
          ) : (
            <CardPlaceholder />
          )}
          {contact.card_back_url ? (
            <button className="flex-1 active:opacity-80"
              style={{ height: 90, borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 3px var(--shadow)' }}
              onClick={() => setImageViewer(contact.card_back_url)}>
              <img src={contact.card_back_url} alt="" className="w-full h-full object-cover" />
            </button>
          ) : (
            <CardPlaceholder />
          )}
        </div>

        <div className="px-4 pt-4 flex flex-col gap-5">
          {/* Summary strip */}
          <SummaryStrip stats={stats} />

          {/* Equal-width action buttons */}
          <div className="flex gap-2">
            {[
              contact.email && { href: `mailto:${contact.email}`, label: 'Email', icon: <MailIcon /> },
              contact.phone && { href: `tel:${contact.phone}`, label: 'Call', icon: <PhoneIcon /> },
              { label: contact.follow_up_flag ? 'Flagged' : 'Flag', icon: <FlagIcon />, onClick: handleToggleFollowUp, active: contact.follow_up_flag },
            ].filter(Boolean).map((btn, i) => btn.href ? (
              <a key={i} href={btn.href}
                className="flex-1 flex items-center justify-center gap-2 active:scale-[0.97]"
                style={{ height: 44, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', textDecoration: 'none', boxShadow: '0 1px 2px var(--shadow)', transition: 'all 150ms' }}>
                {btn.icon} {btn.label}
              </a>
            ) : (
              <button key={i} onClick={btn.onClick}
                className="flex-1 flex items-center justify-center gap-2 active:scale-[0.97]"
                style={{
                  height: 44, borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-body)', transition: 'all 150ms',
                  background: btn.active ? 'rgba(138,104,48,0.1)' : 'var(--bg-card)',
                  border: `1px solid ${btn.active ? 'var(--accent)' : 'var(--border)'}`,
                  color: btn.active ? 'var(--accent)' : 'var(--text-primary)',
                  boxShadow: '0 1px 2px var(--shadow)',
                }}>
                {btn.icon} {btn.label}
              </button>
            ))}
          </div>

          <Section title="Contact">
            <Field label="Name" value={contact.name} />
            <Field label="Other Name" value={contact.alternate_name} />
            <Field label="Title" value={contact.title} />
            <Field label="Company" value={contact.company} />
            <Field label="Email" value={contact.email} href={`mailto:${contact.email}`} />
            <Field label="Phone" value={contact.phone} href={`tel:${contact.phone}`} />
            <Field label="Messenger" value={contact.alternate_messenger} />
            <Field label="Address" value={contact.address} />
          </Section>

          <Section title="Context">
            <Field label="Date Met" value={contact.date_met && fmtDateLong(contact.date_met)} />
            <Field label="Where Met" value={contact.where_met} />
            <Field label="How Met" value={contact.how_met} />
          </Section>

          <Section title="Classification">
            {contact.industry && (
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)', display: 'block', marginBottom: 4 }}>Industry</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 20, background: hex2rgba(color, 0.12), border: `1px solid ${hex2rgba(color, 0.3)}`, color, fontSize: 13, fontFamily: 'var(--font-body)' }}>
                  {contact.industry}
                </span>
              </div>
            )}
            <Field label="Relationship" value={contact.relationship_type} />
            <Field label="Geography" value={contact.geography} />
            {contact.tags?.length > 0 && (
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)', display: 'block', marginBottom: 6 }}>Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {contact.tags.map(tag => (
                    <span key={tag} style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(138,104,48,0.08)', border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: 11, fontFamily: 'var(--font-body)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>

          <InteractionLog interactions={contact.interactions || []} onAddInteraction={() => setShowAddInteraction(true)} />

          <button onClick={() => setShowDelete(true)}
            style={{ width: '100%', padding: '12px 0', fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)', transition: 'color 150ms' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
          >
            Delete contact
          </button>
        </div>
      </div>
    </Layout>
  )
}

function SummaryStrip({ stats }) {
  const parts = []
  if (stats.firstMet) parts.push(`First met ${fmtDateShort(stats.firstMet)}`)
  if (stats.lastSeen && stats.lastSeen !== stats.firstMet) parts.push(`Last seen ${fmtDateShort(stats.lastSeen)}`)
  if (stats.count > 0) parts.push(`${stats.count} interaction${stats.count !== 1 ? 's' : ''}`)
  if (stats.daysSince !== null) parts.push(stats.daysSince === 0 ? 'Seen today' : `${stats.daysSince}d since last contact`)
  if (!parts.length) return null

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', boxShadow: '0 1px 3px var(--shadow)' }}>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', lineHeight: 1.7 }}>
        {parts.map((p, i) => (
          <span key={i}>
            {i > 0 && <span style={{ color: 'var(--border)', margin: '0 6px' }}>·</span>}
            {p}
          </span>
        ))}
      </p>
    </div>
  )
}

function Section({ title, children }) {
  const kids = Array.isArray(children) ? children : [children]
  if (!kids.some(c => c && c.props?.value)) return null
  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 12, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>{title}</h3>
      <div className="flex flex-col" style={{ gap: 14 }}>{children}</div>
    </div>
  )
}

function Field({ label, value, href }) {
  if (!value) return null
  return (
    <div>
      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)', display: 'block', marginBottom: 3 }}>{label}</span>
      {href ? (
        <a href={href} style={{ fontSize: 14, color: 'var(--accent)', fontFamily: 'var(--font-body)', textDecoration: 'none' }}>{value}</a>
      ) : (
        <span style={{ fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', lineHeight: 1.5, display: 'block' }}>{value}</span>
      )}
    </div>
  )
}

function InteractionLog({ interactions, onAddInteraction }) {
  // Oldest first — LATEST badge on the last (most recent) entry
  const sorted = [...interactions].sort((a, b) => a.date.localeCompare(b.date))
  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 12, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Interactions</h3>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>{interactions.length} total</span>
      </div>
      <div className="flex flex-col" style={{ gap: 10 }}>
        {sorted.map((entry, idx) => (
          <InteractionEntry key={entry.id} entry={entry} isLatest={idx === sorted.length - 1} />
        ))}
      </div>
      <AddInteractionBtn onClick={onAddInteraction} />
    </div>
  )
}

function InteractionEntry({ entry, isLatest }) {
  const [showRaw, setShowRaw] = useState(false)
  return (
    <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px var(--shadow)' }}>
      <div className="flex items-center justify-between" style={{ padding: '11px 14px 9px' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
          {fmtDateLong(entry.date)}
        </span>
        {isLatest && (
          <span style={{ padding: '2px 8px', borderRadius: 20, background: 'var(--accent)', color: '#ffffff', fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-body)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Latest
          </span>
        )}
      </div>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', lineHeight: 1.55, padding: '0 14px 10px' }}>
        {entry.discussion}
      </p>
      {entry.follow_up && (
        <div className="flex items-start gap-2" style={{ padding: '0 14px 12px' }}>
          <FlagIcon style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: 'var(--accent)', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>{entry.follow_up}</p>
        </div>
      )}
      {entry.raw_note && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={() => setShowRaw(v => !v)}
            className="flex items-center gap-2 w-full"
            style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)', transition: 'color 150ms' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ transition: 'transform 150ms', transform: showRaw ? 'rotate(90deg)' : 'none' }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {showRaw ? 'Hide raw note' : 'Show raw note'}
          </button>
          {showRaw && (
            <p style={{ padding: '0 14px 12px', fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'monospace', lineHeight: 1.6, fontStyle: 'italic', whiteSpace: 'pre-wrap', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
              {entry.raw_note}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function AddInteractionBtn({ onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center justify-center gap-2 active:scale-[0.98]"
      style={{
        marginTop: 10, height: 48, borderRadius: 10,
        border: `1.5px dashed ${hovered ? 'var(--accent)' : 'var(--border)'}`,
        background: 'transparent',
        color: hovered ? 'var(--accent)' : 'var(--text-tertiary)',
        fontSize: 13, fontFamily: 'var(--font-body)', transition: 'all 150ms',
      }}>
      <MicIcon /> Add interaction
    </button>
  )
}

function AddInteractionSheet({ contactId, onSave, onClose }) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const { listening, supported: speechSupported, toggle: toggleSpeech } = useSpeech(
    useCallback(transcript => { setText(t => t ? `${t} ${transcript}` : transcript) }, [])
  )

  async function handleSave() {
    if (!text.trim()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    const entry = addMockInteraction(contactId, {
      date, discussion: text.length > 100 ? text.slice(0, 100) + '…' : text, follow_up: null, raw_note: text,
    })
    setLoading(false)
    onSave(entry)
  }

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(26,24,20,0.4)' }} onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 slide-up"
        style={{ background: '#ffffff', borderTop: '1px solid var(--border)', borderRadius: '16px 16px 0 0', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)', padding: '20px 16px 32px' }}>
        <div className="flex justify-center mb-3">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--text-primary)' }}>Add Interaction</h3>
          <button onClick={onClose} style={{ fontSize: 24, color: 'var(--text-tertiary)', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)', display: 'block', marginBottom: 4 }}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 12px', height: 40, fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', outline: 'none' }} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}>Notes</label>
            {speechSupported && <MicButton listening={listening} onToggle={toggleSpeech} />}
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="What was discussed, any follow-up actions…"
            rows={4} autoFocus
            style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', outline: 'none', resize: 'none', lineHeight: 1.5 }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(138,104,48,0.12)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
          />
        </div>
        <Button variant="primary" size="lg" fullWidth onClick={handleSave} loading={loading} disabled={!text.trim()}>
          Structure & Save
        </Button>
      </div>
    </>
  )
}

function CardPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center"
      style={{ height: 90, borderRadius: 8, border: '1.5px dashed var(--border)', background: 'var(--bg-secondary)' }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5">
        <rect x="2" y="5" width="20" height="14" rx="3" /><line x1="6" y1="10" x2="13" y2="10" /><line x1="6" y1="14" x2="9" y2="14" />
      </svg>
    </div>
  )
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1"
      style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', transition: 'color 150ms' }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
      Back
    </button>
  )
}

function MicButton({ listening, onToggle }) {
  return (
    <button onClick={onToggle} className="flex items-center gap-1.5"
      style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontFamily: 'var(--font-body)', border: `1px solid ${listening ? 'rgba(192,97,74,0.4)' : 'var(--border)'}`, background: listening ? 'rgba(192,97,74,0.08)' : 'var(--bg-secondary)', color: listening ? 'var(--accent-danger)' : 'var(--text-secondary)', transition: 'all 150ms' }}>
      {listening ? <><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-danger)', display: 'inline-block' }} /> Stop</> : <><MicIcon /> Dictate</>}
    </button>
  )
}

function MailIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg> }
function PhoneIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.02-.93a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg> }
function FlagIcon({ style }) { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg> }
function MicIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg> }

function fmtDateLong(s) {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d)) return s
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtDateShort(s) {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d)) return s
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
