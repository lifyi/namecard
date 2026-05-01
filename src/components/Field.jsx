export default function Field({ label, value, onChange, placeholder, type = 'text', multiline = false, className = '' }) {
  const inputClass = `w-full bg-[#111] border border-[#2a2a2a] rounded-[8px] px-3 text-[14px]
    text-[#e5e5e5] placeholder-[#444] outline-none transition-colors
    focus:border-[#c8a97e]/60 focus:bg-[#131313]`

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-[11px] font-medium text-[#555] uppercase tracking-wider px-0.5">
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${inputClass} py-2.5 resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={`${inputClass} h-10`}
        />
      )}
    </div>
  )
}

export function SelectField({ label, value, onChange, options, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-[11px] font-medium text-[#555] uppercase tracking-wider px-0.5">
          {label}
        </label>
      )}
      <select
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full bg-[#111] border border-[#2a2a2a] rounded-[8px] px-3 h-10 text-[14px]
          text-[#e5e5e5] outline-none focus:border-[#c8a97e]/60 appearance-none"
      >
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

export function TagsField({ label, tags, onChange }) {
  const [input, setInput] = React.useState('')

  function addTag(tag) {
    const t = tag.trim().toLowerCase()
    if (t && !tags.includes(t)) {
      onChange([...tags, t])
    }
    setInput('')
  }

  function removeTag(tag) {
    onChange(tags.filter((t) => t !== tag))
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-[11px] font-medium text-[#555] uppercase tracking-wider px-0.5">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-1.5 min-h-10 bg-[#111] border border-[#2a2a2a] rounded-[8px] p-2">
        {tags.map((tag) => (
          <span key={tag} className="flex items-center gap-1 bg-[#2a2a2a] rounded-full px-2.5 py-0.5 text-[12px] text-[#aaa]">
            {tag}
            <button onClick={() => removeTag(tag)} className="text-[#555] hover:text-[#e5e5e5] transition-colors">×</button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              addTag(input)
            }
          }}
          onBlur={() => input && addTag(input)}
          placeholder={tags.length === 0 ? 'Add tags…' : ''}
          className="flex-1 min-w-20 bg-transparent text-[14px] text-[#e5e5e5] placeholder-[#444] outline-none"
        />
      </div>
    </div>
  )
}

import React from 'react'
