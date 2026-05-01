export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  fullWidth = false,
}) {
  const base = `inline-flex items-center justify-center font-medium transition-all duration-150 select-none
    disabled:opacity-40 disabled:pointer-events-none active:scale-[0.97] rounded-[10px]`

  const variants = {
    primary: 'bg-[#c8a97e] text-[#0a0a0a] hover:bg-[#d4b98a]',
    secondary: 'bg-[#1a1a1a] text-[#e5e5e5] border border-[#2a2a2a] hover:bg-[#222]',
    ghost: 'bg-transparent text-[#888] hover:text-[#e5e5e5] hover:bg-[#1a1a1a]',
    danger: 'bg-[#3a1a1a] text-[#e05c5c] border border-[#4a2020] hover:bg-[#441f1f]',
  }

  const sizes = {
    sm: 'px-3 h-8 text-[13px] gap-1.5',
    md: 'px-4 h-10 text-[14px] gap-2',
    lg: 'px-6 h-12 text-[15px] gap-2',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading ? (
        <>
          <LoadingDots />
        </>
      ) : children}
    </button>
  )
}

function LoadingDots() {
  return (
    <span className="flex gap-1 items-center">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current opacity-80"
          style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
        />
      ))}
      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }`}</style>
    </span>
  )
}
