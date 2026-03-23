# Sicherheitsanalyse – Budget Planner

> Analysedatum: 2026-03-23

## Zusammenfassung

Die Anwendung ist eine React-SPA mit Firebase (Auth + Firestore) als Backend. Es wurden **15 Sicherheitslücken** identifiziert, davon 2 kritisch.

---

## KRITISCH

### 1. Firebase-Zugangsdaten direkt im Quellcode

**Dateien:** `src/App.jsx`, `src/App_v1.jsx`, `src/App_v2.jsx`, `src/App_v3.jsx`, `src/App_v4.jsx` (Zeilen 9–16)

```js
const firebaseConfig = {
  apiKey: "AIzaSyDNscpBdHFmj9QSkS6UhwYsgQDCqiGlz4g",
  authDomain: "budget-planner-pro-37aca.firebaseapp.com",
  projectId: "budget-planner-pro-37aca",
  // ...
};
```

**Problem:** Zugangsdaten sind im Client-Code hart kodiert und für jeden sichtbar. Angreifer können direkt auf die Firestore-Datenbank zugreifen.

**Fix:** Zugangsdaten in `.env.local` auslagern (nie committen), per Vite-Umgebungsvariablen einbinden:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
```

---

### 2. Fehlende/ungeprüfte Firestore Security Rules

**Problem:** Es gibt keine Überprüfung im Code, ob Firestore-Regeln korrekt konfiguriert sind. Ohne korrekte Regeln kann jeder authentifizierte Nutzer alle Daten lesen/schreiben.

**Mindestanforderung für Firestore Rules:**
```
match /budgets/{userId} {
  allow read, write: if request.auth.uid == userId;
}
```

---

## HOCH

### 3. Kryptografisch unsichere ID-Generierung

**Datei:** `src/App.jsx`, Zeile 24

```js
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
```

**Problem:** `Math.random()` ist kryptografisch unsicher und vorhersagbar. Zeitstempel machen IDs zusätzlich vorhersagbar.

**Fix:**
```js
const uid = () => crypto.randomUUID().replace(/-/g, '');
```

---

### 4. Unverschlüsselte Daten in `localStorage`

**Datei:** `src/App.jsx`, Zeilen 1549–1608

```js
const userLocalKey = STORAGE_KEY + "_" + userId;
localStorage.setItem(userLocalKey, JSON.stringify({ _ts: nowIso, ...data }));
```

**Problem:** Finanzdaten liegen im Klartext im Browser-Speicher. Auf gemeinsam genutzten Geräten zugänglich.

**Fix:** Daten vor dem Speichern verschlüsseln (z.B. mit Web Crypto API) oder `sessionStorage` verwenden.

---

## MITTEL-HOCH

### 5. Unsichere JSON-Importfunktion (kein Schema-Validation)

**Datei:** `src/App.jsx`, Zeilen 1714–1733

```js
const imp = JSON.parse(e.target.result); // Keine Validierung
setData({ ...emptyData(), ...imp });      // Unkontrolliertes Merge
```

**Probleme:**
- Keine Dateigrößenbegrenzung (DoS möglich)
- Keine Schema-Validierung (beliebige Datenstruktur wird übernommen)
- Möglicher Prototype-Pollution-Angriff

**Fix:**
- Dateigröße begrenzen (z.B. max. 5 MB)
- Schema mit Zod oder JSON Schema validieren
- Jedes Entry einzeln validieren vor dem Import

---

### 6. Unkontrollierte Datenspeicherung in Firestore (Klartext)

**Datei:** `src/App.jsx`, Zeile 1615

```js
setDoc(docRef, { data: JSON.stringify(data), updatedAt }, { merge: true });
```

**Problem:** Alle Finanzdaten als JSON-String in Firestore ohne clientseitige Verschlüsselung.

**Fix:** Clientseitige Verschlüsselung vor dem Schreiben in Firestore implementieren.

---

## MITTEL

### 7. Fehlender Content-Security-Policy-Header

**Datei:** `index.html`

**Problem:** Keine CSP definiert. XSS-Angriffe werden nicht abgewehrt.

**Fix:** In `<head>` einfügen:
```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self';
           script-src 'self';
           connect-src 'self' https://*.googleapis.com https://*.firebaseio.com;
           img-src 'self' data: https:;">
```

---

### 8. Schwache Eingabevalidierung

**Datei:** `src/App.jsx`, mehrere Stellen

**Probleme:**
- Betrag: nur `parseFloat()` ohne Min/Max-Prüfung
- Beschreibung: keine Längen- oder Zeichenprüfung
- Kategorienname: nur `.trim()`, kein Längenlimit

**Fix:**
- Beträge auf sinnvollen Bereich prüfen (z.B. 0–999999.99)
- Textfelder auf Maximallänge beschränken
- Schema-Validierungsbibliothek (Zod) einsetzen

---

### 9. Schwaches Session-Management

**Problem:** Keine Session-Timeouts oder Idle-Logout implementiert. Bei längerer Inaktivität bleibt die Session offen.

**Fix:**
- 30-Minuten-Inaktivitäts-Timeout implementieren
- `onIdTokenChanged` für Token-Refresh nutzen

---

### 10. OAuth-Redirect ohne CSRF-Schutz

**Datei:** `src/App.jsx`, Zeilen 1517–1519

**Problem:** Bei `signInWithRedirect` wird kein `state`-Parameter zur CSRF-Absicherung gesetzt.

---

### 11. Keine Datenintegritätsprüfung

**Datei:** `src/App.jsx`, Zeilen 1556–1577

```js
const parsed = typeof remote === "string" ? JSON.parse(remote) : remote;
setData({ ...emptyData(), ...parsed });
```

**Problem:** Daten aus Firestore werden ohne Checksumme oder Signaturprüfung übernommen. Manipulationen bleiben unbemerkt.

---

### 12. Keine Rate-Limiting

**Problem:** Weder im Client noch serverseitig ist ein Rate-Limiting für Schreiboperationen oder Imports implementiert.

---

## NIEDRIG

### 13. Veraltete `document.execCommand`-API als Clipboard-Fallback

**Datei:** `src/App.jsx`, Zeilen 1694–1703

```js
document.execCommand("copy"); // deprecated
```

**Fix:** Fallback entfernen, nur `navigator.clipboard.writeText()` verwenden.

---

### 14. Kein Audit-Logging

**Problem:** Keine Protokollierung sicherheitsrelevanter Aktionen (Login, Datenexport, Import).

---

### 15. XSS-Risiko bei Anzeige von Google-Nutzerdaten

**Datei:** `src/App.jsx`, Zeile 2224

```jsx
{userInfo.name}
```

**Problem:** Nutzername aus Google Auth wird ohne Sanitierung gerendert. React escaped zwar standardmäßig, aber `userInfo.photo` als `src` direkt zu verwenden birgt SSRF/Open-Redirect-Risiken.

---

## Prioritätenliste

| Priorität | Maßnahme |
|-----------|----------|
| Sofort | Firebase-Zugangsdaten in `.env.local` auslagern |
| Sofort | Firestore Security Rules überprüfen/einrichten |
| Hoch | `Math.random()` durch `crypto.randomUUID()` ersetzen |
| Hoch | JSON-Import validieren (Schema + Dateigröße) |
| Mittel | CSP-Header in `index.html` ergänzen |
| Mittel | Eingabevalidierung mit Zod einführen |
| Mittel | Session-Timeout implementieren |
| Mittel | localStorage-Daten verschlüsseln |
| Niedrig | Clipboard-Fallback entfernen |
| Niedrig | Audit-Logging via Firebase Cloud Functions |
