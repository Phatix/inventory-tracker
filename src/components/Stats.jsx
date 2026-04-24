import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardBody, CardHeader } from './ui/Card.jsx';
import { Button } from './ui/Button.jsx';
import { useProducts } from '../hooks/useProducts.js';
import { usePurchases } from '../hooks/usePurchases.js';
import { useSales } from '../hooks/useSales.js';
import { useCurrency } from '../hooks/useCurrency.js';
import {
  profitPerProduct,
  profitPerPeriod,
  topProductsByRevenue,
  topContactsByVolume,
} from '../utils/calculations.js';
import { formatMoney } from '../utils/formatters.js';

const ACCENT = '#4ade80';
const DANGER = '#f87171';
const WARN = '#fbbf24';
const MUTE = '#94a3b8';

export function Stats() {
  const products = useProducts() || [];
  const purchases = usePurchases() || [];
  const sales = useSales() || [];
  const currency = useCurrency();

  const [period, setPeriod] = useState('month');

  const perProduct = useMemo(
    () => profitPerProduct(products, purchases, sales).filter((r) => r.bought + r.sold > 0),
    [products, purchases, sales]
  );

  const perPeriod = useMemo(
    () => profitPerPeriod(purchases, sales, period),
    [purchases, sales, period]
  );

  const topProducts = useMemo(
    () => topProductsByRevenue(products, sales, 5),
    [products, sales]
  );

  const topContacts = useMemo(
    () => topContactsByVolume(purchases, sales, 5),
    [purchases, sales]
  );

  const productChartData = perProduct
    .slice()
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10)
    .map((r) => ({
      name: r.product.name,
      profit: +r.profit.toFixed(2),
    }));

  const empty = purchases.length === 0 && sales.length === 0;

  return (
    <div className="space-y-4">
      <div className="hidden md:block">
        <h1 className="text-2xl font-semibold text-ink">Statistiken</h1>
        <p className="text-sm text-ink-mute">Profitabilität & Trends</p>
      </div>

      {empty && (
        <Card>
          <CardBody>
            <div className="py-6 text-center text-ink-dim text-sm">
              Noch keine Daten — erfasse Einkäufe und Verkäufe, um Statistiken
              zu sehen.
            </div>
          </CardBody>
        </Card>
      )}

      {/* Profit per product */}
      <Card>
        <CardHeader
          title="Gewinn / Verlust pro Produkt"
          subtitle="Top 10 nach Profit"
        />
        <CardBody>
          {productChartData.length === 0 ? (
            <div className="text-sm text-ink-dim text-center py-6">
              Keine Daten.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={productChartData}
                  margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  <CartesianGrid stroke="#1f2a25" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke={MUTE}
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#1f2a25' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    stroke={MUTE}
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#1f2a25' }}
                  />
                  <Tooltip
                    cursor={{ fill: '#171f1b' }}
                    contentStyle={{
                      background: '#111815',
                      border: '1px solid #1f2a25',
                      borderRadius: 8,
                      color: '#e2e8f0',
                    }}
                    formatter={(v) => formatMoney(v, currency)}
                  />
                  <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
                    {productChartData.map((d) => (
                      <Cell
                        key={d.name}
                        fill={d.profit >= 0 ? ACCENT : DANGER}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Detail table */}
          {perProduct.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-ink-dim text-xs uppercase">
                  <tr className="border-b border-bg-border">
                    <th className="text-left py-2 font-normal">Produkt</th>
                    <th className="text-right py-2 font-normal">Gekauft</th>
                    <th className="text-right py-2 font-normal">Verkauft</th>
                    <th className="text-right py-2 font-normal">Umsatz</th>
                    <th className="text-right py-2 font-normal">Kosten</th>
                    <th className="text-right py-2 font-normal">Gewinn</th>
                  </tr>
                </thead>
                <tbody>
                  {perProduct
                    .slice()
                    .sort((a, b) => b.profit - a.profit)
                    .map((row) => (
                      <tr
                        key={row.product.id}
                        className="border-b border-bg-border last:border-0"
                      >
                        <td className="py-2 text-ink truncate max-w-[200px]">
                          {row.product.name}
                        </td>
                        <td className="py-2 text-right text-ink-mute font-mono">
                          {row.bought}
                        </td>
                        <td className="py-2 text-right text-ink-mute font-mono">
                          {row.sold}
                        </td>
                        <td className="py-2 text-right font-mono text-ink">
                          {formatMoney(row.revenue, currency)}
                        </td>
                        <td className="py-2 text-right font-mono text-ink-mute">
                          {formatMoney(row.cogs, currency)}
                        </td>
                        <td
                          className={`py-2 text-right font-mono ${
                            row.profit >= 0 ? 'text-accent' : 'text-danger'
                          }`}
                        >
                          {formatMoney(row.profit, currency)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Profit per period */}
      <Card>
        <CardHeader
          title="Gewinn pro Zeitraum"
          subtitle="Aggregiert über die gewählte Periode"
          action={
            <div className="flex gap-1">
              <Button
                variant={period === 'week' ? 'primary' : 'ghost'}
                onClick={() => setPeriod('week')}
                className="text-xs !px-3"
              >
                Woche
              </Button>
              <Button
                variant={period === 'month' ? 'primary' : 'ghost'}
                onClick={() => setPeriod('month')}
                className="text-xs !px-3"
              >
                Monat
              </Button>
            </div>
          }
        />
        <CardBody>
          {perPeriod.length === 0 ? (
            <div className="text-sm text-ink-dim text-center py-6">
              Keine Daten.
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={perPeriod}
                  margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  <CartesianGrid stroke="#1f2a25" vertical={false} />
                  <XAxis
                    dataKey="key"
                    stroke={MUTE}
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#1f2a25' }}
                  />
                  <YAxis
                    stroke={MUTE}
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#1f2a25' }}
                  />
                  <Tooltip
                    cursor={{ fill: '#171f1b' }}
                    contentStyle={{
                      background: '#111815',
                      border: '1px solid #1f2a25',
                      borderRadius: 8,
                      color: '#e2e8f0',
                    }}
                    formatter={(v, name) => [
                      formatMoney(v, currency),
                      name === 'profit'
                        ? 'Gewinn'
                        : name === 'spent'
                          ? 'Ausgaben'
                          : 'Einnahmen',
                    ]}
                  />
                  <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
                    {perPeriod.map((d) => (
                      <Cell
                        key={d.key}
                        fill={d.profit >= 0 ? ACCENT : DANGER}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products */}
        <Card>
          <CardHeader title="Top-Produkte" subtitle="Nach Umsatz" />
          <CardBody className="pt-2">
            {topProducts.length === 0 ? (
              <div className="text-sm text-ink-dim text-center py-4">
                Keine Daten.
              </div>
            ) : (
              <ul className="divide-y divide-bg-border">
                {topProducts.map((entry, idx) => (
                  <li
                    key={entry.product.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-6 h-6 rounded-full bg-accent-dim text-accent text-xs font-semibold flex items-center justify-center"
                      >
                        {idx + 1}
                      </span>
                      <span className="text-sm text-ink truncate">
                        {entry.product.name}
                      </span>
                    </div>
                    <span className="text-sm font-mono text-accent">
                      {formatMoney(entry.revenue, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Top contacts */}
        <Card>
          <CardHeader title="Top-Kontakte" subtitle="Nach Volumen" />
          <CardBody className="pt-2">
            {topContacts.length === 0 ? (
              <div className="text-sm text-ink-dim text-center py-4">
                Keine Daten.
              </div>
            ) : (
              <ul className="divide-y divide-bg-border">
                {topContacts.map((entry, idx) => (
                  <li
                    key={entry.name}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-warn/15 text-warn text-xs font-semibold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-ink truncate">
                        {entry.name}
                      </span>
                    </div>
                    <span className="text-sm font-mono text-ink">
                      {formatMoney(entry.volume, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
