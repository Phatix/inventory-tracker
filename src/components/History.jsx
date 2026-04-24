import React, { useMemo, useState } from 'react';
import { Card, CardBody, CardHeader } from './ui/Card.jsx';
import { Button } from './ui/Button.jsx';
import { Input, Select } from './ui/Input.jsx';
import { ConfirmModal } from './ui/Modal.jsx';
import { useToast } from './ui/Toast.jsx';
import { useProducts } from '../hooks/useProducts.js';
import { usePurchases } from '../hooks/usePurchases.js';
import { useSales } from '../hooks/useSales.js';
import { useCurrency } from '../hooks/useCurrency.js';
import { mergeTransactions } from '../utils/calculations.js';
import { formatDate, formatMoney, formatQuantity } from '../utils/formatters.js';
import { purchasesApi, salesApi } from '../db/database.js';

export function History() {
  const products = useProducts() || [];
  const purchases = usePurchases() || [];
  const sales = useSales() || [];
  const currency = useCurrency();
  const toast = useToast();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [contactFilter, setContactFilter] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const productsById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  const allContacts = useMemo(() => {
    const set = new Set();
    purchases.forEach((p) => p.source && set.add(p.source.trim()));
    sales.forEach((s) => s.recipient && set.add(s.recipient.trim()));
    return Array.from(set).filter(Boolean).sort();
  }, [purchases, sales]);

  const filtered = useMemo(() => {
    let tx = mergeTransactions(purchases, sales);

    if (typeFilter === 'purchase') tx = tx.filter((t) => t._kind === 'purchase');
    if (typeFilter === 'sale') tx = tx.filter((t) => t._kind === 'sale');
    if (productFilter) tx = tx.filter((t) => t.product_id === productFilter);
    if (from) tx = tx.filter((t) => (t.date || '') >= from);
    if (to) tx = tx.filter((t) => (t.date || '') <= to);
    if (contactFilter) {
      const cf = contactFilter.toLowerCase();
      tx = tx.filter((t) => {
        const name = t._kind === 'purchase' ? t.source : t.recipient;
        return (name || '').toLowerCase().includes(cf);
      });
    }

    const sorters = {
      date_desc: (a, b) =>
        (b.date || '').localeCompare(a.date || '') ||
        (b.created_at || '').localeCompare(a.created_at || ''),
      date_asc: (a, b) =>
        (a.date || '').localeCompare(b.date || '') ||
        (a.created_at || '').localeCompare(b.created_at || ''),
      amount_desc: (a, b) => Number(b.price_total) - Number(a.price_total),
      amount_asc: (a, b) => Number(a.price_total) - Number(b.price_total),
    };
    return tx.slice().sort(sorters[sortBy]);
  }, [purchases, sales, typeFilter, productFilter, from, to, contactFilter, sortBy]);

  const totals = useMemo(() => {
    let spent = 0;
    let earned = 0;
    filtered.forEach((t) => {
      if (t._kind === 'purchase') spent += Number(t.price_total || 0);
      else earned += Number(t.price_total || 0);
    });
    return { spent, earned, net: earned - spent };
  }, [filtered]);

  const resetFilters = () => {
    setFrom('');
    setTo('');
    setProductFilter('');
    setTypeFilter('all');
    setContactFilter('');
    setSortBy('date_desc');
  };

  return (
    <div className="space-y-4">
      <div className="hidden md:block">
        <h1 className="text-2xl font-semibold text-ink">Transaktionshistorie</h1>
        <p className="text-sm text-ink-mute">
          {filtered.length} von {purchases.length + sales.length} Transaktionen
        </p>
      </div>

      <Card>
        <CardHeader title="Filter" />
        <CardBody className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="label-base">Von</label>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="label-base">Bis</label>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div>
              <label className="label-base">Typ</label>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">Alle</option>
                <option value="purchase">Nur Einkauf</option>
                <option value="sale">Nur Verkauf</option>
              </Select>
            </div>
            <div>
              <label className="label-base">Sortierung</label>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date_desc">Datum (neu → alt)</option>
                <option value="date_asc">Datum (alt → neu)</option>
                <option value="amount_desc">Betrag (hoch → niedrig)</option>
                <option value="amount_asc">Betrag (niedrig → hoch)</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label-base">Produkt</label>
              <Select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
              >
                <option value="">Alle Produkte</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="label-base">Kontakt</label>
              <Input
                value={contactFilter}
                onChange={(e) => setContactFilter(e.target.value)}
                placeholder="Name (Lieferant/Kunde)"
                list="all-contacts"
              />
              <datalist id="all-contacts">
                {allContacts.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" onClick={resetFilters} className="text-xs">
              Filter zurücksetzen
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardBody className="!p-0">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-ink-dim text-sm">
              Keine Transaktionen für die aktuellen Filter.
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-ink-dim text-xs uppercase tracking-wide">
                    <tr className="border-b border-bg-border">
                      <th className="text-left px-4 py-2 font-normal">Datum</th>
                      <th className="text-left px-4 py-2 font-normal">Typ</th>
                      <th className="text-left px-4 py-2 font-normal">Produkt</th>
                      <th className="text-right px-4 py-2 font-normal">Menge</th>
                      <th className="text-right px-4 py-2 font-normal">
                        Preis/Einheit
                      </th>
                      <th className="text-right px-4 py-2 font-normal">Gesamt</th>
                      <th className="text-left px-4 py-2 font-normal">Kontakt</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((tx) => {
                      const product = productsById.get(tx.product_id);
                      const isPurchase = tx._kind === 'purchase';
                      return (
                        <tr
                          key={`${tx._kind}-${tx.id}`}
                          className="border-b border-bg-border last:border-0 hover:bg-bg-elevated/40"
                        >
                          <td className="px-4 py-2.5 text-ink-mute whitespace-nowrap">
                            {formatDate(tx.date)}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`chip ${
                                isPurchase
                                  ? '!text-warn !border-warn/30 !bg-warn/10'
                                  : '!text-accent !border-accent/30 !bg-accent-dim'
                              }`}
                            >
                              {isPurchase ? 'Einkauf' : 'Verkauf'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-ink">
                            {product?.name || (
                              <span className="text-ink-dim italic">
                                gelöscht
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono">
                            {formatQuantity(tx.quantity, product?.unit || '')}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-ink-mute">
                            {formatMoney(tx.price_per_unit, currency)}
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right font-mono ${
                              isPurchase ? 'text-warn' : 'text-accent'
                            }`}
                          >
                            {isPurchase ? '−' : '+'}
                            {formatMoney(tx.price_total, currency)}
                          </td>
                          <td className="px-4 py-2.5 text-ink-mute truncate max-w-[180px]">
                            {isPurchase ? tx.source : tx.recipient || '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(tx)}
                              className="text-ink-dim hover:text-danger"
                              aria-label="Löschen"
                            >
                              🗑
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-bg-elevated/40">
                    <tr className="border-t border-bg-border">
                      <td
                        colSpan="5"
                        className="px-4 py-3 text-right text-xs uppercase tracking-wide text-ink-dim"
                      >
                        Summen
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        <div className="text-warn">
                          −{formatMoney(totals.spent, currency)}
                        </div>
                        <div className="text-accent">
                          +{formatMoney(totals.earned, currency)}
                        </div>
                        <div
                          className={`mt-1 pt-1 border-t border-bg-border ${
                            totals.net >= 0 ? 'text-accent' : 'text-danger'
                          }`}
                        >
                          ={' '}
                          {formatMoney(totals.net, currency)}
                        </div>
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="md:hidden divide-y divide-bg-border">
                {filtered.map((tx) => {
                  const product = productsById.get(tx.product_id);
                  const isPurchase = tx._kind === 'purchase';
                  return (
                    <li
                      key={`${tx._kind}-${tx.id}`}
                      className="px-4 py-3 flex items-start gap-3"
                    >
                      <div
                        className={`mt-1 w-1 h-12 rounded-full ${
                          isPurchase ? 'bg-warn' : 'bg-accent'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-ink truncate">
                          {product?.name || (
                            <span className="italic text-ink-dim">gelöscht</span>
                          )}
                        </div>
                        <div className="text-xs text-ink-dim mt-0.5">
                          {isPurchase ? 'Einkauf' : 'Verkauf'} ·{' '}
                          {formatDate(tx.date)} ·{' '}
                          {formatQuantity(tx.quantity, product?.unit || '')}
                        </div>
                        {(isPurchase ? tx.source : tx.recipient) && (
                          <div className="text-xs text-ink-dim truncate">
                            {isPurchase ? tx.source : tx.recipient}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-sm font-mono ${
                            isPurchase ? 'text-warn' : 'text-accent'
                          }`}
                        >
                          {isPurchase ? '−' : '+'}
                          {formatMoney(tx.price_total, currency)}
                        </div>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(tx)}
                          className="text-xs text-ink-dim hover:text-danger mt-1"
                        >
                          löschen
                        </button>
                      </div>
                    </li>
                  );
                })}
                <li className="px-4 py-3 bg-bg-elevated/40">
                  <div className="text-xs uppercase tracking-wide text-ink-dim mb-1">
                    Summen
                  </div>
                  <div className="font-mono text-sm flex justify-between">
                    <span className="text-warn">
                      −{formatMoney(totals.spent, currency)}
                    </span>
                    <span className="text-accent">
                      +{formatMoney(totals.earned, currency)}
                    </span>
                    <span
                      className={
                        totals.net >= 0 ? 'text-accent' : 'text-danger'
                      }
                    >
                      = {formatMoney(totals.net, currency)}
                    </span>
                  </div>
                </li>
              </ul>
            </>
          )}
        </CardBody>
      </Card>

      <ConfirmModal
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return;
          if (confirmDelete._kind === 'purchase') {
            await purchasesApi.remove(confirmDelete.id);
          } else {
            await salesApi.remove(confirmDelete.id);
          }
          toast.success('Transaktion gelöscht.');
          setConfirmDelete(null);
        }}
        title="Transaktion löschen?"
        message={
          confirmDelete
            ? `Diese ${
                confirmDelete._kind === 'purchase' ? 'Einkaufs' : 'Verkaufs'
              }buchung wird unwiderruflich entfernt. Der Bestand wird entsprechend angepasst.`
            : ''
        }
      />
    </div>
  );
}
