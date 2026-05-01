import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout, { TopBar } from '../components/Layout.jsx'
import Button from '../components/Button.jsx'
import { getContact, toggleFollowUp, deleteContact } from '../lib/supabase.js'

export default function ContactDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [contact, setContact] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imageViewer, setImageViewer] = useState(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getContact(id)
      .then(setContact)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleToggleFollowUp() {
    if (!contact) return
    const next = !contact.follow_up_flag
    setContact((c) => ({ ...c, follow_up_flag: next }))
    try {
      await toggleFollowUp(id, contact.follow_up_flag)
    } catch {
      setContact((c) => ({ ...c, follow_up_flag: contact.follow_up_flag }))
    }
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

  if (loading) {
    return (
      <Layout>
        <TopBar title="" left={<BackButton onClick={() => navigate(-1)} />} />
        <div className="px-4 pt-4 flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 skeleton rounded-[10px]" />
          ))}
        </div>
      </Layout>
    )
  }

  if (!contact) return null

  const structured = contact.notes_structured

  return (
    <Layout>
      {imageViewer && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setImageViewer(null)}
        >
          <img src={imageViewer} alt="Card" className="max-w-full max-h-full rounded-[8px]" />
          <button className="absolute top-4 right-4 text-white/50 hover:text-white text-[24px] leading-none">×</button>
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end">
          <div className="w-full bg-[#111] border-t border-[#2a2a2a] rounded-t-[16px] p-5 flex flex-col gap-3">
            <h3 className="text-[16px] font-semibold text-[#e5e5e5]">Delete contact?</h3>
            <p className="text-[13px] text-[#555]">This cannot be undone.</p>
            <Button variant="danger" fullWidth onClick={handleDelete} loading={deleting}>
              Delete {contact.name}
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <TopBar
        title={contact.name || 'Contact'}
        subtitle={[contact.title, contact.company].filter(Boolean).join(' · ')}
        left={<BackButton onClick={() => navigate('/')} />}
        right={
          <button
            onClick={() => navigate(`/contact/${id}/edit`)}
            className="text-[#c8a97e] text-[14px] font-medium"
          >
            Edit
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Card images */}
        {(contact.card_front_url || contact.card_back_url) && (
          <div className="flex gap-2 px-4 pt-4">
            {contact.card_front_url && (
              <button
                className="flex-1 rounded-[10px] overflow-hidden border border-[#2a2a2a] h-28 active:opacity-80"
                onClick={() => setImageViewer(contact.card_front_url)}
              >
                <img src={contact.card_front_url} alt="Card front" className="w-full h-full object-cover" />
              </button>
            )}
            {contact.card_back_url && (
              <button
                className="flex-1 rounded-[10px] overflow-hidden border border-[#2a2a2a] h-28 active:opacity-80"
                onClick={() => setImageViewer(contact.card_back_url)}
              >
                <img src={contact.card_back_url} alt="Card back" className="w-full h-full object-cover" />
              </button>
            )}
          </div>
        )}

        <div className="px-4 py-4 flex flex-col gap-5">
          {/* Quick actions */}
          <div className="flex gap-2">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex-1 flex items-center justify-center gap-2 h-10 bg-[#111] border border-[#2a2a2a]
                  rounded-[10px] text-[13px] text-[#e5e5e5] hover:border-[#3a3a3a] transition-colors active:scale-[0.97]"
              >
                <MailIcon />
                Email
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="flex-1 flex items-center justify-center gap-2 h-10 bg-[#111] border border-[#2a2a2a]
                  rounded-[10px] text-[13px] text-[#e5e5e5] hover:border-[#3a3a3a] transition-colors active:scale-[0.97]"
              >
                <PhoneIcon />
                Call
              </a>
            )}
            <button
              onClick={handleToggleFollowUp}
              className={`flex items-center justify-center gap-1.5 px-3 h-10 rounded-[10px] text-[13px] border transition-all
                ${contact.follow_up_flag
                  ? 'bg-[#c8a97e]/15 border-[#c8a97e]/40 text-[#c8a97e]'
                  : 'bg-[#111] border-[#2a2a2a] text-[#555] hover:text-[#888]'}`}
            >
              <FlagIcon />
              {contact.follow_up_flag ? 'Flagged' : 'Flag'}
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
            <InfoRow label="Date Met" value={contact.date_met && formatDate(contact.date_met)} />
            <InfoRow label="Where Met" value={contact.where_met} />
            <InfoRow label="How Met" value={contact.how_met} />
          </InfoSection>

          {/* Classification */}
          <InfoSection title="Classification">
            <InfoRow label="Industry" value={contact.industry} />
            <InfoRow label="Relationship" value={contact.relationship_type} />
            <InfoRow label="Geography" value={contact.geography} />
            {contact.tags?.length > 0 && (
              <div className="py-2 border-b border-[#1f1f1f] last:border-0">
                <span className="text-[11px] text-[#444] uppercase tracking-wider block mb-1.5">Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {contact.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full text-[12px] text-[#888]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </InfoSection>

          {/* Structured notes */}
          {structured && (
            <InfoSection title="Notes">
              {structured.where_met && <InfoRow label="Where Met" value={structured.where_met} />}
              {structured.discussion && <InfoRow label="Discussion" value={structured.discussion} multiline />}
              {structured.personal_notes && <InfoRow label="Personal Notes" value={structured.personal_notes} multiline />}
              {structured.follow_up_action && (
                <InfoRow label="Follow-up" value={structured.follow_up_action} multiline accent />
              )}
            </InfoSection>
          )}

          {/* Raw notes */}
          {contact.notes_raw && (
            <InfoSection title="Raw Notes">
              <p className="text-[13px] text-[#666] leading-relaxed whitespace-pre-wrap">{contact.notes_raw}</p>
            </InfoSection>
          )}

          {/* Delete */}
          <div className="pt-2">
            <button
              onClick={() => setShowDelete(true)}
              className="w-full py-3 text-[#555] text-[13px] hover:text-[#e05c5c] transition-colors"
            >
              Delete contact
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

function InfoSection({ title, children }) {
  const hasContent = Array.isArray(children)
    ? children.some(c => c && c.props?.value)
    : Boolean(children)

  if (!hasContent && Array.isArray(children)) return null

  return (
    <div className="flex flex-col gap-0 bg-[#111] border border-[#1f1f1f] rounded-[12px] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[#1f1f1f]">
        <h3 className="text-[11px] font-semibold text-[#444] uppercase tracking-wider">{title}</h3>
      </div>
      <div className="divide-y divide-[#1a1a1a]">{children}</div>
    </div>
  )
}

function InfoRow({ label, value, href, multiline, accent }) {
  if (!value) return null

  const textClass = accent
    ? 'text-[13px] text-[#c8a97e] leading-relaxed'
    : 'text-[13px] text-[#e5e5e5] leading-relaxed'

  const content = href ? (
    <a href={href} className={`${textClass} underline decoration-[#444] underline-offset-2`}>
      {value}
    </a>
  ) : (
    <span className={`${textClass} ${multiline ? 'whitespace-pre-wrap' : ''}`}>{value}</span>
  )

  return (
    <div className="px-4 py-2.5 flex flex-col gap-0.5">
      <span className="text-[10px] text-[#444] uppercase tracking-wider">{label}</span>
      {content}
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
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.02-.93a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function FlagIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  )
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
