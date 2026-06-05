export default function Header({ trade, onLogout }) {
  const initials = (trade?.business_name || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="header">
      <span className="business">{trade?.business_name || 'BackIn5'}</span>
      <div className="header-right">
        <button className="header-avatar" onClick={onLogout} aria-label="Log out" title="Log out">
          {initials}
        </button>
      </div>
    </header>
  )
}
