# NorthGuard · Übergabe an die Implementierung

Stand: Runde 4 (13.09.2026). Quelle der Visuals: `NorthGuard Chat.dc.html` (Turns 1–4), klickbarer Referenzfluss: `NorthGuard Prototyp.dc.html`. Deutsch ist der Designfall; Englisch darf nichts brechen.

---

## 0 · Die Regeln, die in keinem Bild stehen

Diese Liste ist der wichtigste Teil des Dokuments. Wenn eine Implementierungsentscheidung einer Regel hier widerspricht, gewinnt die Regel.

1. **Chrome im Verhältnis zum Fund.** Ein sauberer Prompt zeigt eine Mono-Zeile im Composer-Fuß, sonst nichts. Der Spiegel öffnet nur bei Fund. Das Bereichsmenü beschriftet sich um („6 Bereiche geschützt“ → „1 Bereich berührt“ → „Nur Regeln aktiv“), statt dauerhaft eine Liste offen zu halten. Keine Häkchen, keine grüne Farbe.
2. **Nichts ist je „sicher“.** Der saubere Zustand heißt „nichts erkannt“. Wörter wie „sicher“, „geschützt“ (auf einen Prompt bezogen), „geprüft ✓“ kommen nicht vor. Die Fußnote sagt: „Die Erkennung ist wahrscheinlichkeitsbasiert.“
3. **Degradierte Abdeckung wird nie verborgen.** Fällt die KI-Prüfung aus, steht das im Composer-Streifen und im Bereichsmenü-Knopf; das Detailpanel nennt Ausfallbeginn, Dauer, letzter Versuch, nächster Versuch, Benachrichtigte, Protokolleintrag. Ohne diese Angaben ist der Hinweis nach einem Tag Tapete.
4. **Der Draht ist das Einzige, was das Haus verlässt — auch als Verlauf.** Jede Unterhaltung hat zwei Transkripte: die lokale Fassung (Original + wiederhergestellte Werte) und das Draht-Transkript (Platzhalter). Nur das zweite wird je übermittelt, auch als Kontext späterer Nachrichten. „Anbietersicht“ zeigt exakt dieses Transkript.
5. **Original nur in dieser Sitzung.** Der Originaltext bleibt im Browser, wird nicht ins Prüfprotokoll geschrieben und ist beim Schließen der Unterhaltung weg. Die Fläche, die das Original zeigt, trägt diese Regel als Text.
6. **Es wird nichts geraten.** Ein Platzhalter wird nur ersetzt, wenn er unverändert zurückkommt. Gebeugte oder umschriebene Formen bleiben Platzhalter in Amber, mit Vorschlag und expliziter Aktion („Wert einsetzen“ / „So lassen“). Mehrere gleichartige Entitäten tragen einen Index (⟨Lieferant 1⟩, ⟨Lieferant 2⟩), der als hochgestellte Ziffer am Wert bleibt.
7. **Keine Freigabe pro Prompt.** Der Weg aus einer Blockade ist umformulieren (mit Rücknahme) oder Fehlalarm melden. Es gibt keinen Manager in der Schleife einer einzelnen Frage. Dieser Satz steht im UI an der Blockade.
8. **Jede Meldung bekommt eine Antwort**, auch ein Nein mit Begründung. Sie erscheint als stille Zeile in der Unterhaltung, in der es passierte — keine Benachrichtigungszentrale, kein Toast.
9. **Managementsicht ohne Personenspalte, strukturell.** Sie kennt Bereiche, Wochen, Zählungen, Themen. Wer gefragt hat, existiert dort nicht als Feld. Das Prüfprotokoll kennt Benutzerkennungen; der Unterschied wird im UI benannt. Fehlalarme werden nach Auslöser gruppiert, nie nach Melder.
10. **Jede Regeländerung ist ein Protokolleintrag** mit Name, Zeitpunkt, Begründung, Anlass (FA-Nummer) und Wirkung („41 → 12 Treffer in 30 Tagen“). Verwerfen ist ebenfalls ein Eintrag. Die Geschäftsführung wird informiert, nicht gefragt.
11. **Sprache in drei Ebenen.** Oberfläche folgt der Person (per-user). Bereichs- und Regelnamen folgen dem Richtliniendokument (Original, Übersetzung daneben in Muted). Platzhalter im Draht und Nachweis-Export folgen dem Mandanten (bei Einrichtung festgelegt, protokolliert, nicht pro Export wählbar).
12. **Schätzungen tragen ihre Rechenregel.** Zeitschätzungen stehen als Spanne mit „≈“; die Formel steht darunter. Nichts im Briefing darf härter wirken als das Protokoll drei Bildschirme weiter.
13. **Kein Toast.** Bestätigungen erscheinen an der Stelle des Auslösers (Melde-Knopf → Bestätigung im Spiegel; Kopieren → Zeile im Antwortfuß). Sie bleiben, bis die Person weitermacht; Kopier-Hinweis 3 s.
14. **Die Composer-Fußzeile ist immer da.** Der Spiegel öffnet in reservierten Platz zwischen Textfeld und Fuß (grid-template-rows 0fr → 1fr); das Layout springt nicht.
15. **Zwei Räume.** Arbeitsfläche = Werkzeug (Seitenleiste, Karten, Teal-Aktionen). Managementsicht = Dokument (eine Spalte 720 px, Fraunces, Haarlinien, keine Seitenleiste, kaum Farbe). Dazwischen die Schwelle (ein Klick, benannt, datiert). Rückweg ist ein Wort in der Kopfzeile.
16. **Begriff „Maskieren“.** Der Vorgang heißt im UI Maskieren (Knopf „Maskiert senden“, Modus „Maskieren“, Meta „3 Stellen maskiert“). Im Nachweis und Briefing darf zusätzlich der DSGVO-Begriff „pseudonymisiert“ stehen; „Schwärzen“, „anonymisieren“ und „REDACTED“ kommen nicht vor. EN: redact / Send redacted.
17. **Blockieren ist die Ausnahme, Maskieren die Regel.** Preise & Margen wird maskiert, nicht blockiert: die Preisfrage geht mit ⟨Marge⟩ raus, die Antwort rechnet mit dem Platzhalter, und lokal steht wieder „34 %“. Blockieren nur für Bereiche, in denen ein Platzhalter dem Modell nichts nützt (Zugangsdaten).
18. **Das Schutzprofil ändert sich nie von selbst.** Es ist ein gelenktes Dokument mit Version, Datum, Freigebender, Grundlage und Prüfsumme. Jede Änderung läuft Review-Vorschlag → Änderungsantrag → Freigabe → neue Version; Ablehnungen werden gleichwertig protokolliert. Kundensprache: Schutzprofil, Review-Vorschlag, Änderungsantrag. Nie „das Modell schlägt vor“, nie „Graph“.
19. **Einrichtung ist ein Modus des Management-Raums**, kein dritter Kontext: Dokumentbreite 720, Fraunces, Haarlinien, aber ohne Navigation — stattdessen Drei-Schritt-Leiste (Lesung · Rückfragen · Freigabe) und laufende Uhr. Budget 20 Minuten. Die Lesung läuft in Durchgängen und endet, wenn ein Durchgang nichts hinzufügt; jeder Durchgang ist eine protokollierte Zeile, kein Spinner.
20. **Rückfragen zitieren die Richtlinie.** 5–8 Fragen, jede aus einer Stelle mit zwei Lesarten, mit Abschnitt/Seite, Zitat, vorgeschlagener Lesart und „Anders“. Die Antwort steht als Begründung im Profil. „Später entscheiden“ = strengere Lesart vorläufig, Frage geht in den ersten Review.
21. **Briefing und Review sind vor dem Lesen unterscheidbar.** Briefing: Fraunces-Satz, Prosa, 720, kein Ausgang. Review: Inter-Tight-600-Sachtitel mit Version, Band „Entscheidung erforderlich · n Vorschläge“, nummerierte Posten mit Diff (− rot / + teal) und Wahl, 880, Aktionsleiste unten. Ein Review ohne Vorschlag hat kein Band und keine Leiste, listet aber alle fünf Prüfkategorien mit Zahlen.
22. **Der ruhende Bereich trägt beide Lesarten** (niemand spricht darüber / Erkennung greift nicht) und schlägt keinen Diff vor, sondern eine Wahl.
23. **Keine echten Firmennamen** in Demo-Daten, Beispielen, Platzhaltertexten. Erfundene Mandanten (Nordwerk Systemtechnik GmbH, Brechtmann GmbH, Haltmayer & Söhne) sind in Ordnung. Der Anbieter heißt „EU-gehosteter Endpunkt“.

---

## 1 · Zustandsinventar · Chat-Oberfläche

### 1.1 Composer (pro Entwurf)

| Zustand | Auslöser | Anzeige | Übergang zu |
|---|---|---|---|
| `idle` | Textfeld leer | Placeholder; Fuß: „Noch nichts übermittelt“ bzw. „Verlauf an den Anbieter: maskierte Fassung, N Nachrichten“; Senden grau, disabled | `typing` bei Eingabe |
| `typing` | Eingabe, Text nicht leer | Wie `idle`, Senden teal aktiv. **Keine Prüfanzeige** — ein sauberer Prompt soll sich nicht beobachtet fühlen | `inspecting` nach 600 ms Tipp-Pause oder bei Senden/Enter |
| `inspecting` | Tipp-Pause 600 ms, oder Senden | 2-px-Teal-Linie an der Composer-Oberkante läuft (Sweep, linear, Schleife, Periode = Prüfdauer); Fuß: „Prüfung läuft …“; Senden disabled. Weitere Eingabe bricht ab → `typing` | nach Prüfdauer (Ziel 800 ms; bei realer Latenz die tatsächliche, aber mind. 400 ms damit die Linie lesbar ist) → `clean` / `touched` / `blocked` |
| `clean` | 0 Funde | Fuß: „Übermittlung: unverändert · nichts erkannt“; Senden teal. Wurde Senden während `typing` gedrückt, wird jetzt automatisch gesendet | `sent` bei Senden; `typing` bei Eingabe |
| `touched` | ≥1 Fund, alle Bereiche im Modus Maskieren | Composer-Rahmen Amber 27 %; Spiegel klappt auf (240 ms): Kopf „Das erhält der Anbieter · N Stellen · Bereich(e) · Maskieren“, Drahttext mit Platzhalter-Chips, Attributionsleiste (Platzhalter · Schicht · Bereich · „Fehlalarm melden“); Fuß: „Die Antwort nutzt dieselben Platzhalter. Sie ersetzen sie lokal.“; Senden wird **„Maskiert senden“** in Amber. Bereichsmenü-Knopf: „N Bereich(e) berührt“ in Amber. Senden während `typing` stoppt hier — kein Auto-Send bei Fund | `sent`; `report`; `typing` |
| `blocked` | ≥1 Fund in einem Bereich mit Modus Blockieren | Rahmen Rot 33 %; Spiegel: Kopf „Keine Übermittlung · Bereich · Blockieren“, roter Punkt, erkannte Stellen in Anführungszeichen mit Schicht, Hinweis zum Protokoll; Fuß links „Markierte Stellen entfernen“ + „Als Fehlalarm melden“, rechts Senden grau disabled | `report`; `typing` (nach Entfernen mit Rücknahme-Chip im Verlauf) |
| `report` | „Fehlalarm melden“ (aus `touched` pro Stelle oder aus `blocked`) | Meldeformular ersetzt den Spiegelinhalt (gleicher Platz): Stelle, Erkannt von, Bereich, Kontext; Knöpfe Melden / Notiz (optional) / Abbrechen; Hinweis zur Kontextfreigabe | `report-done` nach Melden; zurück nach Abbrechen |
| `report-done` | Melden | Häkchen, „Gemeldet · FA-nnn“, „Regel bleibt aktiv“, Wochenzähler der Regel; „Und jetzt weiterarbeiten“: „Ohne die markierte Stelle neu formulieren“ (blockiert) bzw. „Maskiert weiterarbeiten“ (maskiert); Satz „Es gibt keine Freigabe pro Prompt.“ | `typing` → `inspecting` nach Umformulieren; Verlauf zeigt Meldungs-Notiz |
| `degraded` (Overlay auf alle) | KI-Prüfung nicht erreichbar | Streifen im Composer „KI-Prüfung nicht erreichbar · nur Regeln aktiv“ + „Details“; Bereichsmenü-Knopf „Nur Regeln aktiv“ Amber; Detailpanel mit Ausfall seit / zuletzt geprüft / benachrichtigt / vermerkt | verschwindet bei Wiederverbindung, mit Protokolleintrag |
| `locked` (Installation) | Keine bestätigten Bereiche | Textfeld gestrichelt, „Eingabe gesperrt, bis die Bereiche bestätigt sind.“, Senden grau, Fuß „Keine Bereiche bestätigt“ | `idle` nach Bestätigung durch Qualitätsleitung |

### 1.2 Nachricht (pro gesendetem Prompt)

- **Benutzer-Nachricht, Ihre Sicht:** Originaltext, maskierte Stellen mit 1-px gepunkteter Unterlinie in Muted. Meta-Zeile: „So übermittelt · N Stellen maskiert · Bereich“ oder „So übermittelt · unverändert“. Aus `touched` gesendet zusätzlich „Fehlalarm“ als Textlink.
- **Benutzer-Nachricht, Anbietersicht:** Drahttext mit Platzhalter-Chips.
- **Antwort, eintreffend:** Avatar-Ring + drei pulsierende Punkte (1,1 s), bis der Anbieter antwortet.
- **Antwort, Platzhalter:** Text mit Chips (max. 400 ms sichtbar, dann Wiederherstellung). In Anbietersicht bleibt dieser Zustand dauerhaft, Fuß: „So kam die Antwort an · N Platzhalter · Werte wurden erst in Ihrem Browser eingesetzt“.
- **Antwort, wiederhergestellt vollständig:** Werte mit gepunkteter Unterlinie, 180 ms Fade. Fuß: „N Werte lokal eingesetzt · vollständig | Was der Anbieter sah | Kopieren“.
- **Antwort, teilweise:** offene Platzhalter bleiben Amber-Chips; Amber-Karte darunter mit Vorschlag („Wert einsetzen“ / „So lassen“). Fuß: „1 von 2 Werten eingesetzt | 1 Platzhalter offen — kein Wert wird geraten“.
- **Antwort, nicht wiedergegeben:** Anbieter hat umschrieben. Fuß: „0 von 1 eingesetzt, Platzhalter nicht wiedergegeben“. Keine Aktion.
- **Kopiert:** Zeile im Fuß 3 s: „Kopiert — mit N eingesetzten Werten. Die Zwischenablage enthält echte Kundendaten. Stattdessen maskiert kopieren“.
- **Rücknahme-Chip (im Verlauf):** „N markierte Stellen wurden auf Ihren Wunsch ersetzt. Die Rücknahme bleibt für diese Sitzung verfügbar.“ + „Entfernen rückgängig machen“. Bleibt bis Sitzungsende oder Rücknahme.
- **Meldungs-Notiz (im Verlauf):** „Ihre Meldung FA-nnn liegt bei der Qualitätsleitung. Die Regel bleibt bis zur Prüfung aktiv.“ Später ersetzt durch Entscheidung (umgesetzt mit „Erneut versuchen“ / bleibt ohne Änderung mit Begründung).

### 1.3 Kopfzeile / Seitenleiste

- Titel = erste sechs Wörter des ersten Prompts, ohne Klammerinhalt; vorher „Neue Unterhaltung“.
- Umschalter „Ihre Sicht / Anbietersicht“ erscheint erst ab der ersten gesendeten Nachricht.
- Bereichsmenü-Knopf: drei Beschriftungen (s. Regel 1). Popover: Bereiche mit Modus; berührte Bereiche hervorgehoben (Amber bzw. Rot bei Blockieren); Fuß mit Richtliniendatum, Bestätigung, Schichtstatus. In Woche 1 startet das Menü offen.
- Benutzermenü (unten): Initialen, Name; Popover mit „Sprache der Oberfläche“ (Deutsch / English, Hinweis „Gilt nur für Sie. Bereichsnamen bleiben in der Sprache Ihrer Richtlinie.“), „Abmelden“.

### 1.4 Fußnote unter dem Composer (eine Zeile, zentriert, 11 px)

- Standard: „Prüfung in Ihrem Netzwerk, vor der Übermittlung. Die Erkennung ist wahrscheinlichkeitsbasiert.“
- Nach erster Wiederherstellung: „Die Werte wurden in Ihrem Browser eingesetzt. Der Anbieter hat sie nie erhalten — auch nicht als Verlauf.“
- Anbietersicht: „Dieses Transkript ist das einzige, das das Haus verlässt — auch als Verlauf in späteren Nachrichten. Ihre Fassung existiert nur in diesem Browser.“

---

## 2 · Zeiten und Bewegung

| Was | Wert | Kurve | Anmerkung |
|---|---|---|---|
| Tipp-Pause bis Prüfung | 600 ms | — | Reset bei jedem Zeichen |
| Prüfung (Linie) | 800 ms Ziel | Sweep `translateX(-100% → 260%)`, linear, Schleife | Linie 2 px, Breite 40 %, Verlauf transparent → Teal → transparent. Bei realer Latenz: Linie läuft bis Ergebnis, mind. 400 ms |
| Spiegel auf / zu | 240 ms | ease-out | `grid-template-rows: 0fr ↔ 1fr`, Kind `min-height:0; overflow:hidden` |
| Composer-Rahmenfarbe | 200 ms | linear | Muted → Amber 27 % → Rot 33 % |
| Senden-Knopf Farbe/Label | 160 ms | linear | Teal → Amber („Maskiert senden“) → Grau |
| Bereichsmenü-Knopf Umbeschriftung | 200 ms | linear | Farbe + Rahmen, Text hart |
| Popover / Formular einblenden | 140–160 ms | ease-out | nur Opacity, kein Slide |
| Benutzer-Bubble einblenden | 160 ms | ease-out | Opacity |
| Antwort-Latenz (Anbieter) | real; im Prototyp 1 400 ms | — | Drei-Punkte-Puls 1,1 s, Versatz 180 ms |
| Antwort einblenden | 180 ms | ease-out | Opacity |
| Wiederherstellung | +400 ms nach Eintreffen; 180 ms Fade pro Wert | ease-out | Bewusst sichtbar: die Person soll sehen, dass die Werte lokal kommen |
| Umschalter Ihre Sicht / Anbietersicht | 160 ms | linear | Tab-Hintergrund; Inhalt tauscht hart |
| Kopiert-Hinweis | 3 000 ms sichtbar | — | dann weg, kein Fade nötig |
| Schwelle → Managementsicht | 320 ms | ease-in-out | Fade auf die Platte, Fade in den Brief. Kein Slide, keine Skalierung |
| Rücknahme-Chip | 160 ms | ease-out | Opacity |

Keine Bewegung sonst. Keine Spring-Kurven, keine Bounces, keine Skalierungen.

---

## 3 · Zeichenketten · Deutsch / English

Schlüssel in `snake_case`, für Sprachdateien. Platzhalter im Draht (⟨Kundenname⟩ …) und Bereichs-/Regelnamen sind **nicht** Teil dieser Liste — sie folgen Mandant bzw. Richtlinie.

### Seitenleiste
| Schlüssel | DE | EN |
|---|---|---|
| `sidebar.new_conversation` | Neue Unterhaltung | New conversation |
| `sidebar.today` | Heute | Today |
| `sidebar.this_week` | Diese Woche | This week |
| `sidebar.history` | Verlauf | History |
| `sidebar.history_empty` | Noch keine Unterhaltungen. Ihre erste erscheint hier, sobald die Richtlinie bestätigt ist. | No conversations yet. Your first one appears here once the policy is confirmed. |
| `sidebar.provider` | Anbieter | Provider |
| `sidebar.connected_at` | verbunden · {time} | connected · {time} |
| `user.language` | Sprache der Oberfläche | Interface language |
| `user.language_note` | Gilt nur für Sie. Bereichsnamen bleiben in der Sprache Ihrer Richtlinie. | Applies to you only. Area names stay in the language of your policy. |
| `user.sign_out` | Abmelden | Sign out |

### Kopfzeile
| `header.new_title` | Neue Unterhaltung | New conversation |
|---|---|---|
| `header.view_own` | Ihre Sicht | Your view |
| `header.view_provider` | Anbietersicht | Provider view |
| `header.areas_protected` | {n} Bereiche geschützt | {n} areas protected |
| `header.areas_touched_one` | 1 Bereich berührt | 1 area touched |
| `header.areas_touched` | {n} Bereiche berührt | {n} areas touched |
| `header.rules_only` | Nur Regeln aktiv | Rules only |
| `menu.title` | In dieser Umgebung geschützt | Protected in this environment |
| `menu.mode_redact` | Maskieren | Redact |
| `menu.mode_block` | Blockieren | Block |
| `menu.from_policy` | Aus der Datenrichtlinie vom {date} | From the data policy of {date} |
| `menu.confirmed_by` | Bestätigt von der Qualitätsleitung. | Confirmed by the quality lead. |
| `menu.layers_active` | Regeln + KI-Prüfung aktiv | Rules + AI check active |
| `menu.translation_note` | Bereichsnamen stehen so, wie sie in der Richtlinie stehen; Übersetzungen dienen der Orientierung. | Area names are shown as written in the policy; translations are for orientation only. |

### Composer
| `composer.placeholder_first` | Prompt eingeben … | Enter a prompt … |
|---|---|---|
| `composer.placeholder_reply` | Antwort schreiben … | Write a reply … |
| `composer.placeholder_followup` | Nachfragen … | Follow up … |
| `composer.send` | Senden | Send |
| `composer.send_redacted` | Maskiert senden | Send redacted |
| `composer.status_nothing_sent` | Noch nichts übermittelt | Nothing transmitted yet |
| `composer.status_inspecting` | Prüfung läuft … | Inspecting … |
| `composer.status_clean` | Übermittlung: unverändert · nichts erkannt | Transmission: unchanged · nothing detected |
| `composer.status_history_redacted` | Verlauf an den Anbieter: maskierte Fassung, {n} Nachrichten | History sent to provider: redacted version, {n} messages |
| `composer.status_history_plain` | Verlauf an den Anbieter: unverändert, {n} Nachrichten | History sent to provider: unchanged, {n} messages |
| `composer.status_touched` | Die Antwort nutzt dieselben Platzhalter. Sie ersetzen sie lokal. | The reply uses the same placeholders. They are restored locally. |
| `composer.locked` | Eingabe gesperrt, bis die Bereiche bestätigt sind. | Input locked until the areas are confirmed. |
| `composer.locked_status` | Keine Bereiche bestätigt | No areas confirmed |
| `footnote.default` | Prüfung in Ihrem Netzwerk, vor der Übermittlung. Die Erkennung ist wahrscheinlichkeitsbasiert. | Inspection runs in your network, before transmission. Detection is probabilistic. |
| `footnote.restored` | Die Werte wurden in Ihrem Browser eingesetzt. Der Anbieter hat sie nie erhalten — auch nicht als Verlauf. | The values were restored in your browser. The provider never received them — not even as history. |
| `footnote.provider_view` | Dieses Transkript ist das einzige, das das Haus verlässt — auch als Verlauf in späteren Nachrichten. Ihre Fassung existiert nur in diesem Browser. | This transcript is the only one that leaves the building — including as history in later messages. Your version exists only in this browser. |

### Spiegel (berührt)
| `mirror.title` | Das erhält der Anbieter | What the provider receives |
|---|---|---|
| `mirror.summary` | {n} Stellen · {areas} · Maskieren | {n} spans · {areas} · Redact |
| `mirror.summary_one` | 1 Stelle · {areas} · Maskieren | 1 span · {areas} · Redact |
| `mirror.layer_rule` | Regel „{name}“ | Rule “{name}” |
| `mirror.layer_ai` | KI-Prüfung | AI check |
| `mirror.report` | Fehlalarm melden | Report false positive |

### Blockade
| `block.title` | Keine Übermittlung | No transmission |
|---|---|---|
| `block.summary` | {area} · Blockieren | {area} · Block |
| `block.body` | Erkannt wurde {spans}. Der Bereich ist auf Blockieren gesetzt, eine maskierte Fassung ist nicht vorgesehen. | Detected: {spans}. This area is set to Block; no redacted version is offered. |
| `block.body_join` | und | and |
| `block.ledger_note` | Der Prompt-Text bleibt in Ihrem Netzwerk. Im Prüfprotokoll erscheinen Zeitpunkt, Bereich und auslösende Schicht — nicht Ihr Text. | Your prompt text stays in your network. The audit log records time, area and triggering layer — not your text. |
| `block.remove` | Markierte Stellen entfernen | Remove marked spans |
| `block.report` | Als Fehlalarm melden | Report as false positive |
| `block.no_approval` | Es gibt keine Freigabe pro Prompt. Der Weg aus einer Blockade ist umformulieren oder melden. | There is no per-prompt approval. The way out of a block is to rephrase or to report. |
| `undo.removed` | {n} markierte Stellen wurden auf Ihren Wunsch ersetzt. | {n} marked spans were replaced at your request. |
| `undo.removed_one` | 1 markierte Stelle wurde auf Ihren Wunsch ersetzt. | 1 marked span was replaced at your request. |
| `undo.available` | Die Rücknahme bleibt für diese Sitzung verfügbar. | Undo stays available for this session. |
| `undo.action` | Entfernen rückgängig machen | Undo removal |

### Meldung
| `report.title` | Fehlalarm melden | Report false positive |
|---|---|---|
| `report.context_sent` | Kontext wird mitgesendet | Context is included |
| `report.span` | Stelle | Span |
| `report.detected_by` | Erkannt von | Detected by |
| `report.area` | Bereich | Area |
| `report.context` | Kontext | Context |
| `report.context_value` | Unterhaltung „{title}“, {n} Nachrichten | Conversation “{title}”, {n} messages |
| `report.submit` | Melden | Report |
| `report.add_note` | Notiz hinzufügen (optional) | Add a note (optional) |
| `report.cancel` | Abbrechen | Cancel |
| `report.privacy` | Die Qualitätsleitung sieht die markierte Stelle und die Regel. Der übrige Prompt-Text wird nur mitgesendet, wenn Sie „Kontext freigeben“ wählen. | The quality lead sees the marked span and the rule. The rest of your prompt is only included if you choose “Share context”. |
| `report.share_context` | Kontext freigeben | Share context |
| `report.done` | Gemeldet · {id} | Reported · {id} |
| `report.rule_stays` | Die Regel bleibt bis zur Prüfung aktiv. Sie hören von der Qualitätsleitung, auch wenn nichts geändert wird. | The rule stays active until reviewed. You will hear from the quality lead, even if nothing changes. |
| `report.week_count` | Diese Regel wurde diese Woche {n}-mal gemeldet. | This rule was reported {n} times this week. |
| `report.week_first` | Diese Regel wurde diese Woche zum ersten Mal gemeldet. | This is the first report of this rule this week. |
| `report.continue` | Und jetzt weiterarbeiten | And now, back to work |
| `report.rephrase` | Ohne die markierte Stelle neu formulieren | Rephrase without the marked span |
| `report.continue_redacted` | Maskiert weiterarbeiten | Continue redacted |
| `notice.pending` | Ihre Meldung {id} liegt bei der Qualitätsleitung. Die Regel bleibt bis zur Prüfung aktiv. | Your report {id} is with the quality lead. The rule stays active until reviewed. |
| `notice.pending_sub` | Sie hören von der Qualitätsleitung, auch wenn nichts geändert wird — hier, in dieser Unterhaltung. | You will hear from the quality lead, even if nothing changes — here, in this conversation. |
| `notice.applied` | Ihre Meldung {id} wurde umgesetzt. {change} | Your report {id} was applied. {change} |
| `notice.applied_meta` | Qualitätsleitung · {time} · Prüfprotokoll #{n} | Quality lead · {time} · Audit log #{n} |
| `notice.would_pass` | Dieser Prompt würde jetzt durchgehen. | This prompt would now pass. |
| `notice.retry` | Erneut versuchen | Try again |
| `notice.dismiss` | Ausblenden | Dismiss |
| `notice.declined` | Ihre Meldung {id} bleibt ohne Änderung. Begründung der Qualitätsleitung: | Your report {id} stands without change. The quality lead’s reasoning: |

### Nachricht und Antwort
| `msg.transmitted_redacted` | So übermittelt · {n} Stellen maskiert · {areas} | As transmitted · {n} spans redacted · {areas} |
|---|---|---|
| `msg.transmitted_redacted_one` | So übermittelt · 1 Stelle maskiert · {areas} | As transmitted · 1 span redacted · {areas} |
| `msg.transmitted_plain` | So übermittelt · unverändert | As transmitted · unchanged |
| `msg.false_positive` | Fehlalarm | False positive |
| `reply.restored_full` | {n} Werte lokal eingesetzt · vollständig | {n} values restored locally · complete |
| `reply.restored_full_one` | 1 Wert lokal eingesetzt · vollständig | 1 value restored locally · complete |
| `reply.restored_partial` | {k} von {n} Werten eingesetzt | {k} of {n} values restored |
| `reply.open_placeholder` | {n} Platzhalter offen — kein Wert wird geraten | {n} placeholder open — no value is guessed |
| `reply.not_rendered` | 0 von {n} eingesetzt, Platzhalter nicht wiedergegeben | 0 of {n} restored, placeholder not reproduced |
| `reply.what_provider_saw` | Was der Anbieter sah | What the provider saw |
| `reply.copy` | Kopieren | Copy |
| `reply.copied` | Kopiert — mit {n} eingesetzten Werten. | Copied — with {n} restored values. |
| `reply.copied_warning` | Die Zwischenablage enthält echte Kundendaten. | The clipboard contains real customer data. |
| `reply.copy_redacted` | Stattdessen maskiert kopieren | Copy redacted instead |
| `reply.wire_footer` | So kam die Antwort an · {n} Platzhalter · Werte wurden erst in Ihrem Browser eingesetzt | How the reply arrived · {n} placeholders · values were restored only in your browser |
| `restore.declined_title` | Ein Platzhalter blieb stehen: {ph} kam gebeugt zurück. NorthGuard setzt nichts ein, was nicht zweifelsfrei passt. | A placeholder remained: {ph} came back inflected. NorthGuard restores nothing that does not match beyond doubt. |
| `restore.suggestion` | Vorgeschlagener Wert aus dieser Sitzung: „{a}“ → „{b}“ | Suggested value from this session: “{a}” → “{b}” |
| `restore.apply` | Wert einsetzen | Insert value |
| `restore.keep` | So lassen | Leave as is |
| `restore.index_legend` | {n} Werte eingesetzt · {list} | {n} values restored · {list} |

### Original (Sitzung)
| `original.title` | Original dieser Nachricht | Original of this message |
|---|---|---|
| `original.session_only` | nur in dieser Sitzung | this session only |
| `original.retention` | Bleibt in diesem Browser, wird nicht ins Prüfprotokoll geschrieben und ist beim Schließen der Unterhaltung gelöscht. | Stays in this browser, is not written to the audit log and is deleted when the conversation is closed. |
| `original.discard` | Jetzt verwerfen | Discard now |

### Degradiert
| `degraded.title` | KI-Prüfung nicht erreichbar · nur Regeln aktiv | AI check unreachable · rules only |
|---|---|---|
| `degraded.body` | Die Abdeckung ist reduziert. Regeln erkennen Muster wie E-Mail-Adressen und Vertragsnummern, aber keinen Zusammenhang. | Coverage is reduced. Rules catch patterns such as e-mail addresses and contract numbers, but not context. |
| `degraded.since` | Ausfall seit | Down since |
| `degraded.last_check` | Zuletzt geprüft | Last checked |
| `degraded.next_try` | nächster Versuch {time} | next attempt {time} |
| `degraded.notified` | Benachrichtigt | Notified |
| `degraded.logged` | Vermerkt | Logged |
| `degraded.history` | Verlauf der Verfügbarkeit | Availability history |
| `degraded.details` | Details | Details |

### Einrichtung
| `setup.title` | Einrichtung | Setup |
|---|---|---|
| `setup.step` | Schritt {k} von {n} | Step {k} of {n} |
| `setup.headline` | Noch nichts geschützt | Nothing protected yet |
| `setup.body` | NorthGuard läuft in Ihrem Netzwerk und ist mit dem Anbieter verbunden. Bevor Prompts durchgelassen werden, muss eine Person die Bereiche aus Ihrer Datenrichtlinie bestätigen. | NorthGuard runs in your network and is connected to the provider. Before any prompt passes, one person must confirm the areas from your data policy. |
| `setup.next` | Als Nächstes | Next |
| `setup.then` | Danach | Then |
| `setup.read_policy` | Datenrichtlinie einlesen | Read in data policy |
| `setup.read_policy_body` | Richtlinie als Text oder PDF einfügen. NorthGuard schlägt Bereiche vor, aktiviert aber nichts von selbst. | Paste the policy as text or PDF. NorthGuard proposes areas but activates nothing on its own. |
| `setup.confirm_areas` | Bereiche bestätigen | Confirm areas |
| `setup.confirm_areas_body` | Beschriftungen prüfen, Modus je Bereich festlegen, freigeben. Erst dann läuft die Prüfung. | Check labels, set a mode per area, release. Only then does inspection run. |
| `setup.waiting` | wartet auf Schritt {k} | waiting for step {k} |
| `setup.no_forwarding` | Ohne bestätigte Bereiche wird kein Prompt weitergeleitet. | Without confirmed areas, no prompt is forwarded. |

### Einrichtung · Konvergenz
| `setup.step_read` | Lesung | Reading |
|---|---|---|
| `setup.step_questions` | Rückfragen | Questions |
| `setup.step_release` | Freigabe | Release |
| `setup.started` | Einrichtung · {time} begonnen · {min} min | Setup · started {time} · {min} min |
| `setup.reading_title` | Die Richtlinie wird gelesen. | The policy is being read. |
| `setup.reading_body` | Mehrmals, bis ein Durchgang nichts Neues mehr findet. Das dauert einige Minuten und ist der Grund, warum das Profil danach trägt. | Several times, until a pass finds nothing new. This takes a few minutes and is why the profile holds afterwards. |
| `setup.pass` | Durchgang {n} | Pass {n} |
| `setup.pass_running` | läuft | running |
| `setup.pass_nothing_new` | nichts Neues · Lesung abgeschlossen | nothing new · reading complete |
| `setup.converged_title` | {n} Durchgänge. Der letzte hat nichts hinzugefügt. | {n} passes. The last one added nothing. |
| `setup.two_readings` | Stellen mit zwei Lesarten | passages with two readings |
| `setup.to_questions` | Zu den {n} Rückfragen | To the {n} questions |
| `setup.question_of` | Rückfrage {k} von {n} · {area} | Question {k} of {n} · {area} |
| `setup.our_reading` | Unsere Lesart · bitte bestätigen oder korrigieren | Our reading · please confirm or correct |
| `setup.proposed` | vorgeschlagen | proposed |
| `setup.other` | Anders — ich beschreibe es | Other — I will describe it |
| `setup.decide_later` | Später entscheiden | Decide later |
| `setup.answer_recorded` | Ihre Antwort steht im Profil unter „Begründung“, mit Zitat. | Your answer is recorded in the profile under “Justification”, with the quote. |
| `setup.release_title` | Das ist Ihr Modell davon, was in diesem Haus geschützt ist. | This is your model of what is protected in this company. |
| `setup.release_body` | Mit der Freigabe wird es zur Grundlage jeder Prüfung. Es ändert sich danach nicht von selbst: jede Änderung ist ein Änderungsantrag gegen diese Version, mit Begründung und Freigabe. | On release it becomes the basis of every inspection. It does not change on its own afterwards: every change is a change request against this version, with justification and approval. |
| `setup.release_statement` | Ich habe die {n} Bereiche und ihre Modi geprüft. Mit der Freigabe werden sie als Schutzprofil Version 1.0 Grundlage aller Prüfungen in dieser Umgebung. | I have reviewed the {n} areas and their modes. On release they become Protection Profile version 1.0, the basis of all inspections in this environment. |
| `setup.release_action` | Als Version 1.0 freigeben | Release as version 1.0 |

### Schutzprofil
| `profile.kicker` | Gelenktes Dokument · Schutzprofil | Controlled document · Protection profile |
|---|---|---|
| `profile.title` | Schutzprofil Version {v} | Protection profile version {v} |
| `profile.valid_since` | Gültig seit | Valid since |
| `profile.approved_by` | Freigegeben von | Approved by |
| `profile.reason` | Anlass | Reason |
| `profile.basis` | Grundlage | Basis |
| `profile.checksum` | Prüfsumme | Checksum |
| `profile.next_review` | Nächster Review | Next review |
| `profile.request_change` | Änderungsantrag stellen | Submit change request |
| `profile.history` | Versionsgeschichte | Version history |
| `profile.new_in` | neu in v{v} | new in v{v} |
| `profile.footer` | Dieses Dokument ändert sich nur durch einen freigegebenen Änderungsantrag. Abgelehnte Anträge bleiben in der Geschichte stehen. | This document changes only through an approved change request. Rejected requests remain in the history. |

### Review-Vorschlag und Änderungsantrag
| `review.band` | Entscheidung erforderlich | Decision required |
|---|---|---|
| `review.band_count` | {n} Vorschläge gegen Schutzprofil v{v} | {n} proposals against protection profile v{v} |
| `review.no_deadline` | keine Frist · das Profil bleibt bis zur Entscheidung unverändert | no deadline · the profile stays unchanged until decided |
| `review.title` | Vorschläge zur Änderung des Schutzprofils, Zeitraum {range} | Proposed changes to the protection profile, period {range} |
| `review.type_synonym` | Kurzform ergänzen | Add short form |
| `review.type_gap` | Abdeckungslücke | Coverage gap |
| `review.type_dormant` | Ruhender Bereich | Dormant area |
| `review.type_mode` | Modus passt nicht | Mode mismatch |
| `review.type_new` | Neue Geschäftstätigkeit | New business activity |
| `review.accept` | Annehmen | Accept |
| `review.reject` | Ablehnen, mit Begründung | Reject, with reason |
| `review.change_mode_first` | Modus vor Annahme ändern | Change mode before accepting |
| `review.dormant_a` | Niemand spricht darüber | Nobody talks about it |
| `review.dormant_b` | Die Erkennung greift nicht | Recognition is not catching it |
| `review.checked_no_proposal` | Geprüft, ohne Vorschlag | Checked, no proposal |
| `review.nothing_title` | Nichts vorzuschlagen. | Nothing to propose. |
| `review.nothing_body` | Das Profil v{v} hat die Arbeit dieser zwei Wochen abgedeckt. Keine Entscheidung nötig; nichts wird geändert. | Profile v{v} covered the work of these two weeks. No decision needed; nothing changes. |
| `review.cadence_note` | Nach drei Reviews ohne Vorschlag wechselt der Takt von 14 Tagen auf monatlich; das wird hier angekündigt, nicht stillschweigend umgestellt. | After three reviews without a proposal the cadence moves from 14 days to monthly; this is announced here, not changed silently. |
| `review.tally` | {a} angenommen · {r} abgelehnt · {o} offen | {a} accepted · {r} rejected · {o} open |
| `review.create_cr` | Änderungsantrag aus {n} Posten erzeugen | Create change request from {n} items |
| `cr.band` | Freigabe erforderlich | Approval required |
| `cr.against` | Änderungsantrag {id} gegen Schutzprofil v{v} | Change request {id} against protection profile v{v} |
| `cr.before` | Vorher · v{v} · seit {date} | Before · v{v} · since {date} |
| `cr.after` | Nachher · v{v} · Entwurf | After · v{v} · draft |
| `cr.mode_unchanged` | Modus unverändert | Mode unchanged |
| `cr.unchanged` | Unverändert: | Unchanged: |
| `cr.full_diff` | vollständigen Vergleich v{a} → v{b} anzeigen | show full comparison v{a} → v{b} |
| `cr.justification` | Begründung · aus dem Review übernommen, bearbeitbar | Justification · taken from the review, editable |
| `cr.statement` | Ich gebe {id} frei. Das Schutzprofil wird zu Version {v}, gültig ab sofort für alle {n} Personen. | I approve {id}. The protection profile becomes version {v}, effective immediately for all {n} people. |
| `cr.approve` | Freigeben · v{v} erzeugen | Approve · create v{v} |
| `cr.later` | Später | Later |
| `cr.both_logged` | Freigabe und Ablehnung erzeugen beide einen Protokolleintrag | Approval and rejection both create a log entry |

### Schwelle und Managementsicht
| `threshold.kicker` | Managementsicht · Kalenderwoche {kw} | Management view · Week {kw} |
|---|---|---|
| `threshold.headline` | Sie verlassen Ihre Arbeitsfläche und sehen die Woche des Teams. | You are leaving your workspace to see the team’s week. |
| `threshold.body` | Zusammengefasst über {n} Personen. Keine Namen, keine Zuordnung einzelner Anfragen — das ist strukturell so gebaut, nicht ausgeblendet. | Aggregated across {n} people. No names, no attribution of individual requests — built that way structurally, not hidden. |
| `threshold.enter` | Woche ansehen | View the week |
| `threshold.back` | Zurück zur Arbeitsfläche | Back to workspace |
| `mgmt.label` | Managementsicht | Management view |
| `mgmt.nav.briefing` | Briefing | Briefing |
| `mgmt.nav.density` | Verdichtung | Density |
| `mgmt.nav.false_positives` | Fehlalarme | False positives |
| `mgmt.nav.profile` | Schutzprofil | Protection profile |
| `mgmt.nav.review` | Review | Review |
| `mgmt.nav.ledger` | Protokoll | Log |
| `mgmt.nav.evidence` | Nachweis | Evidence |
| `mgmt.to_workspace` | Zur Arbeitsfläche | To workspace |
| `briefing.meta` | Kalenderwoche {kw} · {range} · {p} Personen · {r} Anfragen | Week {kw} · {range} · {p} people · {r} requests |
| `briefing.duplicate_work` | Doppelte Arbeit | Duplicated work |
| `briefing.duplicate_estimate` | grob geschätzt {range} in dieser Woche | roughly {range} this week |
| `briefing.col_observation` | Beobachtung | Observation |
| `briefing.col_scope` | Umfang | Scope |
| `briefing.col_artefact` | Was die Wiederholung beenden würde | What would end the repetition |
| `briefing.estimate_note` | Zur Schätzung: gerechnet wird mit 15–20 Minuten je Anfrage, gerundet auf Stunden. Gemessen wird die Arbeitszeit nicht — NorthGuard kennt Anfragen und Themen, keine Dauer. Die Zahl soll die Größenordnung zeigen, nicht belegen. | About the estimate: 15–20 minutes per request, rounded to hours. Working time is not measured — NorthGuard knows requests and topics, not duration. The figure shows the order of magnitude; it does not prove it. |
| `briefing.duplicate_none` | In dieser Woche keine erkennbare Wiederholung. | No recognisable repetition this week. |
| `briefing.themes` | Drei wiederkehrende Themen | Three recurring themes |
| `briefing.policy_fit` | Passt die Richtlinie zur Arbeit? | Does the policy fit the work? |
| `briefing.rule_narrowed_notice` | Die Qualitätsleitung hat die Regel am {day} eingegrenzt; dieser Hinweis informiert Sie, eine Bestätigung ist nicht nötig. | The quality lead narrowed the rule on {day}; this note is for your information, no confirmation is needed. |
| `briefing.view_change` | Änderung im Protokoll ansehen | View change in log |
| `briefing.pdf` | Briefing als PDF | Briefing as PDF |
| `briefing.stat_requests` | Anfragen | requests |
| `briefing.stat_redacted` | maskiert weitergeleitet | forwarded redacted |
| `briefing.stat_blocked` | blockiert | blocked |
| `briefing.stat_duplicate` | Anfragen mit doppelter Arbeit | requests with duplicated work |
| `briefing.empty_day1_kicker` | Noch keine Woche | No week yet |
| `briefing.empty_day1` | Das erste Briefing erscheint am Montag nach der ersten vollen Arbeitswoche. | The first briefing appears on the Monday after the first full working week. |
| `briefing.empty_quiet` | Zu wenig Verkehr für ein Briefing. | Too little traffic for a briefing. |
| `briefing.next_with_themes` | Das nächste Briefing mit Themen: Montag, KW {kw}. | The next briefing with themes: Monday, week {kw}. |
| `queue.status_applied` | umgesetzt · zur Information | applied · for information |
| `queue.status_review` | in Prüfung | under review |
| `queue.status_done` | erledigt | done |
| `queue.grouping_note` | Meldungen erscheinen hier nach Auslöser, nicht nach Melder. | Reports are listed by trigger, not by reporter. |
| `evidence.title` | Nachweis für einen Kundenaudit | Evidence for a customer audit |
| `evidence.language` | Sprache · {lang} · festgelegt | Language · {lang} · fixed |
| `evidence.language_note` | Die Nachweissprache wurde bei der Einrichtung festgelegt und ist nicht pro Export wählbar. Änderung nur durch die Qualitätsleitung, als Richtlinienänderung protokolliert. | The evidence language was set during setup and cannot be chosen per export. Only the quality lead can change it, logged as a policy change. |
| `evidence.not_included` | Nicht enthalten: Prompt- und Antworttexte. Diese werden nicht gespeichert. | Not included: prompt and reply texts. These are not stored. |
| `evidence.generate` | Anlass angeben und erzeugen | State reason and generate |
| `evidence.reason_example` | z. B. „Kundenaudit Tier-1-Kunde, Q3“ | e.g. “Customer audit, tier-1 customer, Q3” |

---

## 4 · Raster, Abstände, Schrift

### Farben (Token → Hex)
- `bg.canvas` #070b14 (nur Dokumenthintergrund) · `bg.surface` #0B1220 · `bg.raised` #141d2e · `line` #1e2a3f · `line.strong` #2b3a52
- `ink` #e8edf4 · `muted` #8a97ab
- `teal` #3FBFB0 (Primäraktion, Verbindung, Bestätigung) · `amber` #F5A623 (berührt, maskiert, Meldung) · `red` #e5657a (blockiert, Ausfall)
- Tints: Amber-Chip `#F5A62322` Hintergrund, Rahmen berührt `#F5A62344`, Rahmen blockiert `#e5657a55`, Menüzeile berührt `#F5A6231a`
- Kein Grün. Keine Verläufe außer der Prüf-Linie.

### Schrift
- **Fraunces** (Serif, opsz): Logo 21/600 · Brief-Headline 34/400, letter-spacing −0,6 · Schwelle/leerer Zustand 26–28/400, −0,3 · Abschnittstitel Managementsicht 22–25 · Fußnoten-Zahlen 24 · Themen-Ziffern 20
- **Inter Tight** (UI): Prompttext 15/1,55 · Nachricht 14,5/1,6 (Antwort 1,7) · Kopfzeilentitel 14/600 · Knöpfe 13,5/600 (primär), 13/500, 12,5/500 (klein) · Seitenleiste 13 · Erklärtext 12,5–13/1,5–1,6 · Fußnote 11/1,4
- **JetBrains Mono** (System, Meta, Draht): Drahttext 13/1,9 · Statuszeile 11,5 · Meta unter Nachrichten 11 · Attributionsleiste 11/1,4 · Spiegelkopf-Untertitel 10,5 · Caps-Label 10/500, letter-spacing 1,2 (Managementsicht 1,6), uppercase · Platzhalter-Chip 12,5/500
- Regel: Alles, was das System *sagt* (Status, Zählungen, Protokoll, Draht) ist Mono. Alles, was Menschen *lesen* (Prompt, Antwort, Erklärung) ist Inter Tight. Fraunces nur für Titel und die Managementsicht.

### Layout Arbeitsfläche
- Karte 1200 × 760 als Referenz; fluid ab 960 px. Seitenleiste **220** (Padding 18 12 16, Zeilen 8 10, Gap 3). Inhalt max **820**, zentriert, Padding 24 28 0.
- Kopfzeile 14 28, Haarlinie unten, min-height 57.
- Nachrichten-Gap 18. Benutzer-Bubble max 80 %, Radius 14 14 4 14, Padding 12 16. Antwort: Grid 22 px Avatar-Ring + Text, Gap 12.
- Composer: Rahmen 1 px, Radius 14, Hintergrund raised. Textfeld Padding 14–16 18 10–12, min-height 56. Spiegel: margin 0 10 10, Radius 10, Kopf 8 12, Text 10 12, Attribution 9 12 mit Zeilen-Gap 5, Platzhalter-Spalte min-width **132**. Fuß: 8 10 10 18, min-height 44.
- Fußnote: 10 px Abstand, zentriert.
- Popover (Bereiche): 300 px (EN 320), top 52–56, right 20, Radius 12, Schatten `0 18px 40px #00000066`, Padding 12, Zeilen 7 4.

### Layout Managementsicht
- Kopfzeile 16 40. Spalte max **720** (Verdichtung 880), Padding 44 40 40, Abschnitts-Gap 26, Haarlinie + Padding-top 22 zwischen Abschnitten.
- Tabellen: Haarlinien, keine Zebra, Kopf in Caps-Mono 10, Zeilen-Padding 13 0.
- Review-Vorschlag: Spalte max **880**, Band 12 40 auf `bg.raised` mit `line.strong` unten, Posten als Karten Radius 12 mit Grid `36px minmax(0,1fr) 220px`, Diff-Block Mono 12/1,8 auf `bg.surface` (− `red`, + `teal`), Aktionsleiste unten 14 40 auf `bg.raised`. Änderungsantrag: Vorher/Nachher zwei Spalten, Nachher-Rahmen `#3FBFB055`, ergänzte Begriffe `teal` auf `#3FBFB014`.
- Einrichtung: Kopf 14 24 mit Uhr rechts, Drei-Schritt-Leiste Mono 10,5 mit 2-px-Teal-Unterstrich am aktiven Schritt, Durchgangs-Zeilen Grid `96px 1fr auto`, Fortschritt der Frage als sechs 2-px-Segmente.
- Doppelte-Arbeit-Tabelle: Spalten `minmax(0,1.25fr) 150px minmax(0,1fr)`, Gap 20.

### Radien
14 (Composer, Bubble) · 12 (Popover, Karten in Managementsicht) · 10 (Spiegel, Info-Karten) · 9 (Knöpfe) · 8 (Kleinknöpfe, Kopfzeilen-Knopf, Listenzeilen) · 6 (Tabs, Menüzeilen) · 5 (Chips)

### Knöpfe
- Primär: Teal Hintergrund, Ink-dunkel #0B1220, 9 18, 13,5/600. Im Zustand berührt Amber, gleiche Form. Disabled: `line` Hintergrund, `muted` Text, cursor not-allowed — nie ausgeblendet.
- Sekundär: transparent, Rahmen `line.strong`, Ink, 8–9 13–16, 12,5–13/500.
- Tertiär: transparent, kein Rahmen, `muted`, 9 8.
- Textlink im Mono-Kontext: `muted`, `text-decoration: underline dotted`, kein Padding.
- Keine feste Breite. Deutsch bestimmt die Länge.

---

## 5 · Erkennung im Prototyp (nur als Verhaltensreferenz, nicht als Spezifikation der Engine)

Der Prototyp erkennt lokal mit Mustern, damit die Zeiten echt sind: E-Mail (Regel), `XX-nnnnn` (Regel „Vertragsnummer“), Name nach Kundin/Kunde/Frau/Herr (als „KI-Prüfung“ etikettiert), Prozentangabe mit Preisbegriff im Satz (Regel „Prozentangabe im Preiskontext“, Blockieren), `*-Preisstufe` (KI-Prüfung, Blockieren). Überlappende Funde: der erste gewinnt. Umformulieren ersetzt blockierte Stellen durch neutrale Formulierungen aus einer Tabelle und prüft erneut.

Die echte Engine liefert dieselbe Struktur pro Fund: `start, end, value, placeholder, layer (rule|ai), ruleName?, area, mode (redact|block)`. Alles im UI hängt an diesen Feldern.
