import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Layout, { TopBar } from '../components/Layout.jsx'
import Button from '../components/Button.jsx'
import CameraCapture from '../components/CameraCapture.jsx'
import Field, { SelectField, TagsField } from '../components/Field.jsx'
import { extractCardData, structureNotes, fileToBase64 } from '../lib/claude.js'
import { saveContact, getContact, uploadCardImage } from '../lib/supabase.js'
import useSpeech from '../hooks/useSpeech.js'

const INDUSTRIES = ['Shipping', 'Legal', 'Finance', 'Government', 'Port Authority', 'Technology', 'Insurance', 'Trade Association', 'Academic', 'Other']
const RELATIONSHIP_TYPES = ['Client', 'Counterparty', 'Regulator', 'Industry peer', 'Vendor/supplier', 'Advisor/counsel', 'Internal colleague', 'Investor', 'Media', 'Other']
const GEOGRAPHIES = ['Singapore', 'China', 'Europe', 'Middle East', 'South Asia', 'Southeast Asia', 'Americas', 'Africa', 'Global']
const HOW_MET_OPTIONS = ['Conference', 'Board/committee meeting', 'Intro by third party', 'Cold outreach', 'Event', 'Social', 'Other']

const STEP = {
  MANUAL_ENTRY: 'manual_entry',
  CAPTURE_FRONT: 'capture_front',
  CAPTURE_BACK_PROMPT: 'capture_back_prompt',
  CAPTURE_BACK: 'capture_back',
  EXTRACTING: 'extracting',
  REVIEW: 'review',
  NOTES: 'notes',
  STRUCTURING: 'structuring',
  SAVING: 'saving',
}

const MOCK_FILL = {
  name: 'James Tan', title: 'CEO', company: 'Pacific Carriers',
  industry: 'Shipping', geography: 'Singapore', relationship_type: 'Industry peer',
  where_met: 'Singapore Maritime Week', tags: ['bulk-cargo', 'singapore'],
}

export default function AddContact() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)
  const mode = searchParams.get('mode')

  const initialStep = isEdit ? STEP.REVIEW : (mode === 'manual' ? STEP.MANUAL_ENTRY : STEP.CAPTURE_FRONT)
  const [step, setStep] = useState(initialStep)

  const [frontFile, setFrontFile] = useState(null)
  const [backFile, setBackFile] = useState(null)
  const [frontPreview, setFrontPreview] = useState(null)
  const [backPreview, setBackPreview] = useState(null)
  const [error, setError] = useState(null)

  const emptyFields = {
    name: '', alternate_name: '', title: '', company: '',
    email: '', phone: '', alternate_messenger: '', address: '',
    where_met: '', industry: '', relationship_type: '', geography: '',
    how_met: '', tags: [], date_met: new Date().toISOString().split('T')[0],
    card_front_url: '', card_back_url: '',
    notes_raw: '', notes_structured: null, follow_up_flag: false,
  }
  const [fields, setFields] = useState(emptyFields)

  useEffect(() => {
    if (isEdit && id) {
      getContact(id).then(contact => {
        setFields({ ...contact, tags: contact.tags || [], notes_raw: contact.notes_raw || '' })
        if (contact.card_front_url) setFrontPreview(contact.card_front_url)
        if (contact.card_back_url) setBackPreview(contact.card_back_url)
      }).catch(() => navigate('/'))
    }
  }, [id, isEdit])

  const set = useCallback(key => val => setFields(f => ({ ...f, [key]: val })), [])

  const { listening, supported: speechSupported, toggle: toggleSpeech } = useSpeech(
    useCallback(transcript => {
      setFields(f => ({ ...f, notes_raw: f.notes_raw ? `${f.notes_raw} ${transcript}` : transcript }))
    }, [])
  )

  async function handleFrontCapture(file, preview) {
    setFrontFile(file); setFrontPreview(preview)
    setStep(STEP.CAPTURE_BACK_PROMPT)
  }

  async function handleBackCapture(file, preview) {
    setBackFile(file); setBackPreview(preview)
    await runExtraction(frontFile, file)
  }

  async function runExtraction(front, back) {
    setStep(STEP.EXTRACTING); setError(null)
    try {
      const frontB64 = await fileToBase64(front)
      const backB64 = back ? await fileToBase64(back) : null
      const extracted = await extractCardData(frontB64, backB64)
      setFields(f => ({
        ...f,
        name: extracted.name || '', alternate_name: extracted.alternate_name || '',
        title: extracted.title || '', company: extracted.company || '',
        email: extracted.email || '', phone: extracted.phone || '',
        alternate_messenger: extracted.alternate_messenger || '', address: extracted.address || '',
        industry: extracted.industry || '', relationship_type: extracted.relationship_type || '',
        geography: extracted.geography || '', tags: extracted.tags || [],
      }))
      setStep(STEP.REVIEW)
    } catch (err) { setError(err.message); setStep(STEP.REVIEW) }
  }

  async function handleSave() {
    setStep(STEP.SAVING)
    try {
      const contactId = id || crypto.randomUUID()
      let frontUrl = fields.card_front_url
      let backUrl = fields.card_back_url
      if (frontFile) { try { frontUrl = await uploadCardImage(frontFile, contactId, 'front') } catch {} }
      if (backFile) { try { backUrl = await uploadCardImage(backFile, contactId, 'back') } catch {} }
      const contact = { ...fields, id: isEdit ? id : contactId, card_front_url: frontUrl, card_back_url: backUrl, date_met: fields.date_met || new Date().toISOString().split('T')[0] }
      const saved = await saveContact(contact)
      navigate(`/contact/${saved.id}`, { replace: true })
    } catch (err) { setError(err.message); setStep(STEP.NOTES) }
  }

  // ── Camera ────────────────────────────────────────────────────────────────
  if (step === STEP.CAPTURE_FRONT)
    return <CameraCapture title="Card Front" onCapture={handleFrontCapture} onCancel={() => navigate(-1)} />
  if (step === STEP.CAPTURE_BACK)
    return <CameraCapture title="Card Back" onCapture={handleBackCapture} onCancel={() => runExtraction(frontFile, null)} />

  // ── Loading ───────────────────────────────────────────────────────────────
  if ([STEP.EXTRACTING, STEP.STRUCTURING, STEP.SAVING].includes(step)) {
    const msg = { [STEP.EXTRACTING]: 'Extracting card details…', [STEP.STRUCTURING]: 'Structuring notes…', [STEP.SAVING]: 'Saving…' }[step]
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center gap-5">
          <div className="flex gap-2">
            {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: `bdots 1s ease-in-out ${i * 0.2}s infinite` }} />)}
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>{msg}</p>
        </div>
      </Layout>
    )
  }

  // ── Back prompt ───────────────────────────────────────────────────────────
  if (step === STEP.CAPTURE_BACK_PROMPT) {
    return (
      <Layout>
        <TopBar title="Card back?" titleFont="body" left={<TextBtn onClick={() => setStep(STEP.CAPTURE_FRONT)}>← Retake</TextBtn>} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          {frontPreview && (
            <div style={{ width: '100%', maxWidth: 340, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 2px 8px var(--shadow)' }}>
              <img src={frontPreview} alt="Card front" className="w-full" />
            </div>
          )}
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', textAlign: 'center' }}>
            Capture the back for alternate name and extra details?
          </p>
          <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 300 }}>
            <Button variant="primary" size="lg" fullWidth onClick={() => setStep(STEP.CAPTURE_BACK)}>Capture Back</Button>
            <Button variant="secondary" size="lg" fullWidth onClick={() => runExtraction(frontFile, null)}>Skip</Button>
          </div>
        </div>
      </Layout>
    )
  }

  // ── Manual entry with tabs ────────────────────────────────────────────────
  if (step === STEP.MANUAL_ENTRY) {
    return (
      <ManualEntryScreen
        fields={fields}
        setFields={setFields}
        set={set}
        onSave={handleSave}
        onCancel={() => navigate(-1)}
      />
    )
  }

  // ── Notes step ────────────────────────────────────────────────────────────
  if (step === STEP.NOTES) {
    const structured = fields.notes_structured
    return (
      <Layout>
        <TopBar title={isEdit ? 'Edit Notes' : 'Notes'} titleFont="body"
          left={<TextBtn onClick={() => setStep(STEP.REVIEW)}>← Back</TextBtn>}
          right={<AccentBtn onClick={handleSave}>Save</AccentBtn>} />
        <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-6 pb-10">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <SectionLabel>Raw Notes</SectionLabel>
              {speechSupported && <MicButton listening={listening} onToggle={toggleSpeech} />}
            </div>
            <textarea value={fields.notes_raw} onChange={e => set('notes_raw')(e.target.value)}
              placeholder="Where you met, what you discussed, follow-up actions…"
              rows={5}
              style={{ width: '100%', background: '#ffffff', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', outline: 'none', resize: 'none', lineHeight: 1.5 }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(138,104,48,0.12)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
          {structured && (
            <div>
              <div className="flex items-center gap-3" style={{ marginBottom: 14 }}>
                <SectionLabel>Structured</SectionLabel>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              <div className="flex flex-col" style={{ gap: 14 }}>
                <Field label="Where Met" value={structured.where_met} onChange={v => setFields(f => ({ ...f, notes_structured: { ...f.notes_structured, where_met: v } }))} />
                <Field label="Discussion" value={structured.discussion} onChange={v => setFields(f => ({ ...f, notes_structured: { ...f.notes_structured, discussion: v } }))} multiline />
                <Field label="Personal Notes" value={structured.personal_notes} onChange={v => setFields(f => ({ ...f, notes_structured: { ...f.notes_structured, personal_notes: v } }))} multiline />
                <Field label="Follow-up Action" value={structured.follow_up_action} onChange={v => setFields(f => ({ ...f, notes_structured: { ...f.notes_structured, follow_up_action: v } }))} />
              </div>
            </div>
          )}
          <Button variant="primary" size="lg" fullWidth onClick={handleSave}>Save Contact</Button>
        </div>
      </Layout>
    )
  }

  // ── Review step (scan flow + edit) ────────────────────────────────────────
  return (
    <Layout>
      <TopBar title={isEdit ? 'Edit Contact' : 'Review'} titleFont="body"
        left={<TextBtn onClick={() => navigate(-1)}>{isEdit ? '← Back' : 'Cancel'}</TextBtn>}
        right={<AccentBtn onClick={() => setStep(STEP.NOTES)}>Next →</AccentBtn>} />
      <div className="flex-1 overflow-y-auto">
        {(frontPreview || backPreview) && (
          <div className="flex gap-2 px-4 pt-4">
            {frontPreview && <div style={{ flex: 1, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', maxHeight: 100 }}><img src={frontPreview} alt="Front" className="w-full h-full object-cover" /></div>}
            {backPreview && <div style={{ flex: 1, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', maxHeight: 100 }}><img src={backPreview} alt="Back" className="w-full h-full object-cover" /></div>}
          </div>
        )}
        {error && <div className="px-4 mt-3"><ErrorBanner>{error} — fill in manually.</ErrorBanner></div>}
        <ReviewForm fields={fields} set={set} onNext={() => setStep(STEP.NOTES)} />
      </div>
    </Layout>
  )
}

// ── Manual entry screen with Free text / Form tabs ────────────────────────────
function ManualEntryScreen({ fields, setFields, set, onSave, onCancel }) {
  const [tab, setTab] = useState('freetext')
  const [freeText, setFreeText] = useState('')
  const [filling, setFilling] = useState(false)
  const [saving, setSaving] = useState(false)

  const { listening, supported: speechSupported, toggle: toggleSpeech } = useSpeech(
    useCallback(transcript => { setFreeText(t => t ? `${t} ${transcript}` : transcript) }, [])
  )

  async function handleFillForm() {
    if (!freeText.trim()) return
    setFilling(true)
    await new Promise(r => setTimeout(r, 1000))
    // Mock: populate with simulated Claude extraction
    setFields(f => ({ ...f, ...MOCK_FILL }))
    setFilling(false)
    setTab('form')
  }

  async function handleSave() {
    setSaving(true)
    await onSave()
    setSaving(false)
  }

  return (
    <Layout>
      <TopBar
        title="Add Contact"
        titleFont="body"
        left={<TextBtn onClick={onCancel}>Cancel</TextBtn>}
      />

      {/* Tabs */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '10px 16px 0' }}>
        <div className="flex gap-1">
          {[{ id: 'freetext', label: 'Free text' }, { id: 'form', label: 'Form' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: '8px 16px', fontSize: 14, fontFamily: 'var(--font-body)',
                fontWeight: tab === t.id ? 600 : 400,
                color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: `2px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`,
                background: 'transparent',
                transition: 'all 150ms',
              }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'freetext' ? (
          <div className="px-4 py-5 flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
                  Describe the contact freely. The app will fill in the form.
                </p>
                {speechSupported && <MicButton listening={listening} onToggle={toggleSpeech} />}
              </div>
              <textarea
                value={freeText}
                onChange={e => setFreeText(e.target.value)}
                placeholder="Describe the contact freely — name, company, role, where you met, anything you know. The app will fill in the form."
                rows={8}
                autoFocus
                style={{ width: '100%', background: '#ffffff', border: '1px solid var(--border)', borderRadius: 10, padding: '14px', fontSize: 15, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', outline: 'none', resize: 'none', lineHeight: 1.6, boxShadow: '0 1px 3px var(--shadow)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(138,104,48,0.12)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = '0 1px 3px var(--shadow)' }}
              />
            </div>
            <Button variant="primary" size="lg" fullWidth onClick={handleFillForm} loading={filling} disabled={!freeText.trim()}>
              Fill form
            </Button>
            <button onClick={() => setTab('form')}
              style={{ fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)', textAlign: 'center' }}>
              Skip — fill form manually
            </button>
          </div>
        ) : (
          <div>
            <ReviewForm fields={fields} set={set} />
            <div className="px-4 pb-10">
              <Button variant="primary" size="lg" fullWidth onClick={handleSave} loading={saving}>Save Contact</Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

// ── Shared form used by both scan review and manual form tab ──────────────────
function ReviewForm({ fields, set, onNext }) {
  return (
    <div className="px-4 py-5 flex flex-col" style={{ gap: 28 }}>
      <FormSection title="Contact">
        <Field label="Name" value={fields.name} onChange={set('name')} />
        <Field label="Other Name / Script" value={fields.alternate_name} onChange={set('alternate_name')} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Title" value={fields.title} onChange={set('title')} />
          <Field label="Company" value={fields.company} onChange={set('company')} />
          <Field label="Email" value={fields.email} onChange={set('email')} type="email" />
          <Field label="Phone" value={fields.phone} onChange={set('phone')} type="tel" />
        </div>
        <Field label="Messenger" value={fields.alternate_messenger} onChange={set('alternate_messenger')} placeholder="WeChat / LINE / WhatsApp" />
        <Field label="Address" value={fields.address} onChange={set('address')} />
      </FormSection>

      <FormSection title="Context">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date Met" value={fields.date_met} onChange={set('date_met')} type="date" />
          <SelectField label="How Met" value={fields.how_met} onChange={set('how_met')} options={HOW_MET_OPTIONS} />
        </div>
        <Field label="Where Met" value={fields.where_met} onChange={set('where_met')} placeholder="Event name, city, context…" />
      </FormSection>

      <FormSection title="Classification">
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Industry" value={fields.industry} onChange={set('industry')} options={INDUSTRIES} />
          <SelectField label="Geography" value={fields.geography} onChange={set('geography')} options={GEOGRAPHIES} />
        </div>
        <SelectField label="Relationship" value={fields.relationship_type} onChange={set('relationship_type')} options={RELATIONSHIP_TYPES} />
        <TagsField label="Tags" tags={fields.tags} onChange={set('tags')} />
      </FormSection>

      <div className="flex items-center justify-between"
        style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', boxShadow: '0 1px 2px var(--shadow)' }}>
        <div>
          <p style={{ fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>Follow-up needed</p>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)', marginTop: 2 }}>Flag for follow-up action</p>
        </div>
        <Toggle value={fields.follow_up_flag} onChange={set('follow_up_flag')} />
      </div>

      {onNext && (
        <Button variant="primary" size="lg" fullWidth onClick={onNext}>
          Continue to Notes →
        </Button>
      )}
    </div>
  )
}

// ── Subcomponents ─────────────────────────────────────────────────────────────
function FormSection({ title, children }) {
  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 12, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>{title}</h3>
      <div className="flex flex-col" style={{ gap: 12 }}>{children}</div>
    </div>
  )
}

function SectionLabel({ children }) {
  return <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}>{children}</span>
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)}
      style={{ width: 48, height: 26, borderRadius: 13, background: value ? 'var(--accent)' : 'var(--border)', border: 'none', position: 'relative', transition: 'all 200ms', flexShrink: 0, cursor: 'pointer' }}>
      <span style={{ position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%', background: '#ffffff', left: value ? 25 : 3, transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  )
}

function MicButton({ listening, onToggle }) {
  return (
    <button onClick={onToggle} className="flex items-center gap-1.5 flex-shrink-0"
      style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontFamily: 'var(--font-body)', border: `1px solid ${listening ? 'rgba(192,97,74,0.4)' : 'var(--border)'}`, background: listening ? 'rgba(192,97,74,0.08)' : 'var(--bg-secondary)', color: listening ? 'var(--accent-danger)' : 'var(--text-secondary)', transition: 'all 150ms', whiteSpace: 'nowrap' }}>
      {listening
        ? <><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-danger)', display: 'inline-block' }} /> Stop</>
        : <><MicIconSm /> Dictate</>}
    </button>
  )
}

function TextBtn({ onClick, children }) {
  return <button onClick={onClick} style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>{children}</button>
}

function AccentBtn({ onClick, children }) {
  return <button onClick={onClick} style={{ fontSize: 14, color: 'var(--accent)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{children}</button>
}

function ErrorBanner({ children }) {
  return <div style={{ background: 'rgba(192,97,74,0.08)', border: '1px solid rgba(192,97,74,0.25)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--accent-danger)', fontFamily: 'var(--font-body)' }}>{children}</div>
}

function MicIconSm() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
}
