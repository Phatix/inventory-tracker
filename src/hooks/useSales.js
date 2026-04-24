import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database.js';

export function useSales() {
  return useLiveQuery(
    () => db.sales.orderBy('date').reverse().toArray(),
    [],
    []
  );
}
