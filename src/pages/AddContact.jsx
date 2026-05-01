import { useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout, { TopBar } from '../components/Layout.jsx'
import Button from '../components/Button.jsx'
import CameraCapture from '../components/CameraCapture.jsx'
import Field, { SelectField, TagsField } from '../components/Field.jsx'
import { extractCardData, structureNotes, fileToBase64 } from '../lib/claude.js'
import { saveContact, getContact, uploadCardImage } from '../lib/supabase.js'
import useSpeech from '../hooks/useSpeech.js'
import { useEffect } from 'react'

const INDUSTRIES = ['Shipping', 'Legal', 'Finance', 'Government', 'Port Authority', 'Technology', 'Insurance', 'Trade Association', 'Academic', 'Other']
const RELATIONSHIP_TYPES = ['Client', 'Counterparty', 'Regulator', 'Industry peer', 'Vendor/supplier', 'Advisor/counsel', 'Internal colleague', 'Investor', 'Media', 'Other']
const GEOGRAPHIES = ['Singapore', 'China', 'Europe', 'Middle East', 'South Asia', 'Southeast Asia', 'Americas', 'Africa', 'Global']
const HOW_MET_OPTIONS = ['Conference', 'Board/committee meeting', 'Intro by third party', 'Cold outreach', 'Event', 'Social', 'Other']

// Steps in the add flow
const STEP = {
  CAPTURE_FRONT: 'capture_front',
  CAPTURE_BACK_PROMPT: 'capture_back_prompt',
  CAPTURE_BACK: 'capture_back',
  EXTRACTING: 'extracting',
  REVIEW: 'review',
  NOTES: 'notes',
  STRUCTURING: 'structuring',
  SAVING: 'saving',
}

export default function AddContact() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [step, setStep] = useState(isEdit ? STEP.REVIEW : STEP.CAPTURE_FRONT)
  const [frontFile, setFrontFile] = useState(null)
  const [backFile, setBackFile] = useState(null)
  const [frontPreview, setFrontPreview] = useState(null)
  const [backPreview, setBackPreview] = useState(null)

  const [fields, setFields] = useState({
    name: '', alternate_name: '', title: '', company: '',
    email: '', phone: '', alternate_messenger: '', address: '',
    where_met: '', industry: '', relationship_type: '', geography: '',
    how_met: '', tags: [], date_met: new Date().toISOString().split('T')[0],
    card_front_url: '', card_back_url: '',
    notes_raw: '', notes_structured: null, follow_up_flag: false,
  })

  const [error, setError] = useState(null)

  // Load existing contact in edit mode
  useEffect(() => {
    if (isEdit && id) {
      getContact(id).then((contact) => {
        setFields({
          ...contact,
          tags: contact.tags || [],
          notes_raw: contact.notes_raw || '',
        })
        if (contact.card_front_url) setFrontPreview(contact.card_front_url)
        if (contact.card_back_url) setBackPreview(contact.card_back_url)
      }).catch(() => navigate('/'))
    }
  }, [id, isEdit])

  const set = useCallback((key) => (val) => setFields((f) => ({ ...f, [key]: val })), [])

  // Speech for notes
  const { listening, supported: speechSupported, toggle: toggleSpeech } = useSpeech(
    useCallback((transcript) => {
      setFields((f) => ({
        ...f,
        notes_raw: f.notes_raw ? `${f.notes_raw} ${transcript}` : transcript,
      }))
    }, [])
  )

  async function handleFrontCapture(file, preview) {
    setFrontFile(file)
    setFrontPreview(preview)
    setStep(STEP.CAPTURE_BACK_PROMPT)
  }

  async function handleBackCapture(file, preview) {
    setBackFile(file)
    setBackPreview(preview)
    await runExtraction(frontFile, file)
  }

  async function runExtraction(front, back) {
    setStep(STEP.EXTRACTING)
    setError(null)
    try {
      const frontB64 = await fileToBase64(front)
      const backB64 = back ? await fileToBase64(back) : null
      const extracted = await extractCardData(frontB64, backB64)
      setFields((f) => ({
        ...f,
        name: extracted.name || '',
        alternate_name: extracted.alternate_name || '',
        title: extracted.title || '',
        company: extracted.company || '',
        email: extracted.email || '',
        phone: extracted.phone || '',
        alternate_messenger: extracted.alternate_messenger || '',
        address: extracted.address || '',
        industry: extracted.industry || '',
        relationship_type: extracted.relationship_type || '',
        geography: extracted.geography || '',
        tags: extracted.tags || [],
      }))
      setStep(STEP.REVIEW)
    } catch (err) {
      setError(err.message)
      setStep(STEP.REVIEW)
    }
  }

  async function handleStructureNotes() {
    if (!fields.notes_raw?.trim()) {
      await handleSave()
      return
    }
    setStep(STEP.STRUCTURING)
    try {
      const structured = await structureNotes(fields.notes_raw)
      setFields((f) => ({ ...f, notes_structured: structured }))
      setStep(STEP.NOTES)
    } catch {
      setStep(STEP.NOTES)
    }
  }

  async function handleSave() {
    setStep(STEP.SAVING)
    try {
      const contactId = id || crypto.randomUUID()
      let frontUrl = fields.card_front_url
      let backUrl = fields.card_back_url

      if (frontFile) {
        try { frontUrl = await uploadCardImage(frontFile, contactId, 'front') }
        catch { /* save without image */ }
      }
      if (backFile) {
        try { backUrl = await uploadCardImage(backFile, contactId, 'back') }
        catch { /* save without image */ }
      }

      const contact = {
        ...fields,
        id: isEdit ? id : contactId,
        card_front_url: frontUrl,
        card_back_url: backUrl,
        date_met: fields.date_met || new Date().toISOString().split('T')[0],
      }

      const saved = await saveContact(contact)
      navigate(`/contact/${saved.id}`, { replace: true })
    } catch (err) {
      setError(err.message)
      setStep(STEP.NOTES)
    }
  }

  // Render camera flows
  if (step === STEP.CAPTURE_FRONT) {
    return (
      <CameraCapture
        title="Card Front"
        onCapture={handleFrontCapture}
        onCancel={() => navigate(-1)}
      />
    )
  }

  if (step === STEP.CAPTURE_BACK) {
    return (
      <CameraCapture
        title="Card Back"
        onCapture={handleBackCapture}
        onCancel={() => runExtraction(frontFile, null)}
      />
    )
  }

  if (step === STEP.EXTRACTING || step === STEP.STRUCTURING || step === STEP.SAVING) {
    const messages = {
      [STEP.EXTRACTING]: 'Extracting card details…',
      [STEP.STRUCTURING]: 'Structuring notes…',
      [STEP.SAVING]: 'Saving contact…',
    }
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[#c8a97e]"
                style={{ animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
          <p className="text-[#555] text-[14px]">{messages[step]}</p>
          <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}}`}</style>
        </div>
      </Layout>
    )
  }

  if (step === STEP.CAPTURE_BACK_PROMPT) {
    return (
      <Layout>
        <TopBar
          title="Card Back?"
          left={
            <button onClick={() => setStep(STEP.CAPTURE_FRONT)} className="text-[#888] text-[14px]">
              ← Back
            </button>
          }
        />
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          {frontPreview && (
            <div className="w-full max-w-sm rounded-xl overflow-hidden border border-[#2a2a2a]">
              <img src={frontPreview} alt="Card front" className="w-full object-cover" />
            </div>
          )}
          <p className="text-[#888] text-[14px] text-center">
            Capture the back of the card for alternate name and extra details?
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button variant="primary" size="lg" fullWidth onClick={() => setStep(STEP.CAPTURE_BACK)}>
              Capture Back
            </Button>
            <Button variant="secondary" size="lg" fullWidth onClick={() => runExtraction(frontFile, null)}>
              Skip
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  if (step === STEP.NOTES) {
    const structured = fields.notes_structured
    return (
      <Layout>
        <TopBar
          title={isEdit ? 'Edit Notes' : 'Notes'}
          left={
            <button onClick={() => setStep(STEP.REVIEW)} className="text-[#888] text-[14px]">
              ← Back
            </button>
          }
          right={
            <button onClick={handleSave} className="text-[#c8a97e] text-[14px] font-medium">
              Save
            </button>
          }
        />
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-8 flex flex-col gap-5">
          {error && (
            <div className="bg-[#3a1a1a] border border-[#4a2020] rounded-[8px] px-3 py-2 text-[#e05c5c] text-[13px]">
              {error}
            </div>
          )}

          {/* Raw notes input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-[#555] uppercase tracking-wider">
                Raw Notes
              </label>
              {speechSupported && (
                <button
                  onClick={toggleSpeech}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] transition-all
                    ${listening
                      ? 'bg-[#e05c5c]/20 text-[#e05c5c] border border-[#e05c5c]/30'
                      : 'bg-[#1a1a1a] text-[#888] border border-[#2a2a2a] hover:text-[#e5e5e5]'}`}
                >
                  {listening ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-[#e05c5c] animate-pulse" />
                      Stop
                    </>
                  ) : (
                    <>
                      <MicIcon />
                      Dictate
                    </>
                  )}
                </button>
              )}
            </div>
            <textarea
              value={fields.notes_raw}
              onChange={(e) => set('notes_raw')(e.target.value)}
              placeholder="Where you met, what you discussed, follow-up actions…"
              rows={5}
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-[8px] px-3 py-2.5 text-[14px]
                text-[#e5e5e5] placeholder-[#444] outline-none focus:border-[#c8a97e]/60 resize-none"
            />
          </div>

          {/* Structured notes if available */}
          {structured && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-[#555] uppercase tracking-wider">Structured</span>
                <div className="h-px flex-1 bg-[#1f1f1f]" />
              </div>
              <Field label="Where Met" value={structured.where_met} onChange={(v) => setFields(f => ({ ...f, notes_structured: { ...f.notes_structured, where_met: v } }))} />
              <Field label="Discussion" value={structured.discussion} onChange={(v) => setFields(f => ({ ...f, notes_structured: { ...f.notes_structured, discussion: v } }))} multiline />
              <Field label="Personal Notes" value={structured.personal_notes} onChange={(v) => setFields(f => ({ ...f, notes_structured: { ...f.notes_structured, personal_notes: v } }))} multiline />
              <Field label="Follow-up Action" value={structured.follow_up_action} onChange={(v) => setFields(f => ({ ...f, notes_structured: { ...f.notes_structured, follow_up_action: v } }))} />
            </div>
          )}

          <Button variant="primary" size="lg" fullWidth onClick={handleSave}>
            Save Contact
          </Button>
        </div>
      </Layout>
    )
  }

  // REVIEW step
  return (
    <Layout>
      <TopBar
        title={isEdit ? 'Edit Contact' : 'Review'}
        left={
          !isEdit ? (
            <button onClick={() => navigate(-1)} className="text-[#888] text-[14px]">
              Cancel
            </button>
          ) : (
            <button onClick={() => navigate(-1)} className="text-[#888] text-[14px]">
              ← Back
            </button>
          )
        }
        right={
          <button
            onClick={() => setStep(STEP.NOTES)}
            className="text-[#c8a97e] text-[14px] font-medium"
          >
            Next →
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto">
        {/* Card image previews */}
        {(frontPreview || backPreview) && (
          <div className="flex gap-2 px-4 pt-4">
            {frontPreview && (
              <div className="flex-1 rounded-[10px] overflow-hidden border border-[#2a2a2a] max-h-28">
                <img src={frontPreview} alt="Front" className="w-full h-full object-cover" />
              </div>
            )}
            {backPreview && (
              <div className="flex-1 rounded-[10px] overflow-hidden border border-[#2a2a2a] max-h-28">
                <img src={backPreview} alt="Back" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mx-4 mt-3 bg-[#3a1a1a] border border-[#4a2020] rounded-[8px] px-3 py-2 text-[#e05c5c] text-[13px]">
            Could not extract from image. Fill in manually. ({error})
          </div>
        )}

        <div className="px-4 py-4 pb-8 flex flex-col gap-6">
          {/* Contact Info */}
          <Section title="Contact">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" value={fields.name} onChange={set('name')} className="col-span-2" />
              <Field label="Other Name / Script" value={fields.alternate_name} onChange={set('alternate_name')} className="col-span-2" />
              <Field label="Title" value={fields.title} onChange={set('title')} />
              <Field label="Company" value={fields.company} onChange={set('company')} />
              <Field label="Email" value={fields.email} onChange={set('email')} type="email" />
              <Field label="Phone" value={fields.phone} onChange={set('phone')} type="tel" />
              <Field label="Messenger" value={fields.alternate_messenger} onChange={set('alternate_messenger')} placeholder="WeChat / LINE / WhatsApp" className="col-span-2" />
              <Field label="Address" value={fields.address} onChange={set('address')} className="col-span-2" />
            </div>
          </Section>

          {/* Context */}
          <Section title="Context">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date Met" value={fields.date_met} onChange={set('date_met')} type="date" />
              <SelectField label="How Met" value={fields.how_met} onChange={set('how_met')} options={HOW_MET_OPTIONS} />
              <Field label="Where Met" value={fields.where_met} onChange={set('where_met')} className="col-span-2" placeholder="Event name, city, context…" />
            </div>
          </Section>

          {/* Claude's Classification */}
          <Section title="Classification" subtitle="Claude's proposals — tap to confirm or change">
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Industry" value={fields.industry} onChange={set('industry')} options={INDUSTRIES} />
              <SelectField label="Geography" value={fields.geography} onChange={set('geography')} options={GEOGRAPHIES} />
              <SelectField label="Relationship" value={fields.relationship_type} onChange={set('relationship_type')} options={RELATIONSHIP_TYPES} className="col-span-2" />
              <div className="col-span-2">
                <TagsField label="Tags" tags={fields.tags} onChange={set('tags')} />
              </div>
            </div>
          </Section>

          {/* Follow-up flag */}
          <div className="flex items-center justify-between bg-[#111] border border-[#2a2a2a] rounded-[10px] px-4 py-3">
            <div>
              <p className="text-[14px] text-[#e5e5e5]">Follow-up needed</p>
              <p className="text-[12px] text-[#555] mt-0.5">Flag for follow-up action</p>
            </div>
            <Toggle value={fields.follow_up_flag} onChange={set('follow_up_flag')} />
          </div>

          <Button variant="primary" size="lg" fullWidth onClick={() => setStep(STEP.NOTES)}>
            Continue to Notes →
          </Button>
        </div>
      </div>
    </Layout>
  )
}

function Section({ title, subtitle, children }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-[12px] font-semibold text-[#555] uppercase tracking-wider">{title}</h2>
        {subtitle && <p className="text-[11px] text-[#444] mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full transition-all duration-200 relative ${value ? 'bg-[#c8a97e]' : 'bg-[#2a2a2a]'}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200
          ${value ? 'left-[26px]' : 'left-0.5'}`}
      />
    </button>
  )
}

function MicIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}
