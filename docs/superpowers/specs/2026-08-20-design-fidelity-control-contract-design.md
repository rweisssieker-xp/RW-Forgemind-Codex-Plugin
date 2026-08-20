# Design Fidelity — Control-Vertrag aus Bildreferenzen

## Ziel

`$forgemind-design-fidelity` soll PNG-Referenzen nicht nur visuell annähern, sondern ihre sichtbaren Bedienkonzepte in echte, zugängliche Anwendungskontrollen überführen. Ein Button im Bild wird als Button mit Name und sicherer Aktion umgesetzt, ein Suchfeld als Eingabefeld, Tabs als Tablist und Navigation als Navigation — nicht als rein dekorative Fläche.

## Architektur

Die Bildinterpretation erfolgt durch den multimodalen Codex-Agenten im Einstiegspunkt; der lokale Node-Lauf interpretiert keine Bildinhalte per Cloud oder stiller KI-API. Der Agent schreibt aus der Referenz einen projektlokalen `control-contract` und verwendet ihn bei der automatischen UI-Korrektur. Die CLI misst anschließend sowohl Bildtreue als auch die über gebündelte Browser-/DOM-Belege nachweisbaren Controls.

## Control-Vertrag

Jede Referenz bekommt neben Route, Viewport und Pixel-Toleranz eine geordnete Liste:

```json
{
  "id": "primary-cta",
  "role": "button",
  "name": "Start free trial",
  "visibleText": "Start free trial",
  "region": { "x": 920, "y": 48, "width": 180, "height": 44 },
  "state": "enabled",
  "safeInteraction": { "type": "navigate", "target": "/signup" }
}
```

Erlaubte Rollen sind `button`, `link`, `textbox`, `searchbox`, `checkbox`, `radio`, `combobox`, `tab`, `navigation`, `heading`, `img`, `card` und `status`. Namen und sichtbarer Text werden aus der Referenz übernommen, sofern lesbar; unsichere oder nicht lesbare Inhalte bleiben als Annahme markiert und werden nicht erfunden.

## Sichere Interaktionen

Erlaubt sind Seitenaufruf, gleiche-Origin-Navigation über ausdrücklich freigegebene Links, Tab-/Akkordeon-Zustandswechsel sowie nicht-absendende Validierung leerer Pflichtfelder. Nicht erlaubt sind Anmeldung, tatsächliche Formularübermittlung, Upload, Download, Speichern, Löschen, Konto-/Admin-Aktionen, Zahlung, Deployment oder der Zugriff auf Cookies, Speicher und Credentials.

Der Browser-Beleg verbindet Contract-ID, Rolle, zugänglichen Namen, sichtbaren Zustand, URL, Screenshot, Aktion und Ergebnis. Nicht nachweisbare Controls sind ein Gap, keine Erfolgsmeldung.

## Automatische Umsetzung

Bei einer visuellen Abweichung liest der Agent zuerst den Control-Vertrag. Er ergänzt oder korrigiert nur UI-Dateien innerhalb des bestehenden Design-Fidelity-Scopes. Jede Änderung muss gleichzeitig:

- ein semantisches Control mit zugänglichem Namen erzeugen oder erhalten;
- den erwarteten sichtbaren Text/Zustand abbilden;
- eine sichere, im Vertrag erlaubte Interaktion erfüllen, wenn eine solche definiert ist;
- den erneuten Pixelvergleich und die lokale Control-Prüfung verbessern.

Der Agent stoppt bei mehrdeutiger Bildbedeutung, fehlender lokaler Route, nicht sicher ausführbarer Interaktion oder einer nötigen Änderung außerhalb des UI-Scopes.

## Nachweise und Bericht

`control-contract.json`, Control-Prüfbelege und der Kombinationsstatus liegen unter `.codex-orchestrator/design-fidelity/`. Der Bericht zeigt je Referenz: visuelle Messung, erkannte bzw. angenommene Controls, belegte Controls, sichere Interaktionen, offene Gaps und durchgeführte UI-Korrekturen.

## Abnahmekriterien

- Ein referenzierter Button wird als echtes Button-Control mit demselben zugänglichen Namen nachgewiesen.
- Sichtbare Inputs, Navigation und Tabs sind als korrekte Rollen nachweisbar.
- Ein erlaubter Zustandswechsel oder eine gleiche-Origin-Navigation wird nur mit Vorher-/Nachher-Belegen als bestanden bewertet.
- Nicht erlaubte oder unklare Aktionen werden nicht ausgeführt und als Gap dokumentiert.
- Ein Ergebnis ist nur `matched`, wenn Bildtoleranz und alle erforderlichen Control-Belege erfüllt sind.
- Quelle und Marketplace-Spiegel bleiben gleich; vollständige CI und strikte Plugin-Validierung bleiben grün.
