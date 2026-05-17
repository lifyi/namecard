import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import Layout, { TopBar } from '../components/Layout.jsx'
import Button from '../components/Button.jsx'
import { saveMockContact } from '../lib/mockData.js'

const VALID_INDUSTRIES = ['Shipping', 'Legal', 'Finance', 'Government', 'Port Authority', 'Technology', 'Insurance', 'Trade Association', 'Academic', 'Other']
const VALID_RELATIONSHIPS = ['Client', 'Counterparty', 'Regulator', 'Industry peer', 'Vendor/supplier', 'Advisor/counsel', 'Internal colleague', 'Investor', 'Media', 'Other']
const VALID_GEOGRAPHIES = ['Singapore', 'China', 'Europe', 'Middle East', 'South Asia', 'Southeast Asia', 'Americas', 'Africa', 'Global']

// Flexible column name matching
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
    const normalized = h?.toString().trim().toLowerCase()
    Object.entries(FIELD_ALIASES).forEach(([field, aliases]) => {
      if (aliases.includes(normalized) && !map[field]) {
        map[field] = h
      }
    })
  })
  return map
}

function validateRow(row) {
  const issues = []
  if (!row.name?.trim()) issues.push({ field: 'name', level: 'error', msg: 'Missing name' })
  if (!row.company?.trim()) issues.push({ field: 'company', level: 'error', msg: 'Missing company' })
  if (row.industry && !VALID_INDUSTRIES.includes(row.industry)) {
    issues.push({ field: 'industry', level: 'warn', msg: `Unknown industry: "${row.industry}"` })
  }
  if (row.relationship_type && !VALID_RELATIONSHIPS.includes(row.relationship_type)) {
    issues.push({ field: 'relationship_type', level: 'warn', msg: `Unknown relationship: "${row.relationship_type}"` })
  }
  if (row.geography && !VALID_GEOGRAPHIES.includes(row.geography)) {
    issues.push({ field: 'geography', level: 'warn', msg: `Unknown geography: "${row.geography}"` })
  }
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
        const dataRows = raw.slice(1).filter(r => r.some(cell => cell !== ''))

        const parsed = dataRows.map((r, idx) => {
          const row = {}
          Object.entries(headerMap).forEach(([field, col]) => {
            const colIdx = headers.indexOf(col)
            row[field] = colIdx >= 0 ? r[colIdx]?.toString().trim() || '' : ''
          })
          if (row.tags) {
            row.tags = row.tags.split(/[,;]/).map(t => t.trim().toLowerCase()).filter(Boolean)
          } else {
            row.tags = []
          }
          const issues = validateRow(row)
          return { _idx: idx, _issues: issues, ...row }
        })

        setRows(parsed)
        const initChecked = {}
        parsed.forEach((r, i) => {
          initChecked[i] = !r._issues.some(v => v.level === 'error')
        })
        setChecked(initChecked)
      } catch (err) {
        console.error('Parse error', err)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  function handleFile(file) {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(ext)) return
    parseFile(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  function toggleRow(idx) {
    setChecked(c => ({ ...c, [idx]: !c[idx] }))
  }

  function toggleAll() {
    const allOn = rows.every((_, i) => checked[i])
    const next = {}
    rows.forEach((_, i) => { next[i] = !allOn })
    setChecked(next)
  }

  function doImport() {
    let count = 0
    rows.forEach((row, i) => {
      if (!checked[i]) return
      const { _idx, _issues, ...contact } = row
      saveMockContact({
        ...contact,
        id: `import-${Date.now()}-${i}`,
        date_met: new Date().toISOString().split('T')[0],
        follow_up_flag: false,
        interactions: [],
        tags: contact.tags || [],
      })
      count++
    })
    setImportedCount(count)
    setDone(true)
  }

  const errorCount = rows ? rows.filter((r, i) => checked[i] && r._issues.some(v => v.level === 'error')).length : 0
  const warnCount = rows ? rows.filter((r, i) => checked[i] && r._issues.some(v => v.level === 'warn')).length : 0
  const cleanCount = rows ? rows.filter((r, i) => checked[i] && r._issues.length === 0).length : 0
  const selectedCount = rows ? rows.filter((_, i) => checked[i]).length : 0

  return (
    <Layout>
      <TopBar
        title="Import Contacts"
        left={
          <button onClick={() => navigate('/')} className="text-[#888] flex items-center gap-1 text-[14px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-10">
        {done ? (
          <SuccessSummary count={importedCount} onDone={() => navigate('/')} />
        ) : !rows ? (
          /* Upload area */
          <div className="p-4 flex flex-col gap-4">
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-[16px]
                py-14 px-6 cursor-pointer transition-all
                ${dragging ? 'border-[#c8a97e]/60 bg-[#c8a97e]/5' : 'border-[#2a2a2a] bg-[#111] hover:border-[#3a3a3a]'}`}
            >
              <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                <UploadIcon />
              </div>
              <div className="text-center">
                <p className="text-[14px] text-[#e5e5e5] font-medium">Drop a file or tap to browse</p>
                <p className="text-[12px] text-[#555] mt-1">.xlsx, .xls, or .csv</p>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={e => handleFile(e.target.files[0])}
            />
            <FormatHint />
          </div>
        ) : (
          /* Preview table */
          <div className="flex flex-col">
            {/* File info + stats */}
            <div className="px-4 pt-4 pb-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] text-[#e5e5e5] font-medium">{fileName}</p>
                  <p className="text-[12px] text-[#555] mt-0.5">{rows.length} rows found</p>
                </div>
                <button
                  onClick={() => { setRows(null); setFileName(null); setChecked({}) }}
                  className="text-[12px] text-[#555] hover:text-[#888] transition-colors"
                >
                  Change file
                </button>
              </div>

              {/* Validation legend */}
              <div className="flex gap-3">
                <Badge color="green" count={cleanCount} label="Clean" />
                <Badge color="amber" count={warnCount} label="Warning" />
                <Badge color="red" count={rows.filter(r => r._issues.some(v => v.level === 'error')).length} label="Error" />
              </div>

              {/* Select all */}
              <div className="flex items-center justify-between">
                <button onClick={toggleAll} className="text-[12px] text-[#888] hover:text-[#e5e5e5] transition-colors">
                  {rows.every((_, i) => checked[i]) ? 'Deselect all' : 'Select all'}
                </button>
                <span className="text-[12px] text-[#555]">{selectedCount} selected</span>
              </div>
            </div>

            {/* Rows */}
            <div className="flex flex-col gap-2 px-4">
              {rows.map((row, idx) => (
                <PreviewRow
                  key={idx}
                  row={row}
                  checked={!!checked[idx]}
                  onToggle={() => toggleRow(idx)}
                />
              ))}
            </div>

            {/* Import button */}
            <div className="px-4 pt-4">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={selectedCount === 0}
                onClick={doImport}
              >
                Import {selectedCount} contact{selectedCount !== 1 ? 's' : ''}
              </Button>
              {errorCount > 0 && (
                <p className="text-[12px] text-[#e05c5c] text-center mt-2">
                  {errorCount} selected row{errorCount !== 1 ? 's have' : ' has'} errors — they will be imported with missing fields
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

function PreviewRow({ row, checked, onToggle }) {
  const errors = row._issues.filter(v => v.level === 'error')
  const warns = row._issues.filter(v => v.level === 'warn')

  const rowStatus = errors.length ? 'error' : warns.length ? 'warn' : 'clean'
  const borderColor = { error: 'border-[#e05c5c]/30', warn: 'border-[#c8a97e]/30', clean: 'border-[#1f1f1f]' }[rowStatus]
  const bgColor = { error: 'bg-[#1a0e0e]', warn: 'bg-[#131008]', clean: 'bg-[#111]' }[rowStatus]

  return (
    <div className={`${bgColor} border ${borderColor} rounded-[12px] overflow-hidden`}>
      <div className="flex items-start gap-3 px-4 py-3">
        <button
          onClick={onToggle}
          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border transition-all
            ${checked ? 'bg-[#c8a97e] border-[#c8a97e]' : 'border-[#3a3a3a] bg-transparent'}`}
        >
          {checked && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-[14px] font-medium ${row.name ? 'text-[#e5e5e5]' : 'text-[#e05c5c]'}`}>
                {row.name || '— missing name —'}
              </p>
              <p className={`text-[12px] mt-0.5 ${row.company ? 'text-[#555]' : 'text-[#e05c5c]'}`}>
                {[row.title, row.company].filter(Boolean).join(' · ') || '— missing company —'}
              </p>
            </div>
            <RowStatusDot status={rowStatus} />
          </div>

          {/* Fields preview */}
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2">
            {row.email && <FieldChip label="Email" value={row.email} />}
            {row.phone && <FieldChip label="Phone" value={row.phone} />}
            {row.industry && (
              <FieldChip
                label="Industry"
                value={row.industry}
                warn={!VALID_INDUSTRIES.includes(row.industry)}
              />
            )}
            {row.relationship_type && (
              <FieldChip
                label="Rel"
                value={row.relationship_type}
                warn={!VALID_RELATIONSHIPS.includes(row.relationship_type)}
              />
            )}
            {row.geography && (
              <FieldChip
                label="Geo"
                value={row.geography}
                warn={!VALID_GEOGRAPHIES.includes(row.geography)}
              />
            )}
          </div>

          {/* Issue messages */}
          {row._issues.length > 0 && (
            <div className="flex flex-col gap-0.5 mt-2">
              {row._issues.map((issue, i) => (
                <p key={i} className={`text-[11px] ${issue.level === 'error' ? 'text-[#e05c5c]' : 'text-[#c8a97e]'}`}>
                  {issue.level === 'error' ? '✕' : '⚠'} {issue.msg}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FieldChip({ label, value, warn }) {
  return (
    <span className={`text-[11px] ${warn ? 'text-[#c8a97e]' : 'text-[#444]'}`}>
      <span className="text-[#333]">{label}: </span>{value}
    </span>
  )
}

function RowStatusDot({ status }) {
  const colors = { clean: 'bg-[#5cb88a]', warn: 'bg-[#c8a97e]', error: 'bg-[#e05c5c]' }
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${colors[status]}`} />
}

function Badge({ color, count, label }) {
  const colors = {
    green: 'bg-[#5cb88a]/15 text-[#5cb88a] border-[#5cb88a]/20',
    amber: 'bg-[#c8a97e]/15 text-[#c8a97e] border-[#c8a97e]/20',
    red: 'bg-[#e05c5c]/15 text-[#e05c5c] border-[#e05c5c]/20',
  }
  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] border ${colors[color]}`}>
      <span className="font-semibold">{count}</span> {label}
    </span>
  )
}

function SuccessSummary({ count, onDone }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 gap-5">
      <div className="w-14 h-14 rounded-full bg-[#5cb88a]/15 border border-[#5cb88a]/30 flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5cb88a" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-[18px] font-semibold text-[#e5e5e5]">{count} contact{count !== 1 ? 's' : ''} imported</p>
        <p className="text-[13px] text-[#555] mt-1">All added to your contact list.</p>
      </div>
      <Button variant="primary" size="lg" onClick={onDone}>Back to contacts</Button>
    </div>
  )
}

function FormatHint() {
  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-[12px] p-4 flex flex-col gap-2">
      <p className="text-[12px] font-medium text-[#555] uppercase tracking-wider">Expected columns</p>
      <div className="flex flex-wrap gap-1.5">
        {['Name', 'Company', 'Title', 'Email', 'Phone', 'Industry', 'Relationship', 'Geography', 'Where Met', 'Tags', 'Notes'].map(col => (
          <span key={col} className="text-[11px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-2 py-0.5 text-[#666]">
            {col}
          </span>
        ))}
      </div>
      <p className="text-[11px] text-[#444]">Column names are matched flexibly. Only Name and Company are required.</p>
    </div>
  )
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}
