# Inventory Tracker — Offline-First Micro-ERP

Ein lokaler Mini-ERP zum Tracking von **Einkauf**, **Bestand** und
**Verkauf/Abgabe** für Kleinhändler oder Einzelpersonen. Alles läuft
komplett im Browser via IndexedDB — **kein Backend, keine Cloud, kein
Login**. Daten verlassen das Gerät nur über manuellen JSON-Export.

## Features

- 📊 **Dashboard** mit KPIs (Ausgaben, Einnahmen, Gewinn), Bestand pro
  Produkt, letzten Bewegungen und Low-Stock-Warnung
- 📦 **Produktverwaltung** (CRUD) mit Kategorien, Einheiten und Suche
- ⬇️ **Einkauf erfassen** mit Auto-Berechnung des Gesamtpreises und
  Lieferanten-Autocomplete
- ⬆️ **Verkauf / kostenlose Abgabe** mit Bestandsanzeige, Overdraft-Warnung
  und Empfänger-Autocomplete
- 📜 **Transaktionshistorie** mit Filter (Zeitraum, Produkt, Typ, Kontakt),
  Sortierung und Summenzeile
- 👥 **Kontakte** (Lieferanten / Kunden), automatisch beim Erfassen
  angelegt
- 📈 **Statistiken** mit Recharts: Profit pro Produkt, Profit pro
  Woche/Monat, Top-Produkte, Top-Kontakte
- ⚙️ **Settings** mit JSON-Export/-Import und vollständigem DB-Reset
- 🌙 Dark Theme, Mobile-First, Bottom-Tab-Bar auf Mobile, Sidebar auf
  Desktop
- 📴 100 % offline-fähig — funktioniert auch ohne Netz, lokal im Browser

## Tech-Stack

- **React 18** + Vite
- **Tailwind CSS 3** (Dark Theme)
- **Dexie.js** (IndexedDB-Wrapper) + `dexie-react-hooks` für Live-Queries
- **Recharts** für Visualisierungen
- **uuid** für IDs
- Kein Backend, kein Server, keine Auth, keine Telemetrie

## Setup

```bash
# 1. Dependencies installieren
npm install

# 2. Dev-Server starten
npm run dev

# 3. Im Browser öffnen — Vite zeigt die URL an (Standard: http://localhost:5173)
```

### Production-Build

```bash
npm run build
npm run preview
```

Der `dist/` Ordner enthält statische Dateien — kann auf jedem
beliebigen Webserver gehostet werden.

## 🚀 Deployment auf GitHub Pages (PWA)

Diese App ist als **PWA (Progressive Web App)** vorkonfiguriert. Das heißt: Dein
Kollege kann die App wie eine native App auf seinem Handy installieren (iOS/Android).

### Schritt 1: GitHub Repo erstellen

```bash
cd /home/mike/MIKE_OS/01_PROJEKTE/inventory-tracker
git remote add origin https://github.com/DEINUSERNAME/inventory-tracker.git
git branch -M main
git push -u origin main
```

### Schritt 2: GitHub Pages aktivieren

1. Gehe zu **Settings → Pages** (repo)
2. **Source:** `GitHub Actions`
3. Speichern

### Schritt 3: Deploy Workflow erstellen

Erstelle `.github/workflows/deploy.yml`:

```yaml
name: Deploy PWA to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Schritt 4: Link zum Kollegen

Nach dem Push → GitHub Actions läuft → 2-3 Min später:

```
https://Phatix.github.io/inventory-tracker/
```

Kollege öffnet Link auf seinem Handy:
- **Android:** Menu → "Zur App hinzufügen" / "Install app"
- **iOS:** Share → "Zum Startbildschirm"

Dann läuft die App **offline** auf seinem Handy! 📱

## Datenmodell

```
products    : id, name, category, unit, notes, created_at
purchases   : id, product_id, quantity, price_per_unit, price_total,
              source, date, notes, created_at
sales       : id, product_id, quantity, price_per_unit, price_total,
              recipient, date, notes, created_at
contacts    : id, name, type ("supplier"|"customer"|"both"),
              phone, notes, created_at
meta        : key, value (z.B. currency)
```

Berechneter Bestand:
```
stock(product) = Σ purchases.quantity − Σ sales.quantity
```

Gewinn pro Produkt nutzt einen **Weighted-Average-Cost-Basis** Ansatz:
COGS wird über den durchschnittlichen Einkaufspreis berechnet, nicht FIFO.

## Backup & Restore

- **Settings → JSON-Export** lädt eine Datei
  `inventory-tracker-backup-YYYY-MM-DDTHH-MM-SS.json` herunter.
- **Settings → JSON-Import** überschreibt die komplette aktuelle
  Datenbank mit dem Inhalt der gewählten Datei (mit Bestätigung).
- **Datenbank löschen** (Gefahrenzone) wischt alle Tabellen — mit
  zweistufiger Bestätigung.

## Projektstruktur

```
src/
├── components/
│   ├── Dashboard.jsx
│   ├── Products.jsx
│   ├── PurchaseForm.jsx
│   ├── SaleForm.jsx
│   ├── History.jsx
│   ├── Contacts.jsx
│   ├── Stats.jsx
│   ├── Settings.jsx
│   ├── Layout.jsx
│   └── ui/
│       ├── Button.jsx
│       ├── Input.jsx
│       ├── Modal.jsx
│       ├── Toast.jsx
│       └── Card.jsx
├── db/
│   └── database.js          # Dexie-Schema + APIs
├── hooks/
│   ├── useProducts.js
│   ├── usePurchases.js
│   ├── useSales.js
│   ├── useContacts.js
│   └── useCurrency.js
├── utils/
│   ├── calculations.js      # Aggregationen, Stock, Profit
│   ├── formatters.js        # Zahlen, Datum, Geld
│   └── export.js            # JSON Im-/Export
├── App.jsx
├── main.jsx
└── index.css
```

## Datenschutz

- **Keine Netzwerkverbindungen** — die App lädt nur die statischen
  Dateien beim ersten Aufruf, danach läuft alles lokal.
- **Keine Telemetrie / kein Tracking.**
- **Daten** liegen ausschließlich in der IndexedDB des Browsers im
  Origin der App. Beim Leeren der Browser-Daten gehen sie verloren —
  also regelmäßig exportieren.

## Roadmap-Ideen

- Filter „nur kostenlose Abgaben"
- CSV-Export zusätzlich zu JSON
- PWA-Manifest + Service Worker für vollständige Offline-Installation
- Mehrere Lager / Standorte
- Optionale FIFO-/LIFO-Kostenberechnung

---

## ⚖️ Rechtliche Hinweise & Disclaimer

### Lizenz & Nutzung
Dieses Projekt wird unter der **MIT-Lizenz** zur Verfügung gestellt. Du darfst es verwenden, verändern und weitergeben — mit oder ohne Nennung (optional, aber gerne gesehen).

**Entwicklung:**
- Geschrieben von: **Mike** (MIKE_OS)
- Mit Unterstützung durch: **Claude (Anthropic)**
- Zusammenarbeit dokumentiert

---

### ⚠️ Haftungsausschluss (AS-IS)

Diese Software wird **ohne jegliche Garantie** zur Verfügung gestellt:

1. **Keine Haftung für Datenverlust**
   - Die App speichert Daten lokal in deinem Browser (IndexedDB)
   - Browser-Cache löschen = Daten weg
   - Regelmäßige Backups (JSON-Export) sind DEINE Verantwortung
   - Wir haften nicht für verlorene Daten

2. **Keine Haftung für Fehler**
   - Die App kann Rechenfehler, Bugs oder Datenbeschädigungen enthalten
   - Alle berechneten Werte (Gewinn, Bestand, etc.) sollten verifiziert werden
   - Verwende dies nicht als alleinige Basis für geschäftskritische Entscheidungen

3. **Keine Garantie für Verfügbarkeit**
   - Browser-Updates können die Nutzung beeinflussen
   - Die App ist vollständig offline, aber Hardware/Browser-Fehler können Datenverlust verursachen

4. **Keine Haftung für Geschäftsschäden**
   - Nutzung auf eigenes Risiko
   - Wir haften nicht für indirekte Schäden, entgangene Gewinne oder andere Folgeschäden

---

### 🔐 Datenschutz & Privatsphäre

- ✅ **Keine Datensammlung:** Die App sendet keine Daten an Server
- ✅ **Keine Telemetrie:** Keine Nutzungstracking
- ✅ **Lokal nur:** Alle Daten bleiben auf deinem Gerät
- ⚠️ **ABER:** Wir garantieren nicht, dass keine Sicherheitslücken existieren

---

### 📋 Nutzungsbedingungen für Weitergabe

Falls du diese App an Dritte weitergibst (Kollegen, Kunden, etc.):

1. **Weitergabehaftung:** Der Weitergeber (du) informierst den Empfänger über diesen Disclaimer
2. **Support:** Es gibt keinen technischen Support — ist Open-Source, selbst helfen
3. **Modifikationen:** Wenn jemand die App verändert, trägt ER die Verantwortung für die Änderungen
4. **Geschäftliche Nutzung:** Die App ist für Hobby-/Kleinunternehmer gedacht — nicht für große Systeme

---

### 🛡️ Was wir empfehlen

- 📅 **Regelmäßige Backups** → Settings → JSON-Export mindestens 1x pro Woche
- 🔍 **Verifizierung:** Alle kritischen Zahlen (Gewinn, Bestand) regelmäßig prüfen
- 📱 **Browser wählen:** Chrome/Firefox/Safari — getestet, am sichersten
- 💾 **Wichtige Daten extern sichern** → nicht nur im Browser

---

### 📧 Kontakt & Support

- Fragen zu **diesem Code** → Issues auf GitHub (falls vorhanden)
- **Kein offizieller Support** — Community-basiert, best-effort
- Bugs können gemeldet werden, Fixes sind nicht garantiert

---

## Lizenz: MIT

```
MIT License

Copyright (c) 2026 Mike (MIKE_OS) & Claude (Anthropic)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
