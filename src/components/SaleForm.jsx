import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader } from './ui/Card.jsx';
import { Button } from './ui/Button.jsx';
import { Field, Input, Select, Textarea } from './ui/Input.jsx';
import { useToast } from './ui/Toast.jsx';
import { useProducts } from '../hooks/useProducts.js';
import { useContacts } from '../hooks/useContacts.js';
import { usePurchases } from '../hooks/usePurchases.js';
import { useSales } from '../hooks/useSales.js';
import { useCurrency } from '../hooks/useCurrency.js';
import { contactsApi, salesApi } from '../db/database.js';
import { computeStockMap } from '../utils/calculations.js';
import { formatMoney, formatQuantity, todayIso } from '../utils/formatters.js';

const initialForm = () => ({
  product_id: '',
  quantity: '',
  price_per_unit: '',
  recipient: '',
  date: todayIso(),
  notes: '',
  free: false,
});

export function SaleForm({ setView }) {
  const products = useProducts() || [];
  const contacts = useContacts() || [];
  const purchases = usePurchases() || [];
  const sales = useSales() || [];
  const currency = useCurrency();
  const toast = useToast();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const stockMap = useMemo(
    () => computeStockMap(purchases, sales),
    [purchases, sales]
  );

  useEffect(() => {
    if (!form.product_id && products.length > 0) {
      setForm((f) => ({ ...f, product_id: products[0].id }));
    }
  }, [products, form.product_id]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === form.product_id),
    [products, form.product_id]
  );
  const currentStock = selectedProduct
    ? stockMap.get(selectedProduct.id) || 0
    : 0;

  const total = useMemo(() => {
    if (form.free) return 0;
    const q = Number(form.quantity) || 0;
    const p = Number(form.price_per_unit) || 0;
    return +(q * p).toFixed(2);
  }, [form.quantity, form.price_per_unit, form.free]);

  const customerOptions = useMemo(
    () =>
      contacts.filter((c) => c.type === 'customer' || c.type === 'both'),
    [contacts]
  );

  const overdraft =
    selectedProduct &&
    Number(form.quantity || 0) > currentStock &&
    Number(form.quantity || 0) > 0;

  const validate = () => {
    const e = {};
    if (!form.product_id) e.product_id = 'Produkt wählen.';
    if (!form.quantity || Number(form.quantity) <= 0)
      e.quantity = 'Menge muss > 0 sein.';
    if (!form.free) {
      if (form.price_per_unit === '' || Number(form.price_per_unit) < 0)
        e.price_per_unit = 'Preis ungültig.';
    }
    if (!form.date) e.date = 'Datum erforderlich.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (form.recipient.trim()) {
        await contactsApi.ensureByName(form.recipient, 'customer');
      }
      await salesApi.create({
        product_id: form.product_id,
        quantity: form.quantity,
        price_per_unit: form.free ? 0 : form.price_per_unit,
        recipient: form.recipient,
        date: form.date,
        notes: form.notes,
      });
      toast.success(form.free ? 'Abgabe erfasst.' : 'Verkauf erfasst.');
      setForm(initialForm());
    } catch (err) {
      toast.error(err.message || 'Fehler beim Speichern.');
    }
  };

  const noProducts = products.length === 0;

  return (
    <div className="space-y-4">
      <div className="hidden md:block">
        <h1 className="text-2xl font-semibold text-ink">Verkauf / Abgabe</h1>
        <p className="text-sm text-ink-mute">
          Warenausgang buchen — Bestand wird automatisch reduziert
        </p>
      </div>

      {noProducts && (
        <Card className="border-warn/40 bg-warn/5">
          <CardBody>
            <div className="text-sm text-warn">
              Keine Produkte vorhanden. Lege erst ein Produkt an.
            </div>
            <div className="mt-3">
              <Button onClick={() => setView('products')}>
                Zu den Produkten →
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="Neuer Verkauf" subtitle="Warenausgang" />
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Produkt" error={errors.product_id}>
              <Select
                value={form.product_id}
                onChange={(e) =>
                  setForm({ ...form, product_id: e.target.value })
                }
                disabled={noProducts}
              >
                <option value="">— wählen —</option>
                {products.map((p) => {
                  const stock = stockMap.get(p.id) || 0;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} — Bestand: {formatQuantity(stock, p.unit)}
                    </option>
                  );
                })}
              </Select>
            </Field>

            {selectedProduct && (
              <div className="text-xs text-ink-mute -mt-2">
                Aktueller Bestand:{' '}
                <span
                  className={`font-mono ${
                    currentStock <= 0 ? 'text-danger' : 'text-accent'
                  }`}
                >
                  {formatQuantity(currentStock, selectedProduct.unit)}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Menge"
                error={errors.quantity}
                hint={
                  overdraft
                    ? `⚠ Mehr als verfügbar (Bestand: ${formatQuantity(
                        currentStock,
                        selectedProduct?.unit || ''
                      )})`
                    : undefined
                }
              >
                <Input
                  type="number"
                  step="any"
                  min="0"
                  inputMode="decimal"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  placeholder="0"
                  className={overdraft ? '!border-warn focus:!ring-warn' : ''}
                />
              </Field>
              <Field
                label={`Preis / Einheit (${currency})`}
                error={errors.price_per_unit}
              >
                <Input
                  type="number"
                  step="any"
                  min="0"
                  inputMode="decimal"
                  disabled={form.free}
                  value={form.free ? '0' : form.price_per_unit}
                  onChange={(e) =>
                    setForm({ ...form, price_per_unit: e.target.value })
                  }
                  placeholder="0.00"
                />
              </Field>
            </div>

            <label className="flex items-center gap-2 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={form.free}
                onChange={(e) =>
                  setForm({ ...form, free: e.target.checked })
                }
                className="w-4 h-4 accent-accent"
              />
              <span className="text-sm text-ink-mute">
                Kostenlose Abgabe (Preis auf 0 setzen)
              </span>
            </label>

            <div className="flex items-center justify-between bg-bg-elevated border border-bg-border rounded-lg px-3 py-2">
              <span className="text-xs text-ink-mute uppercase tracking-wide">
                Gesamtpreis
              </span>
              <span className="text-lg font-mono text-accent">
                {formatMoney(total, currency)}
              </span>
            </div>

            <Field label="Empfänger / Kunde">
              <Input
                value={form.recipient}
                onChange={(e) =>
                  setForm({ ...form, recipient: e.target.value })
                }
                placeholder="Freitext oder bekannter Kontakt"
                list="customer-list"
              />
              <datalist id="customer-list">
                {customerOptions.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Datum" error={errors.date}>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Notizen" hint="Optional">
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Zusätzliche Infos…"
              />
            </Field>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setForm(initialForm())}
              >
                Zurücksetzen
              </Button>
              <Button type="submit" disabled={noProducts}>
                {form.free ? 'Abgabe speichern' : 'Verkauf speichern'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
