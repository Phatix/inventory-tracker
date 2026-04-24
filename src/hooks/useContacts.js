import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database.js';

export function useContacts() {
  return useLiveQuery(() => db.contacts.orderBy('name').toArray(), [], []);
}
