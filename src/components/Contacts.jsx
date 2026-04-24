import React, { useMemo, useState } from 'react';
import { Card, CardBody, CardHeader } from './ui/Card.jsx';
import { Button } from './ui/Button.jsx';
import { Field, Input, Select, Textarea } from './ui/Input.jsx';
import { Modal, ConfirmModal } from './ui/Modal.jsx';
import { useToast } from './ui/Toast.jsx';
import { useContacts } from '../hooks/useContacts.js';
import { contactsApi } from '../db/database.js';

const TYPES = [
  { value: 'supplier', label: 'Lieferant' },
  { value: 'customer', label: 'Kunde' },
  { value: 'both', label: 'Beides' },
];

const EMPTY = { name: '', type: 'both', phone: '', notes: '' };

export function Contacts() {
  const contacts = useContacts() || [];
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (filterType && c.type !== filterType && c.type !== 'both') return false;
      if (filterType === 'both' && c.type !== 'both') return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.notes || '').toLowerCase().includes(q)
      );
    });
  }, [contacts, search, filterType]);

  return (
    <div className="space-y-4">
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Kontakte</h1>
          <p className="text-sm text-ink-mute">
            {contacts.length} Kontakt{contacts.length === 1 ? '' : 'e'}
          </p>
        </div>
        <Button onClick={() => setEditing('new')}>+ Neuer Kontakt</Button>
      </div>

      <div className="md:hidden">
        <Button className="w-full" onClick={() => setEditing('new')}>
          + Neuer Kontakt
        </Button>
      </div>

      <Card>
        <CardBody className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="sm:w-56"
          >
            <option value="">Alle Typen</option>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="!p-0">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-ink-dim text-sm">
              {contacts.length === 0
                ? 'Noch keine Kontakte angelegt. Kontakte werden auch automatisch beim Erfassen von Ein-/Verkäufen erstellt.'
                : 'Keine Treffer.'}
            </div>
          ) : (
            <ul className="divide-y divide-bg-border">
              {filtered.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-bg-elevated/50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">
                      {c.name}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="chip">
                        {TYPES.find((t) => t.value === c.type)?.label || c.type}
                      </span>
                      {c.phone && (
                        <span className="text-xs text-ink-mute">{c.phone}</span>
                      )}
                      {c.notes && (
                        <span className="text-xs text-ink-dim truncate max-w-[200px]">
                          {c.notes}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      className="!px-2"
                      onClick={() => setEditing(c)}
                      aria-label="Bearbeiten"
                    >
                      ✎
                    </Button>
                    <Button
                      variant="ghost"
                      className="!px-2 text-danger hover:!text-danger"
                      onClick={() => setConfirmDelete(c)}
                      aria-label="Löschen"
                    >
                      🗑
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <ContactFormModal
        open={editing !== null}
        contact={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onSaved={(name, isNew) => {
          toast.success(
            isNew ? `"${name}" angelegt.` : `"${name}" aktualisiert.`
          );
          setEditing(null);
        }}
      />

      <ConfirmModal
        open={!!confirmDelete}
        title="Kontakt löschen?"
        message={
          confirmDelete
            ? `"${confirmDelete.name}" wirklich löschen? Bereits erfasste Transaktionen behalten den Namen, verlieren aber die Verknüpfung.`
            : ''
        }
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          await contactsApi.remove(confirmDelete.id);
          toast.success(`"${confirmDelete.name}" gelöscht.`);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}

function ContactFormModal({ open, contact, onClose, onSaved }) {
  const isNew = !contact;
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (open) {
      setError('');
      setForm(
        contact
          ? {
              name: contact.name || '',
              type: contact.type || 'both',
              phone: contact.phone || '',
              notes: contact.notes || '',
            }
          : EMPTY
      );
    }
  }, [open, contact]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name ist erforderlich.');
      return;
    }
    try {
      if (isNew) {
        await contactsApi.create(form);
      } else {
        await contactsApi.update(contact.id, form);
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
      title={isNew ? 'Neuer Kontakt' : 'Kontakt bearbeiten'}
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
            placeholder="z.B. Hans Müller"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Typ">
            <Select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Telefon">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+49 …"
            />
          </Field>
        </div>
        <Field label="Notizen" hint="Optional">
          <Textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Adresse, E-Mail, Bemerkungen…"
          />
        </Field>
      </form>
    </Modal>
  );
}
