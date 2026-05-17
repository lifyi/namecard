import React from 'react'

const inputStyle = {
  width: '100%',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '0 12px',
  height: '40px',
  fontSize: '14px',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  outline: 'none',
  transition: 'border-color 150ms ease',
}

const labelStyle = {
  fontSize: '11px',
  fontWeight: 500,
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  fontFamily: 'var(--font-body)',
  marginBottom: '4px',
  display: 'block',
}

export default function Field({ label, value, onChange, placeholder, type = 'text', multiline = false, className = '' }) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <label style={labelStyle}>{label}</label>}
      {multiline ? (
        <textarea
          value={value || ''}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{
            ...inputStyle,
            height: 'auto',
            padding: '10px 12px',
            resize: 'none',
            lineHeight: '1.5',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(201,168,108,0.5)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      ) : (
        <input
          type={type}
          value={value || ''}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          style={{ ...inputStyle, '--placeholder-color': 'var(--text-tertiary)' }}
          onFocus={e => e.target.style.borderColor = 'rgba(201,168,108,0.5)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      )}
    </div>
  )
}

export function SelectField({ label, value, onChange, options, className = '' }) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <label style={labelStyle}>{label}</label>}
      <select
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
        style={{
          ...inputStyle,
          appearance: 'none',
          cursor: 'pointer',
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(201,168,108,0.5)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      >
        <option value="">—</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  )
}

export function TagsField({ label, tags, onChange }) {
  const [input, setInput] = React.useState('')

  function addTag(tag) {
    const t = tag.trim().toLowerCase()
    if (t && !tags.includes(t)) onChange([...tags, t])
    setInput('')
  }
  function removeTag(tag) { onChange(tags.filter(t => t !== tag)) }

  return (
    <div className="flex flex-col">
      {label && <label style={labelStyle}>{label}</label>}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '8px 10px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        minHeight: '40px',
        alignItems: 'center',
      }}>
        {tags.map(tag => (
          <span key={tag} style={{
            background: 'rgba(122,101,64,0.2)',
            border: '1px solid var(--accent-dim)',
            borderRadius: '20px',
            padding: '3px 10px',
            fontSize: '11px',
            color: 'var(--accent)',
            fontFamily: 'var(--font-body)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}>
            {tag}
            <button
              onClick={() => removeTag(tag)}
              style={{ color: 'var(--text-tertiary)', lineHeight: 1, cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontSize: '14px' }}
            >×</button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input) }
          }}
          onBlur={() => input && addTag(input)}
          placeholder={tags.length === 0 ? 'Add tags…' : ''}
          style={{
            flex: 1,
            minWidth: '80px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
          }}
        />
      </div>
    </div>
  )
}
