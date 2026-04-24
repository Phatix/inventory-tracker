import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database.js';

/**
 * Live-reactive list of all products, sorted by name.
 * Returns `undefined` while the query is in flight (Dexie convention).
 */
export function useProducts() {
  return useLiveQuery(() => db.products.orderBy('name').toArray(), [], []);
}
