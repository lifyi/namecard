export default function Layout({ children, className = '' }) {
  return (
    <div
      className={`min-h-dvh flex flex-col ${className}`}
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {children}
    </div>
  )
}

export function TopBar({ title, left, right, subtitle, titleFont = 'display' }) {
  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center justify-between px-4 h-14">
        <div className="w-16 flex items-center">{left}</div>
        <div className="flex-1 text-center">
          <h1
            className={titleFont === 'display' ? 'text-[22px] leading-tight' : 'text-[15px] font-semibold leading-tight'}
            style={{
              fontFamily: titleFont === 'display' ? 'var(--font-display)' : 'var(--font-body)',
              fontStyle: titleFont === 'display' ? 'italic' : 'normal',
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-[12px] mt-0.5 truncate px-2"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="w-16 flex items-center justify-end">{right}</div>
      </div>
    </header>
  )
}
