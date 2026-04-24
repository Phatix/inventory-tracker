import React, { useState } from 'react';
import { Layout } from './components/Layout.jsx';
import { Dashboard } from './components/Dashboard.jsx';
import { Products } from './components/Products.jsx';
import { PurchaseForm } from './components/PurchaseForm.jsx';
import { SaleForm } from './components/SaleForm.jsx';
import { History } from './components/History.jsx';
import { Contacts } from './components/Contacts.jsx';
import { Stats } from './components/Stats.jsx';
import { Settings } from './components/Settings.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import { Card, CardBody } from './components/ui/Card.jsx';

/**
 * Top-level controlled router. We keep this dead-simple — view names
 * are strings and a switch dispatches to the right screen. No history
 * API, no router lib needed for an offline single-user app.
 */
export default function App() {
  const [view, setView] = useState('dashboard');

  return (
    <ToastProvider>
      <Layout view={view} setView={setView}>
        {renderView(view, setView)}
      </Layout>
    </ToastProvider>
  );
}

function renderView(view, setView) {
  switch (view) {
    case 'dashboard':
      return <Dashboard setView={setView} />;
    case 'products':
      return <Products />;
    case 'purchase':
      return <PurchaseForm setView={setView} />;
    case 'sale':
      return <SaleForm setView={setView} />;
    case 'history':
      return <History />;
    case 'contacts':
      return <Contacts />;
    case 'stats':
      return <Stats />;
    case 'settings':
      return <Settings />;
    case 'more':
      return <MoreMenuMobile setView={setView} />;
    default:
      return <Dashboard setView={setView} />;
  }
}

/**
 * Mobile-only sub-screen reachable from the "Mehr" tab.
 * On desktop these items live in the sidebar.
 */
function MoreMenuMobile({ setView }) {
  const items = [
    { id: 'products', label: 'Produkte', desc: 'Stammdaten verwalten' },
    { id: 'contacts', label: 'Kontakte', desc: 'Lieferanten & Kunden' },
    { id: 'stats', label: 'Statistiken', desc: 'Profit & Trends' },
    { id: 'settings', label: 'Einstellungen', desc: 'Backup, Währung, Reset' },
  ];
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-ink mb-2">Mehr</h2>
      {items.map((item) => (
        <Card key={item.id}>
          <CardBody>
            <button
              type="button"
              onClick={() => setView(item.id)}
              className="w-full text-left flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-medium text-ink">{item.label}</div>
                <div className="text-xs text-ink-dim">{item.desc}</div>
              </div>
              <span className="text-ink-mute">→</span>
            </button>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
