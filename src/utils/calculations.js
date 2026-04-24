/**
 * Pure aggregation helpers. All functions are side-effect-free and
 * accept already-fetched arrays so they're trivial to test.
 */

/**
 * Stock per product = sum(purchases.qty) - sum(sales.qty).
 * Returns a Map<product_id, number>.
 */
export function computeStockMap(purchases, sales) {
  const map = new Map();
  for (const p of purchases) {
    map.set(p.product_id, (map.get(p.product_id) || 0) + Number(p.quantity || 0));
  }
  for (const s of sales) {
    map.set(s.product_id, (map.get(s.product_id) || 0) - Number(s.quantity || 0));
  }
  return map;
}

export function getStock(productId, purchases, sales) {
  return computeStockMap(purchases, sales).get(productId) || 0;
}

export function totalSpent(purchases) {
  return purchases.reduce((sum, p) => sum + Number(p.price_total || 0), 0);
}

export function totalEarned(sales) {
  return sales.reduce((sum, s) => sum + Number(s.price_total || 0), 0);
}

export function profit(purchases, sales) {
  return totalEarned(sales) - totalSpent(purchases);
}

/**
 * Profit per product, weighted-average cost basis.
 *   COGS = avg_purchase_price * quantity_sold
 *   profit = revenue - COGS
 */
export function profitPerProduct(products, purchases, sales) {
  return products.map((product) => {
    const ps = purchases.filter((x) => x.product_id === product.id);
    const ss = sales.filter((x) => x.product_id === product.id);

    const totalQtyBought = ps.reduce((s, p) => s + Number(p.quantity || 0), 0);
    const totalSpent = ps.reduce((s, p) => s + Number(p.price_total || 0), 0);
    const avgCost = totalQtyBought > 0 ? totalSpent / totalQtyBought : 0;

    const totalQtySold = ss.reduce((s, x) => s + Number(x.quantity || 0), 0);
    const revenue = ss.reduce((s, x) => s + Number(x.price_total || 0), 0);
    const cogs = avgCost * totalQtySold;
    const profit = revenue - cogs;

    return {
      product,
      stock: totalQtyBought - totalQtySold,
      bought: totalQtyBought,
      sold: totalQtySold,
      spent: totalSpent,
      revenue,
      cogs,
      profit,
      avgCost,
    };
  });
}

/**
 * Aggregate profit per period bucket. period: "week" | "month".
 */
export function profitPerPeriod(purchases, sales, period = 'month') {
  const buckets = new Map();

  const bucketKey = (dateStr) => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return 'unknown';
    if (period === 'week') {
      // ISO week — simple version: Monday-based
      const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNum = tmp.getUTCDay() || 7;
      tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
      return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    }
    // month
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const ensure = (key) => {
    if (!buckets.has(key)) {
      buckets.set(key, { key, spent: 0, earned: 0, profit: 0 });
    }
    return buckets.get(key);
  };

  for (const p of purchases) {
    const b = ensure(bucketKey(p.date));
    b.spent += Number(p.price_total || 0);
    b.profit -= Number(p.price_total || 0);
  }
  for (const s of sales) {
    const b = ensure(bucketKey(s.date));
    b.earned += Number(s.price_total || 0);
    b.profit += Number(s.price_total || 0);
  }

  return Array.from(buckets.values()).sort((a, b) =>
    a.key.localeCompare(b.key)
  );
}

/**
 * Top-N products by revenue (sales total).
 */
export function topProductsByRevenue(products, sales, limit = 5) {
  const map = new Map();
  for (const s of sales) {
    map.set(s.product_id, (map.get(s.product_id) || 0) + Number(s.price_total || 0));
  }
  const productsById = new Map(products.map((p) => [p.id, p]));
  return Array.from(map.entries())
    .map(([id, revenue]) => ({
      product: productsById.get(id),
      revenue,
    }))
    .filter((x) => x.product)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/**
 * Top contacts by combined transaction volume (€).
 * Uses free-text fields purchases.source and sales.recipient.
 */
export function topContactsByVolume(purchases, sales, limit = 5) {
  const map = new Map();
  const bump = (name, value) => {
    if (!name) return;
    const key = name.trim();
    if (!key) return;
    map.set(key, (map.get(key) || 0) + Number(value || 0));
  };
  purchases.forEach((p) => bump(p.source, p.price_total));
  sales.forEach((s) => bump(s.recipient, s.price_total));
  return Array.from(map.entries())
    .map(([name, volume]) => ({ name, volume }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit);
}

/**
 * Merge purchases & sales into a unified, chronologically sorted feed.
 */
export function mergeTransactions(purchases, sales) {
  const tx = [
    ...purchases.map((p) => ({ ...p, _kind: 'purchase' })),
    ...sales.map((s) => ({ ...s, _kind: 'sale' })),
  ];
  return tx.sort((a, b) => {
    // Sort by date desc, then by created_at desc as tie-breaker
    const dateCmp = (b.date || '').localeCompare(a.date || '');
    if (dateCmp !== 0) return dateCmp;
    return (b.created_at || '').localeCompare(a.created_at || '');
  });
}
