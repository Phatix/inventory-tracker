import React from 'react';

/**
 * Two-pane shell:
 *  - Sidebar nav on >= md
 *  - Bottom tab bar on < md
 *
 * Routing is just controlled state (`view` + `setView`).
 */

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: IconHome, mobile: true },
  { id: 'purchase', label: 'Einkauf', icon: IconArrowDown, mobile: true },
  { id: 'sale', label: 'Verkauf', icon: IconArrowUp, mobile: true },
  { id: 'history', label: 'Historie', icon: IconList, mobile: true },
  { id: 'products', label: 'Produkte', icon: IconBox, mobile: false },
  { id: 'contacts', label: 'Kontakte', icon: IconUsers, mobile: false },
  { id: 'stats', label: 'Statistiken', icon: IconChart, mobile: false },
  { id: 'settings', label: 'Einstellungen', icon: IconCog, mobile: false },
];

export function Layout({ view, setView, children }) {
  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-60 border-r border-bg-border bg-bg-surface px-3 py-5 sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-2 mb-6">
          <LogoMark />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-ink">Inventory</div>
            <div className="text-xs text-ink-dim">Tracker</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={view === item.id}
              onClick={() => setView(item.id)}
            />
          ))}
        </nav>
        <div className="mt-auto px-2 pt-4 text-[11px] text-ink-dim">
          Lokal · Offline-First
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 pb-24 md:pb-6">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-30 bg-bg-base/85 backdrop-blur border-b border-bg-border px-4 py-3 flex items-center gap-2">
          <LogoMark size={22} />
          <div className="text-sm font-semibold text-ink">
            {NAV.find((n) => n.id === view)?.label || 'Inventory'}
          </div>
          <div className="ml-auto flex items-center gap-1">
            <MoreMenu currentView={view} setView={setView} />
          </div>
        </header>

        <div className="p-4 sm:p-6 max-w-5xl mx-auto">{children}</div>
      </main>

      {/* Bottom tab bar (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-bg-surface/95 backdrop-blur border-t border-bg-border pb-safe">
        <div className="grid grid-cols-5">
          {NAV.filter((n) => n.mobile).map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={`flex flex-col items-center justify-center gap-1 py-2 text-[11px] ${
                  active ? 'text-accent' : 'text-ink-mute'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setView('more')}
            className={`flex flex-col items-center justify-center gap-1 py-2 text-[11px] ${
              ['products', 'contacts', 'stats', 'settings', 'more'].includes(view)
                ? 'text-accent'
                : 'text-ink-mute'
            }`}
          >
            <IconDots className="w-5 h-5" />
            Mehr
          </button>
        </div>
      </nav>
    </div>
  );
}

function NavButton({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
        active
          ? 'bg-accent-dim text-accent'
          : 'text-ink-mute hover:text-ink hover:bg-bg-elevated'
      }`}
    >
      <Icon className="w-4 h-4" />
      {item.label}
    </button>
  );
}

function MoreMenu({ currentView, setView }) {
  const [open, setOpen] = React.useState(false);
  const items = NAV.filter((n) => !n.mobile);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost p-2"
        aria-label="Mehr"
      >
        <IconDots className="w-5 h-5" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-48 z-40 card-elevated p-1 shadow-xl">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setView(item.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                    currentView === item.id
                      ? 'bg-accent-dim text-accent'
                      : 'text-ink-mute hover:text-ink hover:bg-bg-elevated'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------- Icons (inline SVG, no external dep) ----------------

function LogoMark({ size = 26 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className="text-accent"
    >
      <rect width="32" height="32" rx="6" fill="#16331f" />
      <path
        d="M8 22V10l8-4 8 4v12l-8 4-8-4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M8 10l8 4 8-4M16 14v12" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconHome({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12 12 4l9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
function IconArrowDown({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="m6 13 6 6 6-6" />
    </svg>
  );
}
function IconArrowUp({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </svg>
  );
}
function IconList({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="3.5" cy="6" r="1" />
      <circle cx="3.5" cy="12" r="1" />
      <circle cx="3.5" cy="18" r="1" />
    </svg>
  );
}
function IconBox({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 8V19a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 19V8" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
function IconUsers({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2 21a7 7 0 0 1 14 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M22 19a5 5 0 0 0-7-4.6" />
    </svg>
  );
}
function IconChart({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <rect x="7" y="11" width="3" height="7" />
      <rect x="12" y="7" width="3" height="11" />
      <rect x="17" y="14" width="3" height="4" />
    </svg>
  );
}
function IconCog({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}
function IconDots({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  );
}
