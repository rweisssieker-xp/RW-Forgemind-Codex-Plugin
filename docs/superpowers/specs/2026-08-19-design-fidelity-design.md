# Design Fidelity — Designvertrag und automatischer Korrektur-Loop

## Ziel

`$forgemind-design-fidelity` setzt lokale PNG-Referenzen als überprüfbaren Designvertrag durch. Es ordnet jede Referenz einer lokalen Web-Route und einem Viewport zu, misst die Abweichung zur laufenden Anwendung, korrigiert ausschließlich einschlägige UI-Dateien automatisch und wiederholt den Zyklus bis zur vereinbarten Toleranz oder einer dokumentierten Grenze.

Die Funktion ergänzt, aber ersetzt weder `$forgemind-evolve-ui` (produktseitige UX-Experimente) noch `$forgemind-xray` (nachgelagerte QA). Sie ist der Einstiegspunkt für eine möglichst referenztreue Umsetzung.

## Öffentliche Schnittstelle

```text
forgemind design-fidelity run --references <path[,path...]> [--route <local-or-test-url>] [--viewport <desktop|mobile>] [--threshold <percent>] [--max-iterations <n>]
forgemind design-fidelity status
```

`--references` akzeptiert einzelne lokale PNG-Dateien, lokale Ordner mit PNG-Dateien und kommaseparierte lokale Pfade. Die Dateien werden nur gelesen. Das System kopiert keine Referenz in Produktquellen und sendet sie nicht an einen Dienst.

Ohne explizite Route wird nur eine aus der Projektkonfiguration oder einer sicheren, lokalen Route abgeleitet. Ohne eindeutige Zuordnung entsteht ein Gap; keine Route wird erfunden. Desktop und Mobile sind getrennte Verträge. Defaults sind: `threshold=1.0` Prozent geänderter Pixel und `max-iterations=3`.

## Ablauf

1. **Designvertrag erstellen:** Dateiname, angegebene Zuordnung oder lokale Konfiguration bestimmen Route und Viewport. Die Referenz wird mit Digest, Dimensionen und Herkunft im Projektzustand festgehalten.
2. **Lokale Aufnahme:** Nur eine explizite Loopback- oder `.test`-App wird mit dem internen Browser oder einem bereits vorhandenen lokalen Playwright-Lauf geladen. Eine Aufnahme erhält dieselbe Route und denselben Viewport wie ihre Referenz.
3. **Messung:** Der Comparator dekodiert PNG-Pixel, berechnet den veränderten Pixelanteil und erzeugt ein Differenzbild. Zusätzlich erfasst er Größenunterschiede, fehlende sichtbare Bereiche und eine geometrische Bounding-Box der Differenz. Kein semantisches Erfolgssignal wird aus einem bloßen offenen Browserfenster abgeleitet.
4. **Korrektur:** Überschreitet die Messung die Toleranz, ermittelt der Lauf anhand des lokalen UI-Stacks die zugehörigen Komponenten, Styles und Assets. Er darf nur Quell-, Stil-, Template- und lokale Asset-Dateien im Workspace bearbeiten; keine Secrets, Lockfiles, Abhängigkeiten, Deployment-, Zahlungs-, Identitäts- oder produktiven Konfigurationsdateien.
5. **Verifikation und Wiederholung:** Nach jedem Patch laufen die passenden lokalen Prüfungen und die visuelle Aufnahme erneut. Der Lauf endet als `matched`, `improved`, `blocked` oder `unresolved`; er behauptet niemals eine Übereinstimmung ohne neue Screenshot-Messung.

## Automatische Änderung — Sicherheitsgrenzen

Automatische Korrekturen sind ausdrücklich erlaubt, aber nur innerhalb des UI-Scopes. Jede Iteration speichert Patch-Referenz, geänderte Dateien, Vorher-/Nachher-Screenshot, Messwerte, Testresultat und Begründung. Eine Iteration wird verworfen, wenn Tests fehlschlagen oder die Bildabweichung zunimmt, sofern der Nutzer nicht ausdrücklich einen abweichenden Modus gewählt hat.

Der Ablauf stoppt mit einem Gap, wenn eine Referenz nicht als kompatibles PNG dekodierbar ist, ein Server nicht sicher lokal erreichbar ist, dynamische/geschützte Daten die Darstellung bestimmen, die Route nicht zugeordnet werden kann, die Abweichung nach dem Iterationslimit verbleibt oder nur außerhalb des UI-Scopes liegende Änderungen helfen würden.

## Persistenz und Bericht

Alle erzeugten Daten liegen unter `.codex-orchestrator/design-fidelity/`: Designvertrag, Referenzkopie bzw. sicherer lokaler Verweis, Screenshots, Diffbilder, Iterationsprotokolle und der aktuelle Bericht. `--artifacts none` verhindert jede Projektpersistenz und erlaubt deshalb keinen automatischen Korrektur-Loop.

Der Markdown-Bericht enthält je Referenz: Zuordnung, Viewport, Toleranz, Ausgangs- und Endmessung, größte Diffregionen, angewandte Patches, Testresultate, Status sowie klare nächste Schritte. Das Dashboard erhält eine read-only Zusammenfassung.

## Tests und Abnahmekriterien

- lokale Datei-, Ordner- und Mehrfachreferenz-Eingaben werden sicher normalisiert; externe URLs und Pfadfluchten werden abgelehnt;
- ein Pixel-, Größen- und sichtbarer-Bereich-Diff ist deterministisch und bildet Diffartefakte;
- Route, Viewport und Screenshot werden stets als zusammengehöriger Vertrag geprüft;
- ein erfolgreicher UI-Patch senkt die Abweichung und wird mit Test- und Artefaktbelegen gespeichert;
- fehlgeschlagene Tests oder schlechtere Messungen bewahren den vorherigen Zustand und stoppen ehrlich;
- nach `max-iterations` bleibt ein offener Befund statt einer Erfolgsbehauptung;
- `--artifacts none` schreibt keine Zustände und führt keine automatischen Änderungen aus;
- Quelle und Marketplace-Spiegel bleiben identisch, Plugin-Validierung und vollständige CI bestehen.

## Nicht im Umfang

Keine Cloud-Bildanalyse, keine externen Browser, keine Anmeldung, keine Formularübermittlung, keine Installation von Browsern/Paketen, keine Änderung von Abhängigkeiten oder Lockfiles, keine automatische Auswahl produktiver URLs und keine Behauptung von Pixelgleichheit bei nicht gemessenen oder dynamischen Oberflächen.
