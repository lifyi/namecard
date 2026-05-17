export default function Button({
  children, onClick, variant = 'primary', size = 'md',
  disabled = false, loading = false, className = '', type = 'button', fullWidth = false,
}) {
  const base = `inline-flex items-center justify-center font-medium select-none
    transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none`

  const radius = 'rounded-[8px]'

  const variants = {
    primary: {
      background: 'var(--accent)',
      color: 'var(--bg-primary)',
      border: 'none',
    },
    secondary: {
      background: 'var(--bg-card)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: 'none',
    },
    danger: {
      background: 'rgba(192,97,74,0.12)',
      color: 'var(--accent-danger)',
      border: '1px solid rgba(192,97,74,0.3)',
    },
  }

  const sizes = {
    sm: 'px-3 h-8 text-[13px] gap-1.5',
    md: 'px-4 h-10 text-[14px] gap-2',
    lg: 'px-5 h-12 text-[15px] gap-2',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${radius} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{ fontFamily: 'var(--font-body)', fontWeight: 500, ...variants[variant] }}
    >
      {loading ? <LoadingDots /> : children}
    </button>
  )
}

function LoadingDots() {
  return (
    <span className="flex gap-1 items-center">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current"
          style={{ animation: `bdots 1s ease-in-out ${i * 0.16}s infinite` }}
        />
      ))}
    </span>
  )
}
