import React, { useMemo } from 'react';
import { Card, CardBody, CardHeader } from './ui/Card.jsx';
import { Button } from './ui/Button.jsx';
import { useProducts } from '../hooks/useProducts.js';
import { usePurchases } from '../hooks/usePurchases.js';
import { useSales } from '../hooks/useSales.js';
import { useCurrency } from '../hooks/useCurrency.js';
import {
  computeStockMap,
  totalSpent,
  totalEarned,
  mergeTransactions,
} from '../utils/calculations.js';
import {
  formatMoney,
  formatQuantity,
  formatDate,
} from '../utils/formatters.js';

export function Dashboard({ setView }) {
  const products = useProducts() || [];
  const purchases = usePurchases() || [];
  const sales = useSales() || [];
  const currency = useCurrency();

  const stockMap = useMemo(
    () => computeStockMap(purchases, sales),
    [purchases, sales]
  );
  const spent = useMemo(() => totalSpent(purchases), [purchases]);
  const earned = useMemo(() => totalEarned(sales), [sales]);
  const profit = earned - spent;

  const recent = useMemo(
    () => mergeTransactions(purchases, sales).slice(0, 5),
    [purchases, sales]
  );

  const lowStock = useMemo(
    () => products.filter((p) => (stockMap.get(p.id) || 0) <= 0),
    [products, stockMap]
  );

  const productsById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  return (
    <div className="space-y-6">
      {/* Page header (desktop only — mobile has top bar) */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
          <p className="text-sm text-ink-mute">Übersicht über deinen Bestand & Umsatz</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Button
          variant="primary"
          onClick={() => setView('purchase')}
          className="!py-3"
        >
          + Einkauf
        </Button>
        <Button
          variant="secondary"
          onClick={() => setView('sale')}
          className="!py-3"
        >
          + Verkauf
        </Button>
        <Button
          variant="secondary"
          onClick={() => setView('products')}
          className="!py-3"
        >
          + Produkt
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Ausgaben"
          value={formatMoney(spent, currency)}
          tone="neutral"
        />
        <KpiCard
          label="Einnahmen"
          value={formatMoney(earned, currency)}
          tone="neutral"
        />
        <KpiCard
          label={profit >= 0 ? 'Gewinn' : 'Verlust'}
          value={formatMoney(profit, currency)}
          tone={profit >= 0 ? 'positive' : 'negative'}
        />
        <KpiCard
          label="Produkte"
          value={String(products.length)}
          subtitle={`${purchases.length + sales.length} Transaktionen`}
        />
      </div>

      {/* Low stock warning */}
      {lowStock.length > 0 && (
        <Card className="border-warn/40 bg-warn/5">
          <CardBody>
            <div className="flex items-start gap-3">
              <div className="text-warn text-xl leading-none">⚠</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-warn">
                  {lowStock.length === 1
                    ? '1 Produkt ist leer (Bestand ≤ 0)'
                    : `${lowStock.length} Produkte sind leer (Bestand ≤ 0)`}
                </div>
                <div className="mt-1 text-xs text-ink-mute">
                  {lowStock
                    .slice(0, 5)
                    .map((p) => p.name)
                    .join(' · ')}
                  {lowStock.length > 5 && ` · +${lowStock.length - 5} weitere`}
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setView('products')}
                className="text-xs"
              >
                Ansehen →
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stock per product */}
        <Card>
          <CardHeader
            title="Bestand pro Produkt"
            subtitle={`${products.length} Produkte`}
            action={
              <Button
                variant="ghost"
                className="text-xs"
                onClick={() => setView('products')}
              >
                Alle →
              </Button>
            }
          />
          <CardBody className="pt-2">
            {products.length === 0 ? (
              <EmptyHint
                message="Noch keine Produkte angelegt."
                action={
                  <Button onClick={() => setView('products')}>
                    Produkt anlegen
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-bg-border">
                {products.slice(0, 8).map((p) => {
                  const stock = stockMap.get(p.id) || 0;
                  const low = stock <= 0;
                  return (
                    <li
                      key={p.id}
                      className="flex items-center justify-between py-2.5"
                    >
                      <div className="min-w-0">
                        <div className="text-sm text-ink truncate">{p.name}</div>
                        {p.category && (
                          <div className="text-xs text-ink-dim">
                            {p.category}
                          </div>
                        )}
                      </div>
                      <div
                        className={`text-sm font-mono ${
                          low ? 'text-danger' : 'text-accent'
                        }`}
                      >
                        {formatQuantity(stock, p.unit)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardHeader
            title="Letzte Bewegungen"
            subtitle="Einkäufe & Verkäufe"
            action={
              <Button
                variant="ghost"
                className="text-xs"
                onClick={() => setView('history')}
              >
                Alle →
              </Button>
            }
          />
          <CardBody className="pt-2">
            {recent.length === 0 ? (
              <EmptyHint message="Noch keine Transaktionen." />
            ) : (
              <ul className="divide-y divide-bg-border">
                {recent.map((tx) => {
                  const product = productsById.get(tx.product_id);
                  const isPurchase = tx._kind === 'purchase';
                  return (
                    <li
                      key={`${tx._kind}-${tx.id}`}
                      className="flex items-center justify-between py-2.5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm text-ink truncate">
                          <span
                            className={`inline-block w-1.5 h-1.5 rounded-full ${
                              isPurchase ? 'bg-warn' : 'bg-accent'
                            }`}
                          />
                          <span className="truncate">
                            {product?.name || '— gelöscht —'}
                          </span>
                        </div>
                        <div className="text-xs text-ink-dim mt-0.5">
                          {isPurchase ? 'Einkauf' : 'Verkauf'} ·{' '}
                          {formatDate(tx.date)} ·{' '}
                          {formatQuantity(tx.quantity, product?.unit || '')}
                        </div>
                      </div>
                      <div
                        className={`text-sm font-mono ${
                          isPurchase ? 'text-warn' : 'text-accent'
                        }`}
                      >
                        {isPurchase ? '−' : '+'}
                        {formatMoney(tx.price_total, currency)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ label, value, subtitle, tone = 'neutral' }) {
  const valueColor =
    tone === 'positive'
      ? 'text-accent'
      : tone === 'negative'
        ? 'text-danger'
        : 'text-ink';
  return (
    <Card>
      <CardBody>
        <div className="text-xs uppercase tracking-wide text-ink-dim">
          {label}
        </div>
        <div className={`text-xl font-semibold mt-1 font-mono ${valueColor}`}>
          {value}
        </div>
        {subtitle && (
          <div className="text-xs text-ink-dim mt-1">{subtitle}</div>
        )}
      </CardBody>
    </Card>
  );
}

function EmptyHint({ message, action }) {
  return (
    <div className="text-center py-6">
      <p className="text-sm text-ink-dim">{message}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
