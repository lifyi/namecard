import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout, { TopBar } from '../components/Layout.jsx'
import Button from '../components/Button.jsx'
import { getContact, toggleFollowUp, deleteContact } from '../lib/supabase.js'
import { addMockInteraction } from '../lib/mockData.js'
import { getContactStats } from '../lib/mockData.js'
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
    getContact(id)
      .then(setContact)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleToggleFollowUp() {
    if (!contact) return
    await toggleFollowUp(id)
    setContact(c => ({ ...c, follow_up_flag: !c.follow_up_flag }))
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteContact(id)
      navigate('/', { replace: true })
    } catch {
      setDeleting(false)
      setShowDelete(false)
    }
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
        <TopBar title="" left={<BackButton onClick={() => navigate('/')} />} />
        <div className="px-4 pt-4 flex flex-col gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 skeleton rounded-[12px]" />)}
        </div>
      </Layout>
    )
  }
  if (!contact) return null

  const stats = getContactStats(contact)

  return (
    <Layout>
      {/* Image lightbox */}
      {imageViewer && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setImageViewer(null)}
        >
          <img src={imageViewer} alt="Card" className="max-w-full max-h-full rounded-[8px]" />
          <button className="absolute top-5 right-5 text-white/40 hover:text-white text-3xl leading-none">×</button>
        </div>
      )}

      {/* Delete confirmation sheet */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end">
          <div className="w-full bg-[#111] border-t border-[#2a2a2a] rounded-t-[16px] p-5 flex flex-col gap-3">
            <h3 className="text-[16px] font-semibold text-[#e5e5e5]">Delete contact?</h3>
            <p className="text-[13px] text-[#555]">This cannot be undone.</p>
            <Button variant="danger" fullWidth onClick={handleDelete} loading={deleting}>
              Delete {contact.name}
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setShowDelete(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Add interaction sheet */}
      {showAddInteraction && (
        <AddInteractionSheet
          contactId={id}
          onSave={handleInteractionAdded}
          onClose={() => setShowAddInteraction(false)}
        />
      )}

      <TopBar
        title={contact.name || 'Contact'}
        subtitle={[contact.title, contact.company].filter(Boolean).join(' · ')}
        left={<BackButton onClick={() => navigate('/')} />}
        right={
          <button onClick={() => navigate(`/contact/${id}/edit`)} className="text-[#c8a97e] text-[14px] font-medium">
            Edit
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-28">
        {/* Card images */}
        {(contact.card_front_url || contact.card_back_url) && (
          <div className="flex gap-2 px-4 pt-4">
            {contact.card_front_url && (
              <button className="flex-1 rounded-[10px] overflow-hidden border border-[#2a2a2a] h-28 active:opacity-80"
                onClick={() => setImageViewer(contact.card_front_url)}>
                <img src={contact.card_front_url} alt="Card front" className="w-full h-full object-cover" />
              </button>
            )}
            {contact.card_back_url && (
              <button className="flex-1 rounded-[10px] overflow-hidden border border-[#2a2a2a] h-28 active:opacity-80"
                onClick={() => setImageViewer(contact.card_back_url)}>
                <img src={contact.card_back_url} alt="Card back" className="w-full h-full object-cover" />
              </button>
            )}
          </div>
        )}

        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Summary strip */}
          <SummaryStrip stats={stats} />

          {/* Quick actions */}
          <div className="flex gap-2">
            {contact.email && (
              <a href={`mailto:${contact.email}`}
                className="flex-1 flex items-center justify-center gap-2 h-10 bg-[#111] border border-[#2a2a2a]
                  rounded-[10px] text-[13px] text-[#e5e5e5] hover:border-[#3a3a3a] transition-colors active:scale-[0.97]">
                <MailIcon /> Email
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`}
                className="flex-1 flex items-center justify-center gap-2 h-10 bg-[#111] border border-[#2a2a2a]
                  rounded-[10px] text-[13px] text-[#e5e5e5] hover:border-[#3a3a3a] transition-colors active:scale-[0.97]">
                <PhoneIcon /> Call
              </a>
            )}
            <button
              onClick={handleToggleFollowUp}
              className={`flex items-center justify-center gap-1.5 px-3 h-10 rounded-[10px] text-[13px] border transition-all
                ${contact.follow_up_flag
                  ? 'bg-[#c8a97e]/15 border-[#c8a97e]/40 text-[#c8a97e]'
                  : 'bg-[#111] border-[#2a2a2a] text-[#555] hover:text-[#888]'}`}
            >
              <FlagIcon /> {contact.follow_up_flag ? 'Flagged' : 'Flag'}
            </button>
          </div>

          {/* Contact info */}
          <InfoSection title="Contact">
            <InfoRow label="Name" value={contact.name} />
            {contact.alternate_name && <InfoRow label="Other Name" value={contact.alternate_name} />}
            <InfoRow label="Title" value={contact.title} />
            <InfoRow label="Company" value={contact.company} />
            <InfoRow label="Email" value={contact.email} href={`mailto:${contact.email}`} />
            <InfoRow label="Phone" value={contact.phone} href={`tel:${contact.phone}`} />
            {contact.alternate_messenger && <InfoRow label="Messenger" value={contact.alternate_messenger} />}
            {contact.address && <InfoRow label="Address" value={contact.address} />}
          </InfoSection>

          {/* Context */}
          <InfoSection title="Context">
            <InfoRow label="Date Met" value={contact.date_met && formatDateLong(contact.date_met)} />
            <InfoRow label="Where Met" value={contact.where_met} />
            <InfoRow label="How Met" value={contact.how_met} />
          </InfoSection>

          {/* Classification */}
          <InfoSection title="Classification">
            <InfoRow label="Industry" value={contact.industry} />
            <InfoRow label="Relationship" value={contact.relationship_type} />
            <InfoRow label="Geography" value={contact.geography} />
            {contact.tags?.length > 0 && (
              <div className="px-4 py-2.5">
                <span className="text-[10px] text-[#444] uppercase tracking-wider block mb-2">Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {contact.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full text-[12px] text-[#888]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </InfoSection>

          {/* Interaction log */}
          <InteractionLog
            interactions={contact.interactions || []}
            onAddInteraction={() => setShowAddInteraction(true)}
          />

          {/* Delete */}
          <div className="pt-1">
            <button
              onClick={() => setShowDelete(true)}
              className="w-full py-3 text-[#444] text-[13px] hover:text-[#e05c5c] transition-colors"
            >
              Delete contact
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

// ── Summary strip ─────────────────────────────────────────────────────────────
function SummaryStrip({ stats }) {
  const parts = []
  if (stats.firstMet) parts.push(`First met ${formatDateShort(stats.firstMet)}`)
  if (stats.lastSeen && stats.lastSeen !== stats.firstMet) parts.push(`Last seen ${formatDateShort(stats.lastSeen)}`)
  if (stats.count > 0) parts.push(`${stats.count} interaction${stats.count !== 1 ? 's' : ''}`)
  if (stats.daysSince !== null) {
    parts.push(stats.daysSince === 0 ? 'Seen today' : `${stats.daysSince}d since last contact`)
  }

  if (!parts.length) return null

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-[10px] px-4 py-2.5">
      <p className="text-[12px] text-[#555] leading-relaxed">{parts.join(' · ')}</p>
    </div>
  )
}

// ── Interaction log ───────────────────────────────────────────────────────────
function InteractionLog({ interactions, onAddInteraction }) {
  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[12px] font-semibold text-[#555] uppercase tracking-wider">
          Interactions
        </h3>
        <span className="text-[11px] text-[#3a3a3a]">{interactions.length} total</span>
      </div>

      {interactions.length === 0 ? (
        <div className="bg-[#111] border border-[#1f1f1f] rounded-[12px] px-4 py-6 text-center">
          <p className="text-[13px] text-[#444]">No interactions logged yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Show newest first */}
          {[...interactions].reverse().map((entry, idx) => (
            <InteractionEntry key={entry.id} entry={entry} isLatest={idx === 0} />
          ))}
        </div>
      )}

      <button
        onClick={onAddInteraction}
        className="mt-3 w-full flex items-center justify-center gap-2 h-10 bg-[#111] border border-dashed
          border-[#2a2a2a] rounded-[10px] text-[13px] text-[#555] hover:text-[#e5e5e5] hover:border-[#3a3a3a]
          transition-all active:scale-[0.98]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add interaction
      </button>
    </div>
  )
}

function InteractionEntry({ entry, isLatest }) {
  const [showRaw, setShowRaw] = useState(false)

  return (
    <div className={`bg-[#111] border rounded-[12px] overflow-hidden transition-colors
      ${isLatest ? 'border-[#2a2a2a]' : 'border-[#1f1f1f]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a1a1a]">
        <span className="text-[12px] font-medium text-[#888]">{formatDateLong(entry.date)}</span>
        {isLatest && (
          <span className="text-[10px] text-[#c8a97e] font-medium uppercase tracking-wider">Latest</span>
        )}
      </div>

      {/* Discussion */}
      <div className="px-4 py-3">
        <p className="text-[13px] text-[#ccc] leading-relaxed">{entry.discussion}</p>
      </div>

      {/* Follow-up */}
      {entry.follow_up && (
        <div className="px-4 pb-3 flex items-start gap-2">
          <FlagIcon className="text-[#c8a97e] mt-0.5 flex-shrink-0" size={12} />
          <p className="text-[12px] text-[#c8a97e] leading-relaxed">{entry.follow_up}</p>
        </div>
      )}

      {/* Show raw note toggle */}
      {entry.raw_note && (
        <div className="border-t border-[#1a1a1a]">
          <button
            onClick={() => setShowRaw(v => !v)}
            className="w-full flex items-center gap-2 px-4 py-2 text-[11px] text-[#444] hover:text-[#666] transition-colors"
          >
            <svg
              width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`transition-transform ${showRaw ? 'rotate-90' : ''}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {showRaw ? 'Hide raw note' : 'Show raw note'}
          </button>
          {showRaw && (
            <div className="px-4 pb-3">
              <p className="text-[12px] text-[#444] leading-relaxed italic font-mono whitespace-pre-wrap">
                {entry.raw_note}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Add Interaction bottom sheet ──────────────────────────────────────────────
function AddInteractionSheet({ contactId, onSave, onClose }) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const { listening, supported: speechSupported, toggle: toggleSpeech } = useSpeech(
    useCallback(transcript => {
      setText(t => t ? `${t} ${transcript}` : transcript)
    }, [])
  )

  async function handleStructureAndSave() {
    if (!text.trim()) return
    setLoading(true)
    // Simulate 1s Claude structuring
    await new Promise(r => setTimeout(r, 1000))
    const entry = addMockInteraction(contactId, {
      date,
      discussion: text.length > 100 ? text.slice(0, 100) + '…' : text,
      follow_up: null,
      raw_note: text,
    })
    setLoading(false)
    onSave(entry)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#111] border-t border-[#2a2a2a] rounded-t-[20px] p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-[#e5e5e5]">Add Interaction</h3>
          <button onClick={onClose} className="text-[#555] hover:text-[#888] text-xl leading-none">×</button>
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-[#555] uppercase tracking-wider">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-[8px] px-3 h-10 text-[14px]
              text-[#e5e5e5] outline-none focus:border-[#c8a97e]/50"
          />
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-[#555] uppercase tracking-wider">Notes</label>
            {speechSupported && (
              <button
                onClick={toggleSpeech}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] transition-all
                  ${listening
                    ? 'bg-[#e05c5c]/20 text-[#e05c5c] border border-[#e05c5c]/30'
                    : 'bg-[#1a1a1a] text-[#888] border border-[#2a2a2a] hover:text-[#e5e5e5]'}`}
              >
                {listening ? (
                  <><span className="w-2 h-2 rounded-full bg-[#e05c5c] animate-pulse" /> Stop</>
                ) : (
                  <><MicIcon /> Dictate</>
                )}
              </button>
            )}
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="What was discussed, any follow-up actions…"
            rows={4}
            autoFocus
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-[8px] px-3 py-2.5 text-[14px]
              text-[#e5e5e5] placeholder-[#444] outline-none focus:border-[#c8a97e]/50 resize-none"
          />
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleStructureAndSave}
          loading={loading}
          disabled={!text.trim()}
        >
          Structure & Save
        </Button>
      </div>
    </>
  )
}

// ── Shared subcomponents ──────────────────────────────────────────────────────
function InfoSection({ title, children }) {
  const kids = Array.isArray(children) ? children : [children]
  const hasContent = kids.some(c => c && c.props?.value)
  if (!hasContent) return null

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-[12px] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[#1f1f1f]">
        <h3 className="text-[11px] font-semibold text-[#444] uppercase tracking-wider">{title}</h3>
      </div>
      <div className="divide-y divide-[#1a1a1a]">{children}</div>
    </div>
  )
}

function InfoRow({ label, value, href }) {
  if (!value) return null
  return (
    <div className="px-4 py-2.5 flex flex-col gap-0.5">
      <span className="text-[10px] text-[#444] uppercase tracking-wider">{label}</span>
      {href ? (
        <a href={href} className="text-[13px] text-[#c8a97e] leading-relaxed underline decoration-[#444] underline-offset-2">
          {value}
        </a>
      ) : (
        <span className="text-[13px] text-[#e5e5e5] leading-relaxed">{value}</span>
      )}
    </div>
  )
}

function BackButton({ onClick }) {
  return (
    <button onClick={onClick} className="text-[#888] flex items-center gap-1 text-[14px] hover:text-[#e5e5e5] transition-colors">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Back
    </button>
  )
}

function MailIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
}
function PhoneIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.02-.93a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
}
function FlagIcon({ className = 'text-[#555]', size = 13 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
}
function MicIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
}

function formatDateLong(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
