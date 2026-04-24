import React, { useRef, useState } from 'react';
import { Card, CardBody, CardHeader } from './ui/Card.jsx';
import { Button } from './ui/Button.jsx';
import { Field, Input, Select } from './ui/Input.jsx';
import { ConfirmModal } from './ui/Modal.jsx';
import { useToast } from './ui/Toast.jsx';
import { useCurrency } from '../hooks/useCurrency.js';
import { APP_VERSION, metaApi, wipeDatabase } from '../db/database.js';
import { exportToJsonFile, importFromJsonFile } from '../utils/export.js';

const COMMON_CURRENCIES = ['€', '$', '£', 'CHF', 'PLN'];

export function Settings() {
  const currency = useCurrency();
  const toast = useToast();
  const fileRef = useRef(null);

  const [confirmImport, setConfirmImport] = useState(null); // pending File
  const [confirmWipeStep, setConfirmWipeStep] = useState(0); // 0|1|2

  const handleCurrencyChange = async (value) => {
    await metaApi.set('currency', value || '€');
    toast.success('Währung gespeichert.');
  };

  const handleExport = async () => {
    try {
      await exportToJsonFile();
      toast.success('Backup heruntergeladen.');
    } catch (err) {
      toast.error(err.message || 'Export fehlgeschlagen.');
    }
  };

  const handleFilePicked = (e) => {
    const file = e.target.files?.[0];
    if (file) setConfirmImport(file);
    e.target.value = ''; // allow re-pick of same file
  };

  const performImport = async () => {
    if (!confirmImport) return;
    try {
      await importFromJsonFile(confirmImport);
      toast.success('Backup importiert.');
    } catch (err) {
      toast.error(err.message || 'Import fehlgeschlagen.');
    } finally {
      setConfirmImport(null);
    }
  };

  const performWipe = async () => {
    try {
      await wipeDatabase();
      toast.success('Datenbank gelöscht.');
    } catch (err) {
      toast.error(err.message || 'Löschen fehlgeschlagen.');
    } finally {
      setConfirmWipeStep(0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="hidden md:block">
        <h1 className="text-2xl font-semibold text-ink">Einstellungen</h1>
        <p className="text-sm text-ink-mute">App-Konfiguration & Daten</p>
      </div>

      {/* Currency */}
      <Card>
        <CardHeader title="Anzeige" />
        <CardBody className="space-y-3">
          <Field label="Währungssymbol" hint="Wird in der ganzen App verwendet">
            <div className="flex gap-2">
              <Select
                value={
                  COMMON_CURRENCIES.includes(currency) ? currency : 'custom'
                }
                onChange={(e) => {
                  if (e.target.value !== 'custom') {
                    handleCurrencyChange(e.target.value);
                  }
                }}
                className="sm:max-w-[180px]"
              >
                {COMMON_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="custom">Benutzerdefiniert…</option>
              </Select>
              <Input
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="sm:max-w-[120px]"
                placeholder="€"
              />
            </div>
          </Field>
        </CardBody>
      </Card>

      {/* Backup / Restore */}
      <Card>
        <CardHeader
          title="Daten sichern & wiederherstellen"
          subtitle="Alles bleibt auf deinem Gerät — Export erzeugt eine JSON-Datei zum Download"
        />
        <CardBody className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleExport}>📤 JSON-Export</Button>
            <Button
              variant="secondary"
              onClick={() => fileRef.current?.click()}
            >
              📥 JSON-Import
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleFilePicked}
            />
          </div>
          <p className="text-xs text-ink-dim">
            Beim Import wird die <strong>komplette aktuelle Datenbank
            überschrieben</strong>. Lege vorher ein Export-Backup an.
          </p>
        </CardBody>
      </Card>

      {/* Danger zone */}
      <Card className="border-danger/30">
        <CardHeader
          title="Gefahrenzone"
          subtitle="Diese Aktion kann nicht rückgängig gemacht werden"
        />
        <CardBody>
          <Button
            variant="danger"
            onClick={() => setConfirmWipeStep(1)}
          >
            🗑 Datenbank komplett löschen
          </Button>
        </CardBody>
      </Card>

      {/* About */}
      <Card>
        <CardHeader title="Über" />
        <CardBody className="text-xs text-ink-mute space-y-1">
          <div>
            <strong className="text-ink">Inventory Tracker</strong> v{APP_VERSION}
          </div>
          <div>Offline-First Micro-ERP — alles lokal im Browser (IndexedDB).</div>
          <div>Keine Cloud, keine Logins, keine Tracker.</div>
        </CardBody>
      </Card>

      {/* Import confirmation */}
      <ConfirmModal
        open={!!confirmImport}
        title="Backup importieren?"
        message={
          confirmImport
            ? `"${confirmImport.name}" wird importiert. Die aktuelle Datenbank wird vorher gelöscht. Fortfahren?`
            : ''
        }
        confirmLabel="Importieren"
        onCancel={() => setConfirmImport(null)}
        onConfirm={performImport}
      />

      {/* Wipe confirmations (two-step) */}
      <ConfirmModal
        open={confirmWipeStep === 1}
        title="Wirklich alles löschen?"
        message="Alle Produkte, Einkäufe, Verkäufe und Kontakte werden unwiderruflich gelöscht. Hast du ein Backup gemacht?"
        confirmLabel="Ja, weiter"
        onCancel={() => setConfirmWipeStep(0)}
        onConfirm={() => setConfirmWipeStep(2)}
      />
      <ConfirmModal
        open={confirmWipeStep === 2}
        title="Letzte Bestätigung"
        message="Letzte Chance: Soll die Datenbank jetzt wirklich vollständig gelöscht werden?"
        confirmLabel="Endgültig löschen"
        onCancel={() => setConfirmWipeStep(0)}
        onConfirm={performWipe}
      />
    </div>
  );
}
