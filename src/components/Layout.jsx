export default function Layout({ children, className = '' }) {
  return (
    <div className={`min-h-dvh bg-[#0a0a0a] text-[#e5e5e5] flex flex-col ${className}`}>
      {children}
    </div>
  )
}

export function TopBar({ title, left, right, subtitle }) {
  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#1f1f1f]">
      <div className="flex items-center justify-between px-4 h-14 safe-top">
        <div className="w-16 flex items-center">{left}</div>
        <div className="flex-1 text-center">
          <h1 className="text-[15px] font-semibold tracking-tight text-[#e5e5e5]">{title}</h1>
          {subtitle && <p className="text-[11px] text-[#555] -mt-0.5">{subtitle}</p>}
        </div>
        <div className="w-16 flex items-center justify-end">{right}</div>
      </div>
    </header>
  )
}
