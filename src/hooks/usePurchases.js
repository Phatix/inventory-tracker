import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database.js';

export function usePurchases() {
  return useLiveQuery(
    () => db.purchases.orderBy('date').reverse().toArray(),
    [],
    []
  );
}
