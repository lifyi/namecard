import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import Layout, { TopBar } from '../components/Layout.jsx'
import Button from '../components/Button.jsx'
import { saveMockContact } from '../lib/mockData.js'

const VALID_INDUSTRIES = ['Shipping', 'Legal', 'Finance', 'Government', 'Port Authority', 'Technology', 'Insurance', 'Trade Association', 'Academic', 'Other']
const VALID_RELATIONSHIPS = ['Client', 'Counterparty', 'Regulator', 'Industry peer', 'Vendor/supplier', 'Advisor/counsel', 'Internal colleague', 'Investor', 'Media', 'Other']
const VALID_GEOGRAPHIES = ['Singapore', 'China', 'Europe', 'Middle East', 'South Asia', 'Southeast Asia', 'Americas', 'Africa', 'Global']

const FIELD_ALIASES = {
  name: ['name', 'full name', 'contact name', 'contact'],
  title: ['title', 'job title', 'position', 'role'],
  company: ['company', 'organization', 'organisation', 'firm', 'employer'],
  email: ['email', 'e-mail', 'email address'],
  phone: ['phone', 'mobile', 'tel', 'telephone', 'phone number'],
  industry: ['industry', 'sector'],
  relationship_type: ['relationship', 'relationship type', 'type'],
  geography: ['geography', 'region', 'location', 'country'],
  where_met: ['where met', 'event', 'met at'],
  tags: ['tags', 'labels', 'keywords'],
  notes_raw: ['notes', 'raw notes', 'note'],
}

function mapHeaders(headers) {
  const map = {}
  headers.forEach(h => {
    const norm = h?.toString().trim().toLowerCase()
    Object.entries(FIELD_ALIASES).forEach(([field, aliases]) => {
      if (aliases.includes(norm) && !map[field]) map[field] = h
    })
  })
  return map
}

function validateRow(row) {
  const issues = []
  if (!row.name?.trim()) issues.push({ field: 'name', level: 'error', msg: 'Missing name' })
  if (!row.company?.trim()) issues.push({ field: 'company', level: 'error', msg: 'Missing company' })
  if (row.industry && !VALID_INDUSTRIES.includes(row.industry)) issues.push({ field: 'industry', level: 'warn', msg: `Unknown industry: "${row.industry}"` })
  if (row.relationship_type && !VALID_RELATIONSHIPS.includes(row.relationship_type)) issues.push({ field: 'relationship_type', level: 'warn', msg: `Unknown relationship: "${row.relationship_type}"` })
  if (row.geography && !VALID_GEOGRAPHIES.includes(row.geography)) issues.push({ field: 'geography', level: 'warn', msg: `Unknown geography: "${row.geography}"` })
  return issues
}

export default function ImportContacts() {
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [rows, setRows] = useState(null)
  const [checked, setChecked] = useState({})
  const [fileName, setFileName] = useState(null)
  const [done, setDone] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [dragging, setDragging] = useState(false)

  function parseFile(file) {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
        if (raw.length < 2) return
        const headers = raw[0]
        const headerMap = mapHeaders(headers)
        const dataRows = raw.slice(1).filter(r => r.some(c => c !== ''))
        const parsed = dataRows.map((r, idx) => {
          const row = {}
          Object.entries(headerMap).forEach(([field, col]) => {
            const ci = headers.indexOf(col)
            row[field] = ci >= 0 ? r[ci]?.toString().trim() || '' : ''
          })
          row.tags = row.tags ? row.tags.split(/[,;]/).map(t => t.trim().toLowerCase()).filter(Boolean) : []
          return { _idx: idx, _issues: validateRow(row), ...row }
        })
        setRows(parsed)
        const init = {}
        parsed.forEach((r, i) => { init[i] = !r._issues.some(v => v.level === 'error') })
        setChecked(init)
      } catch (err) { console.error(err) }
    }
    reader.readAsArrayBuffer(file)
  }

  function handleFile(file) {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(ext)) return
    parseFile(file)
  }

  function toggleRow(idx) { setChecked(c => ({ ...c, [idx]: !c[idx] })) }
  function toggleAll() {
    const allOn = rows.every((_, i) => checked[i])
    const next = {}; rows.forEach((_, i) => { next[i] = !allOn }); setChecked(next)
  }

  function doImport() {
    let count = 0
    rows.forEach((row, i) => {
      if (!checked[i]) return
      const { _idx, _issues, ...contact } = row
      saveMockContact({ ...contact, id: `import-${Date.now()}-${i}`, date_met: new Date().toISOString().split('T')[0], follow_up_flag: false, interactions: [], tags: contact.tags || [] })
      count++
    })
    setImportedCount(count); setDone(true)
  }

  const selectedCount = rows ? rows.filter((_, i) => checked[i]).length : 0
  const cleanCount = rows ? rows.filter((r, i) => checked[i] && r._issues.length === 0).length : 0
  const warnCount = rows ? rows.filter((r, i) => checked[i] && r._issues.some(v => v.level === 'warn')).length : 0
  const errorCount = rows ? rows.filter(r => r._issues.some(v => v.level === 'error')).length : 0

  return (
    <Layout>
      <TopBar
        title="Import Contacts"
        titleFont="body"
        left={
          <button onClick={() => navigate('/')} className="flex items-center gap-1"
            style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            Back
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-10">
        {done ? (
          <SuccessSummary count={importedCount} onDone={() => navigate('/')} />
        ) : !rows ? (
          <div className="p-4 flex flex-col gap-5">
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 12,
                background: dragging ? 'rgba(201,168,108,0.05)' : 'var(--bg-card)',
                padding: '56px 24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                cursor: 'pointer', transition: 'all 150ms',
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UploadIcon />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>Drop a file or tap to browse</p>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)', marginTop: 4 }}>.xlsx, .xls, or .csv</p>
              </div>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            <FormatHint />
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="px-4 pt-4 pb-3 flex flex-col gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>{fileName}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', marginTop: 2 }}>{rows.length} rows found</p>
                </div>
                <button onClick={() => { setRows(null); setFileName(null); setChecked({}) }}
                  style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                  Change file
                </button>
              </div>
              {/* Badges */}
              <div className="flex gap-2">
                <StatusBadge color="#4a9a6a" count={cleanCount} label="Clean" />
                <StatusBadge color="var(--accent)" count={warnCount} label="Warning" />
                <StatusBadge color="var(--accent-danger)" count={errorCount} label="Error" />
              </div>
              <div className="flex items-center justify-between">
                <button onClick={toggleAll} style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                  {rows.every((_, i) => checked[i]) ? 'Deselect all' : 'Select all'}
                </button>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>{selectedCount} selected</span>
              </div>
            </div>

            {/* Rows */}
            <div>
              {rows.map((row, idx) => (
                <PreviewRow key={idx} row={row} checked={!!checked[idx]} onToggle={() => toggleRow(idx)} isEven={idx % 2 === 0} />
              ))}
            </div>

            {/* Import btn */}
            <div className="px-4 pt-4">
              <Button variant="primary" size="lg" fullWidth disabled={selectedCount === 0} onClick={doImport}>
                Import {selectedCount} contact{selectedCount !== 1 ? 's' : ''}
              </Button>
              {errorCount > 0 && (
                <p style={{ fontSize: 12, color: 'var(--accent-danger)', fontFamily: 'var(--font-body)', textAlign: 'center', marginTop: 8 }}>
                  {errorCount} row{errorCount !== 1 ? 's have' : ' has'} errors — they'll be imported with missing fields
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

function PreviewRow({ row, checked, onToggle, isEven }) {
  const errors = row._issues.filter(v => v.level === 'error')
  const warns = row._issues.filter(v => v.level === 'warn')
  const status = errors.length ? 'error' : warns.length ? 'warn' : 'clean'
  const leftColor = { error: 'var(--accent-danger)', warn: 'var(--accent)', clean: '#4a9a6a' }[status]

  return (
    <div style={{
      background: isEven ? 'var(--bg-card)' : 'var(--bg-secondary)',
      borderLeft: `3px solid ${leftColor}`,
      padding: '12px 16px',
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <button
        onClick={onToggle}
        style={{
          width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 2,
          background: checked ? 'var(--accent)' : 'transparent',
          border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 150ms',
        }}
      >
        {checked && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: row.name ? 'var(--text-primary)' : 'var(--accent-danger)', fontFamily: 'var(--font-body)' }}>
          {row.name || '— missing name —'}
        </p>
        <p style={{ fontSize: 12, color: row.company ? 'var(--text-secondary)' : 'var(--accent-danger)', fontFamily: 'var(--font-body)', marginTop: 2 }}>
          {[row.title, row.company].filter(Boolean).join(' · ') || '— missing company —'}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5">
          {row.email && <Chip label="Email" value={row.email} />}
          {row.phone && <Chip label="Phone" value={row.phone} />}
          {row.industry && <Chip label="Industry" value={row.industry} warn={!VALID_INDUSTRIES.includes(row.industry)} />}
          {row.relationship_type && <Chip label="Rel" value={row.relationship_type} warn={!VALID_RELATIONSHIPS.includes(row.relationship_type)} />}
          {row.geography && <Chip label="Geo" value={row.geography} warn={!VALID_GEOGRAPHIES.includes(row.geography)} />}
        </div>
        {row._issues.length > 0 && (
          <div className="flex flex-col gap-0.5 mt-2">
            {row._issues.map((issue, i) => (
              <p key={i} style={{ fontSize: 11, color: issue.level === 'error' ? 'var(--accent-danger)' : 'var(--accent)', fontFamily: 'var(--font-body)' }}>
                {issue.level === 'error' ? '✕' : '⚠'} {issue.msg}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Chip({ label, value, warn }) {
  return (
    <span style={{ fontSize: 11, color: warn ? 'var(--accent)' : 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
      <span style={{ color: 'var(--text-tertiary)', opacity: 0.6 }}>{label}: </span>{value}
    </span>
  )
}

function StatusBadge({ color, count, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 20,
      background: `${color}1a`,
      border: `1px solid ${color}33`,
      color, fontSize: 12, fontFamily: 'var(--font-body)',
    }}>
      <strong>{count}</strong> {label}
    </span>
  )
}

function SuccessSummary({ count, onDone }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 gap-5">
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(74,154,106,0.15)', border: '1px solid rgba(74,154,106,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4a9a6a" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--text-primary)' }}>
          {count} contact{count !== 1 ? 's' : ''} imported
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', marginTop: 6 }}>
          All added to your contact list.
        </p>
      </div>
      <Button variant="primary" size="lg" onClick={onDone}>Back to contacts</Button>
    </div>
  )
}

function FormatHint() {
  const cols = ['Name', 'Company', 'Title', 'Email', 'Phone', 'Industry', 'Relationship', 'Geography', 'Where Met', 'Tags', 'Notes']
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
        Expected columns
      </p>
      <div className="flex flex-wrap gap-1.5">
        {cols.map(c => (
          <span key={c} style={{ fontSize: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
            {c}
          </span>
        ))}
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)', marginTop: 10 }}>
        Column names are matched flexibly. Only Name and Company are required.
      </p>
    </div>
  )
}

function UploadIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
}
