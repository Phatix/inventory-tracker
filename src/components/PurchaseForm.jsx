import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from './ui/Card.jsx';
import { Button } from './ui/Button.jsx';
import { Field, Input, Select, Textarea } from './ui/Input.jsx';
import { useToast } from './ui/Toast.jsx';
import { useProducts } from '../hooks/useProducts.js';
import { useContacts } from '../hooks/useContacts.js';
import { useCurrency } from '../hooks/useCurrency.js';
import { contactsApi, purchasesApi } from '../db/database.js';
import { formatMoney, todayIso } from '../utils/formatters.js';

const initialForm = () => ({
  product_id: '',
  quantity: '',
  price_per_unit: '',
  source: '',
  date: todayIso(),
  notes: '',
});

export function PurchaseForm({ setView }) {
  const products = useProducts() || [];
  const contacts = useContacts() || [];
  const currency = useCurrency();
  const toast = useToast();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  // Auto-pick first product when products load and none selected
  useEffect(() => {
    if (!form.product_id && products.length > 0) {
      setForm((f) => ({ ...f, product_id: products[0].id }));
    }
  }, [products, form.product_id]);

  const total = useMemo(() => {
    const q = Number(form.quantity) || 0;
    const p = Number(form.price_per_unit) || 0;
    return +(q * p).toFixed(2);
  }, [form.quantity, form.price_per_unit]);

  const supplierOptions = useMemo(
    () =>
      contacts.filter((c) => c.type === 'supplier' || c.type === 'both'),
    [contacts]
  );

  const validate = () => {
    const e = {};
    if (!form.product_id) e.product_id = 'Produkt wählen.';
    if (!form.quantity || Number(form.quantity) <= 0)
      e.quantity = 'Menge muss > 0 sein.';
    if (form.price_per_unit === '' || Number(form.price_per_unit) < 0)
      e.price_per_unit = 'Preis ungültig.';
    if (!form.date) e.date = 'Datum erforderlich.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      // Auto-create contact if a fresh name was typed
      if (form.source.trim()) {
        await contactsApi.ensureByName(form.source, 'supplier');
      }
      await purchasesApi.create(form);
      toast.success('Einkauf erfasst.');
      setForm(initialForm());
      // Stay on the form so user can quickly add another — common UX
    } catch (err) {
      toast.error(err.message || 'Fehler beim Speichern.');
    }
  };

  const noProducts = products.length === 0;

  return (
    <div className="space-y-4">
      <div className="hidden md:block">
        <h1 className="text-2xl font-semibold text-ink">Einkauf erfassen</h1>
        <p className="text-sm text-ink-mute">Wareneingang buchen — Bestand wird automatisch erhöht</p>
      </div>

      {noProducts && (
        <Card className="border-warn/40 bg-warn/5">
          <CardBody>
            <div className="text-sm text-warn">
              Du hast noch keine Produkte angelegt. Lege erst ein Produkt an,
              bevor du einen Einkauf erfasst.
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
        <CardHeader title="Neuer Einkauf" subtitle="Wareneingang" />
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
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unit})
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Menge" error={errors.quantity}>
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
                  value={form.price_per_unit}
                  onChange={(e) =>
                    setForm({ ...form, price_per_unit: e.target.value })
                  }
                  placeholder="0.00"
                />
              </Field>
            </div>

            <div className="flex items-center justify-between bg-bg-elevated border border-bg-border rounded-lg px-3 py-2">
              <span className="text-xs text-ink-mute uppercase tracking-wide">
                Gesamtpreis
              </span>
              <span className="text-lg font-mono text-accent">
                {formatMoney(total, currency)}
              </span>
            </div>

            <Field label="Quelle / Lieferant">
              <Input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="Freitext oder bekannter Kontakt"
                list="supplier-list"
              />
              <datalist id="supplier-list">
                {supplierOptions.map((c) => (
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
                placeholder="z.B. Rechnungsnummer, Bemerkungen…"
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
                Einkauf speichern
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
