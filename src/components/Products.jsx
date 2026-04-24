import React, { useMemo, useState } from 'react';
import { Card, CardBody, CardHeader } from './ui/Card.jsx';
import { Button } from './ui/Button.jsx';
import { Field, Input, Select, Textarea } from './ui/Input.jsx';
import { Modal, ConfirmModal } from './ui/Modal.jsx';
import { useToast } from './ui/Toast.jsx';
import { useProducts } from '../hooks/useProducts.js';
import { usePurchases } from '../hooks/usePurchases.js';
import { useSales } from '../hooks/useSales.js';
import { productsApi } from '../db/database.js';
import { computeStockMap } from '../utils/calculations.js';
import { formatQuantity } from '../utils/formatters.js';

const COMMON_UNITS = ['Stück', 'g', 'kg', 'ml', 'L', 'm', 'cm', 'Pkg'];

const EMPTY_FORM = {
  name: '',
  category: '',
  unit: 'Stück',
  notes: '',
};

export function Products() {
  const products = useProducts() || [];
  const purchases = usePurchases() || [];
  const sales = useSales() || [];
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [confirmDelete, setConfirmDelete] = useState(null);

  const stockMap = useMemo(
    () => computeStockMap(purchases, sales),
    [purchases, sales]
  );

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (filterCategory && p.category !== filterCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.notes || '').toLowerCase().includes(q)
      );
    });
  }, [products, search, filterCategory]);

  return (
    <div className="space-y-4">
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Produkte</h1>
          <p className="text-sm text-ink-mute">
            {products.length} angelegt · {filtered.length} sichtbar
          </p>
        </div>
        <Button onClick={() => setEditing('new')}>+ Neues Produkt</Button>
      </div>

      <div className="md:hidden">
        <Button className="w-full" onClick={() => setEditing('new')}>
          + Neues Produkt
        </Button>
      </div>

      {/* Search/filter bar */}
      <Card>
        <CardBody className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="sm:w-56"
          >
            <option value="">Alle Kategorien</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </CardBody>
      </Card>

      {/* List */}
      <Card>
        <CardBody className="!p-0">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-ink-dim text-sm">
              {products.length === 0
                ? 'Noch keine Produkte angelegt.'
                : 'Keine Treffer für die aktuellen Filter.'}
            </div>
          ) : (
            <ul className="divide-y divide-bg-border">
              {filtered.map((p) => {
                const stock = stockMap.get(p.id) || 0;
                const low = stock <= 0;
                return (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-bg-elevated/50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink truncate">
                        {p.name}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {p.category && (
                          <span className="chip">{p.category}</span>
                        )}
                        <span className="chip">{p.unit}</span>
                        {p.notes && (
                          <span className="text-xs text-ink-dim truncate max-w-[200px]">
                            {p.notes}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-mono ${
                          low ? 'text-danger' : 'text-accent'
                        }`}
                      >
                        {formatQuantity(stock, p.unit)}
                      </div>
                      <div className="text-[11px] text-ink-dim">Bestand</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        className="!px-2"
                        onClick={() => setEditing(p)}
                        aria-label="Bearbeiten"
                      >
                        ✎
                      </Button>
                      <Button
                        variant="ghost"
                        className="!px-2 text-danger hover:!text-danger"
                        onClick={() => setConfirmDelete(p)}
                        aria-label="Löschen"
                      >
                        🗑
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <ProductFormModal
        open={editing !== null}
        product={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onSaved={(name, isNew) => {
          toast.success(
            isNew ? `"${name}" angelegt.` : `"${name}" aktualisiert.`
          );
          setEditing(null);
        }}
      />

      <ConfirmDeleteProduct
        product={confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onDeleted={(name) => {
          toast.success(`"${name}" gelöscht.`);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}

function ProductFormModal({ open, product, onClose, onSaved }) {
  const isNew = !product;
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (open) {
      setError('');
      setForm(
        product
          ? {
              name: product.name || '',
              category: product.category || '',
              unit: product.unit || 'Stück',
              notes: product.notes || '',
            }
          : EMPTY_FORM
      );
    }
  }, [open, product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name ist erforderlich.');
      return;
    }
    try {
      if (isNew) {
        await productsApi.create(form);
      } else {
        await productsApi.update(product.id, form);
      }
      onSaved(form.name.trim(), isNew);
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? 'Neues Produkt' : 'Produkt bearbeiten'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit}>Speichern</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Name" error={error}>
          <Input
            autoFocus
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="z.B. Bluetooth-Lautsprecher"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kategorie">
            <Input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="z.B. Elektronik"
              list="cat-suggestions"
            />
          </Field>
          <Field label="Einheit">
            <Select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            >
              {COMMON_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Notizen" hint="Optional">
          <Textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Zusätzliche Infos…"
          />
        </Field>
      </form>
    </Modal>
  );
}

function ConfirmDeleteProduct({ product, onCancel, onDeleted }) {
  const [hasTx, setHasTx] = useState(false);
  const [checking, setChecking] = useState(false);

  React.useEffect(() => {
    let cancelled = false;
    if (product) {
      setChecking(true);
      productsApi.hasTransactions(product.id).then((v) => {
        if (!cancelled) {
          setHasTx(v);
          setChecking(false);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [product]);

  if (!product) return null;

  return (
    <ConfirmModal
      open={!!product}
      title="Produkt löschen?"
      message={
        checking
          ? 'Prüfe Transaktionen…'
          : hasTx
            ? `"${product.name}" hat bereits Ein-/Verkäufe. Beim Löschen verweisen diese Transaktionen ins Leere — die Historie zeigt sie dann als "gelöscht". Trotzdem löschen?`
            : `"${product.name}" wirklich löschen?`
      }
      confirmLabel="Löschen"
      onCancel={onCancel}
      onConfirm={async () => {
        await productsApi.remove(product.id);
        onDeleted(product.name);
      }}
    />
  );
}
