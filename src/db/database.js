/**
 * Dexie schema + helpers for the Inventory Tracker.
 *
 * Stores:
 *   - products  : master data
 *   - purchases : incoming stock movements
 *   - sales     : outgoing stock movements (incl. free hand-outs with price=0)
 *   - contacts  : suppliers / customers
 *   - meta      : key/value app settings (currency, version, etc.)
 *
 * Everything is local — no network calls. Mutations go through the
 * helpers below so we can keep the API consistent and easy to mock.
 */

import Dexie from 'dexie';
import { v4 as uuid } from 'uuid';

export const DB_NAME = 'inventory-tracker';
export const APP_VERSION = '0.1.0';

export const db = new Dexie(DB_NAME);

db.version(1).stores({
  // Indexes (not the full schema — Dexie only needs the queryable fields)
  products: 'id, name, category, created_at',
  purchases: 'id, product_id, date, created_at',
  sales: 'id, product_id, date, created_at',
  contacts: 'id, name, type, created_at',
  meta: 'key',
});

// ---------- Generic helpers ----------

const now = () => new Date().toISOString();

const newId = () => uuid();

// ---------- Products ----------

export const productsApi = {
  list: () => db.products.orderBy('name').toArray(),
  get: (id) => db.products.get(id),

  async create({ name, category = '', unit = 'Stück', notes = '' }) {
    const product = {
      id: newId(),
      name: name.trim(),
      category: category.trim(),
      unit: unit.trim() || 'Stück',
      notes: notes.trim(),
      created_at: now(),
    };
    await db.products.add(product);
    return product;
  },

  async update(id, patch) {
    const clean = { ...patch };
    if (clean.name !== undefined) clean.name = clean.name.trim();
    if (clean.category !== undefined) clean.category = clean.category.trim();
    if (clean.unit !== undefined) clean.unit = clean.unit.trim() || 'Stück';
    if (clean.notes !== undefined) clean.notes = clean.notes.trim();
    await db.products.update(id, clean);
    return db.products.get(id);
  },

  async remove(id) {
    // Caller is responsible for warning the user about existing transactions.
    await db.products.delete(id);
  },

  async hasTransactions(id) {
    const [p, s] = await Promise.all([
      db.purchases.where('product_id').equals(id).count(),
      db.sales.where('product_id').equals(id).count(),
    ]);
    return p + s > 0;
  },
};

// ---------- Purchases ----------

export const purchasesApi = {
  list: () => db.purchases.orderBy('date').reverse().toArray(),
  get: (id) => db.purchases.get(id),
  byProduct: (product_id) =>
    db.purchases.where('product_id').equals(product_id).toArray(),

  async create({
    product_id,
    quantity,
    price_per_unit,
    source = '',
    date,
    notes = '',
  }) {
    const qty = Number(quantity) || 0;
    const ppu = Number(price_per_unit) || 0;
    const purchase = {
      id: newId(),
      product_id,
      quantity: qty,
      price_per_unit: ppu,
      price_total: +(qty * ppu).toFixed(2),
      source: source.trim(),
      date: date || now().slice(0, 10),
      notes: notes.trim(),
      created_at: now(),
    };
    await db.purchases.add(purchase);
    return purchase;
  },

  async update(id, patch) {
    const current = await db.purchases.get(id);
    if (!current) return null;
    const merged = { ...current, ...patch };
    merged.quantity = Number(merged.quantity) || 0;
    merged.price_per_unit = Number(merged.price_per_unit) || 0;
    merged.price_total = +(merged.quantity * merged.price_per_unit).toFixed(2);
    if (typeof merged.source === 'string') merged.source = merged.source.trim();
    if (typeof merged.notes === 'string') merged.notes = merged.notes.trim();
    await db.purchases.put(merged);
    return merged;
  },

  remove: (id) => db.purchases.delete(id),
};

// ---------- Sales ----------

export const salesApi = {
  list: () => db.sales.orderBy('date').reverse().toArray(),
  get: (id) => db.sales.get(id),
  byProduct: (product_id) =>
    db.sales.where('product_id').equals(product_id).toArray(),

  async create({
    product_id,
    quantity,
    price_per_unit,
    recipient = '',
    date,
    notes = '',
  }) {
    const qty = Number(quantity) || 0;
    const ppu = Number(price_per_unit) || 0;
    const sale = {
      id: newId(),
      product_id,
      quantity: qty,
      price_per_unit: ppu,
      price_total: +(qty * ppu).toFixed(2),
      recipient: recipient.trim(),
      date: date || now().slice(0, 10),
      notes: notes.trim(),
      created_at: now(),
    };
    await db.sales.add(sale);
    return sale;
  },

  async update(id, patch) {
    const current = await db.sales.get(id);
    if (!current) return null;
    const merged = { ...current, ...patch };
    merged.quantity = Number(merged.quantity) || 0;
    merged.price_per_unit = Number(merged.price_per_unit) || 0;
    merged.price_total = +(merged.quantity * merged.price_per_unit).toFixed(2);
    if (typeof merged.recipient === 'string')
      merged.recipient = merged.recipient.trim();
    if (typeof merged.notes === 'string') merged.notes = merged.notes.trim();
    await db.sales.put(merged);
    return merged;
  },

  remove: (id) => db.sales.delete(id),
};

// ---------- Contacts ----------

export const contactsApi = {
  list: () => db.contacts.orderBy('name').toArray(),
  get: (id) => db.contacts.get(id),

  async create({ name, type = 'both', phone = '', notes = '' }) {
    const contact = {
      id: newId(),
      name: name.trim(),
      type, // "supplier" | "customer" | "both"
      phone: phone.trim(),
      notes: notes.trim(),
      created_at: now(),
    };
    await db.contacts.add(contact);
    return contact;
  },

  async update(id, patch) {
    const clean = { ...patch };
    if (clean.name !== undefined) clean.name = clean.name.trim();
    if (clean.phone !== undefined) clean.phone = clean.phone.trim();
    if (clean.notes !== undefined) clean.notes = clean.notes.trim();
    await db.contacts.update(id, clean);
    return db.contacts.get(id);
  },

  remove: (id) => db.contacts.delete(id),

  /**
   * Ensure a contact with the given name exists; create one if not.
   * Used by purchase/sale forms when the user types a fresh name.
   */
  async ensureByName(name, type) {
    if (!name || !name.trim()) return null;
    const trimmed = name.trim();
    const existing = await db.contacts
      .filter((c) => c.name.toLowerCase() === trimmed.toLowerCase())
      .first();
    if (existing) {
      // Promote to "both" if needed
      if (existing.type !== type && existing.type !== 'both') {
        await db.contacts.update(existing.id, { type: 'both' });
      }
      return existing;
    }
    return contactsApi.create({ name: trimmed, type });
  },
};

// ---------- Meta / settings ----------

export const metaApi = {
  async get(key, fallback = null) {
    const row = await db.meta.get(key);
    return row ? row.value : fallback;
  },
  async set(key, value) {
    await db.meta.put({ key, value });
    return value;
  },
};

// ---------- Bulk operations ----------

/**
 * Wipe everything. Used by Settings → "Datenbank löschen".
 * Caller should confirm twice with the user before invoking.
 */
export async function wipeDatabase() {
  await db.transaction(
    'rw',
    db.products,
    db.purchases,
    db.sales,
    db.contacts,
    db.meta,
    async () => {
      await Promise.all([
        db.products.clear(),
        db.purchases.clear(),
        db.sales.clear(),
        db.contacts.clear(),
        db.meta.clear(),
      ]);
    }
  );
}

/**
 * Dump the entire DB to a plain object suitable for JSON.stringify.
 */
export async function dumpDatabase() {
  const [products, purchases, sales, contacts, meta] = await Promise.all([
    db.products.toArray(),
    db.purchases.toArray(),
    db.sales.toArray(),
    db.contacts.toArray(),
    db.meta.toArray(),
  ]);
  return {
    app: 'inventory-tracker',
    version: APP_VERSION,
    exported_at: now(),
    data: { products, purchases, sales, contacts, meta },
  };
}

/**
 * Restore a dump produced by dumpDatabase. Replaces existing data.
 */
export async function restoreDatabase(payload) {
  if (!payload || !payload.data) {
    throw new Error('Ungültiges Backup-Format.');
  }
  const { products = [], purchases = [], sales = [], contacts = [], meta = [] } =
    payload.data;
  await db.transaction(
    'rw',
    db.products,
    db.purchases,
    db.sales,
    db.contacts,
    db.meta,
    async () => {
      await Promise.all([
        db.products.clear(),
        db.purchases.clear(),
        db.sales.clear(),
        db.contacts.clear(),
        db.meta.clear(),
      ]);
      await Promise.all([
        db.products.bulkAdd(products),
        db.purchases.bulkAdd(purchases),
        db.sales.bulkAdd(sales),
        db.contacts.bulkAdd(contacts),
        db.meta.bulkAdd(meta),
      ]);
    }
  );
}
