import type { Dict } from "./en.js";

export const de: Dict = {
  "lang.switch": "Sprache",

  "nav.home": "Start",
  "nav.spec": "Spezifikation",
  "nav.generate": "Erzeugen",
  "nav.validate": "Prüfen",
  "nav.explain": "Erklären",
  "nav.tools": "Werkzeuge",
  "nav.faq": "Fragen",
  "nav.imprint": "Impressum",
  "nav.skip": "Zum Inhalt springen",

  "common.copy": "Kopieren",
  "common.copied": "Kopiert",
  "common.download": "Herunterladen",
  "common.back": "Zurück",
  "common.next": "Weiter",
  "common.optional": "optional",
  "common.add": "Hinzufügen",
  "common.remove": "Entfernen",
  "common.print": "Drucken",
  "common.of": "von",

  "footer.funding":
    "Diese Seite betreibt die Skalvar Technologies UG (haftungsbeschränkt) aus Wismar. Wir entwickeln Software für IT-Sicherheit und verdienen damit unser Geld. Format, Bibliothek und Seite lassen sich ohne unsere Produkte und ohne uns verwenden.",
  "footer.privacy":
    "Kein Tracking, keine Cookies, keine Analyse, keine externen Schriften. Was Sie eingeben, bleibt in Ihrem Browser.",
  "footer.licence":
    "Spezifikation und Schema: CC0-1.0. Bibliothek und Seite: Apache-2.0.",

  "home.title": "Sagen Sie, wie Sie mit Schwachstellenmeldungen umgehen.",
  "home.lead":
    "Das CVD Policy Format ist eine kleine JSON-Datei an einem festgelegten Ort. Darin steht, ob Sicherheitsforschung erwünscht ist, woran, unter welchen Bedingungen und wie gemeldet werden soll. Werkzeuge können die Datei auswerten, Menschen können sie lesen.",
  "home.what_title": "Kurz erklärt",
  "home.what_body":
    "Die security.txt nennt eine Kontaktadresse. Ob Tests erlaubt sind, welche Systeme überhaupt Ihnen gehören und was nach einer Meldung passiert, kann sie nicht ausdrücken. Diese Angaben stehen heute — wenn überhaupt — als Fließtext auf einer Webseite. Das CVD Policy Format bringt sie in eine Datei, die ein Werkzeug auswerten kann, bevor die erste Anfrage gestellt wird.",
  "home.privacy_title": "Nichts verlässt Ihr Gerät",
  "home.privacy_body":
    "Generator, Prüfung und Erklärung laufen vollständig im Browser. Kein Backend, kein Upload, keine Anfrage an fremde Domains. Wer das nicht glaubt, öffnet die Entwicklerwerkzeuge und schaut im Netzwerk-Tab nach.",
  "home.cta_generate": "Datei erstellen",
  "home.cta_validate": "Datei prüfen",
  "home.cta_spec": "Spezifikation lesen",
  "home.example_title": "So sieht das aus",
  "home.example_caption":
    "Ein vollständiges Dokument: eine Organisation, die Meldungen annimmt, aber nicht zu Tests einlädt.",
  "home.steps_title": "Drei Schritte",
  "home.step_1": "Ein paar Fragen beantworten und cvd.json herunterladen.",
  "home.step_2":
    "Die Datei unter /.well-known/cvd.json auf Ihrer Domain ablegen.",
  "home.step_3": "Eine Zeile in die security.txt eintragen.",
  "home.not_title": "Abgrenzung",
  "home.not_1":
    "Kein Ersatz für die security.txt, sondern eine Ergänzung um ein Feld.",
  "home.not_2":
    "Kein Nachweis regulatorischer Anforderungen, auch nicht für den CRA.",
  "home.not_3":
    "Kein Rechtsschutz. Festgehalten wird eine Erklärung, mehr nicht.",
  "home.not_4":
    "Keine Bewertung: keine Punktzahl, kein Reifegrad, kein Vergleich.",

  "spec.title": "Spezifikation",
  "spec.lead":
    "Version 0.2, Entwurf. Veröffentlicht unter CC0-1.0 — kopieren, zitieren und umsetzen ausdrücklich erlaubt.",
  "spec.translated_notice":
    "Diese Übersetzung soll das Verständnis erleichtern. Verbindlich ist die englische Fassung.",
  "spec.versions_note": "Version 0.1 bleibt veröffentlicht und gültig: Eine veröffentlichte Version ändert sich nie. 0.2 ergänzt ein freiwilliges Feld.",
  "spec.schema": "JSON Schema",

  "generate.title": "Policy erzeugen",
  "generate.lead":
    "Was sollen Meldende über den Umgang mit Ihrer Organisation wissen?",
  "generate.mode_quick": "Schnell",
  "generate.mode_quick_help":
    "Fünf Fragen, in unter zwei Minuten zu einem gültigen Dokument.",
  "generate.mode_full": "Vollständig",
  "generate.mode_full_help": "Alle Felder, die das Format vorsieht.",
  "generate.preview": "Live-Vorschau",
  "generate.preview_note": "Entsteht beim Tippen, direkt im Browser.",
  "generate.step_org": "Organisation",
  "generate.step_posture": "Grundhaltung",
  "generate.step_contact": "Kontakt",
  "generate.step_scope": "Geltungsbereich",
  "generate.step_testing": "Testregeln",
  "generate.step_report": "Meldeanforderungen",
  "generate.step_disclosure": "Offenlegung",
  "generate.step_validity": "Gültigkeit",
  "generate.step_result": "Ergebnis",
  "generate.org_name": "Name der Organisation",
  "generate.org_country": "Land (ISO 3166-1, zwei Buchstaben)",
  "generate.org_role": "Rolle",
  "generate.org_url": "Website",
  "generate.role_manufacturer": "Hersteller",
  "generate.role_operator": "Betreiber",
  "generate.role_both": "Beides",
  "generate.role_other": "Anderes",
  "generate.domain": "Ihre Domain",
  "generate.domain_help":
    "Die Datei gehört später nach https://<Ihre Domain>/.well-known/cvd.json.",
  "generate.canonical": "Ort der Datei",
  "generate.posture_question": "Wie gehen Sie mit Sicherheitsforschung um?",
  "generate.statement": "In Ihren eigenen Worten",
  "generate.statement_help":
    "Richtet sich an Menschen, nicht an Werkzeuge. Höchstens 1000 Zeichen.",
  "generate.contact_question": "Wohin sollen Meldungen gehen?",
  "generate.contact_equal_note":
    "Alle vier Möglichkeiten sind gleichwertig. Diese Seite empfiehlt keinen Anbieter und hat keinen voreingetragen.",
  "generate.channel_email": "Eigene E-Mail-Adresse",
  "generate.channel_form": "Eigenes Webformular",
  "generate.channel_service": "Dienstleister",
  "generate.channel_service_help":
    "Beliebige URL eintragen. Vorschläge gibt es hier nicht.",
  "generate.channel_postal": "Postanschrift",
  "generate.channel_preferred": "bevorzugt",
  "generate.languages": "Sprachen, in denen Sie Meldungen annehmen",
  "generate.pgp_url": "PGP-Schlüssel (URL)",
  "generate.pgp_fingerprint": "Fingerabdruck",
  "generate.ack_hours": "Eingangsbestätigung innerhalb (Stunden)",
  "generate.update_days": "Abstand der Zwischenstände (Tage)",
  "generate.scope_web": "Domains",
  "generate.scope_products": "Produkte",
  "generate.scope_pattern": "Hostmuster",
  "generate.scope_pattern_help": "Beispiel: example.com oder *.example.com",
  "generate.scope_state": "Status",
  "generate.scope_reason": "Grund für den Ausschluss",
  "generate.scope_precedence": "Welcher Eintrag gewinnt im Konflikt?",
  "generate.product_name": "Name",
  "generate.product_purl": "Package URL",
  "generate.product_versions": "Versionen",
  "generate.product_supported": "Unterstützt bis",
  "generate.product_sbom": "SBOM (URL)",
  "generate.testing_default": "Alles nicht Genannte ist",
  "generate.testing_activity": "Aktivität",
  "generate.testing_state": "Status",
  "generate.testing_note": "Hinweis",
  "generate.testing_rps": "Anfragen pro Sekunde (höchstens)",
  "generate.testing_ua": "User Agent muss enthalten",
  "generate.testing_targets": "Nur gegen diese Ziele (eines pro Zeile)",
  "generate.testing_account": "Wo ein Testkonto angefragt wird",
  "generate.testing_skip_note":
    "Dieser Schritt betrifft nur die Grundhaltungen open und limited. Ihre Grundhaltung lädt nicht zu Tests ein, deshalb werden keine Regeln geschrieben.",
  "generate.report_fields": "Eine Meldung muss enthalten",
  "generate.report_proof": "Ausnutzungsbeleg",
  "generate.report_formats": "Akzeptierte Formate",
  "generate.report_max_mb": "Größe der Anhänge (MB)",
  "generate.report_template": "Vorlage (URL)",
  "generate.disclosure_model": "Offenlegungsmodell",
  "generate.disclosure_deadline": "Regelfrist (Tage)",
  "generate.disclosure_advisory": "Advisories (URL)",
  "generate.disclosure_credit": "Nennung der Meldenden",
  "generate.credit_offered": "Wird angeboten",
  "generate.credit_on_request": "Auf Wunsch",
  "generate.credit_none": "Keine",
  "generate.expires": "Gültig bis",
  "generate.expires_help":
    "Zwölf Monate sind ein guter Wert: Eine Datei, die einmal im Jahr geprüft wird, veraltet seltener, ohne dass es auffällt.",
  "generate.expires_months": "Monate ab heute",
  "generate.result_title": "Ihre Datei",
  "generate.result_step1": "Datei ablegen unter",
  "generate.result_step2": "Diese Zeile in Ihre security.txt aufnehmen",
  "generate.result_step3": "Prüfen",
  "generate.result_human": "Lesbare Fassung (HTML)",
  "generate.result_human_help":
    "Das Feld Policy: in der security.txt erwartet eine Seite für Menschen. Sie entsteht hier aus denselben Daten.",
  "generate.result_permalink": "Entwurfslink",
  "generate.result_permalink_help":
    "Der Entwurf steckt hinter dem #-Zeichen der URL. Diesen Teil übertragen Browser grundsätzlich nicht an den Server — der Link bleibt auf Ihrem Gerät, solange Sie ihn nicht selbst weitergeben.",
  "generate.result_no_leak":
    "Kein Datenabfluss: Diese Datei ist vollständig auf Ihrem Gerät entstanden.",
  "generate.result_invalid":
    "Das Dokument ist noch nicht gültig. Die Prüfung nennt die Gründe.",
  "generate.result_valid": "Das Dokument ist gültig.",
  "generate.clear_state": "Eingaben aus diesem Browser löschen",
  "generate.clear_state_help":
    "Ihre Antworten liegen nur in diesem Tab. Schließen Sie ihn, sind sie weg.",
  "generate.unsaved_warning":
    "Ihre Eingaben werden nirgends gespeichert. Verlassen Sie die Seite, sind sie verloren.",

  "validate.title": "Policy prüfen",
  "validate.lead":
    "Datei einfügen, hineinziehen oder ein Beispiel laden. Hochgeladen wird nichts.",
  "validate.paste": "Einfügen",
  "validate.examples": "Beispiele",
  "validate.drop_hint": "cvd.json hierher ziehen oder Datei auswählen",
  "validate.result_valid": "Gültig",
  "validate.result_invalid": "Ungültig",
  "validate.count_errors_one": "{n} Fehler",
  "validate.count_errors_other": "{n} Fehler",
  "validate.count_warnings_one": "{n} Warnung",
  "validate.count_warnings_other": "{n} Warnungen",
  "validate.count_notes_one": "{n} Hinweis",
  "validate.count_notes_other": "{n} Hinweise",
  "validate.errors": "Fehler",
  "validate.warnings": "Warnungen",
  "validate.infos": "Hinweise",
  "validate.no_issues":
    "Nichts zu beanstanden. Das Dokument entspricht der Spezifikation.",
  "validate.fix_in_generator": "Im Generator öffnen",
  "validate.explain_this": "Verständlich darstellen",
  "validate.url_title": "Eine URL prüfen",
  "validate.url_body":
    "Ein Browser darf die Datei einer fremden Domain nur abrufen, wenn diese es erlaubt. Der Umweg über einen eigenen Server hätte einen Preis: Er würde mitlesen, welche Policies Sie prüfen. Und er wäre ein Backend, das es hier nicht gibt. Nehmen Sie deshalb den Befehl unten.",

  "explain.title": "Policy erklären",
  "explain.lead":
    "Dieselbe Datei, ausgeschrieben für alle, die kein JSON lesen.",
  "explain.paste_hint":
    "Dokument einfügen, Datei hineinziehen oder ein Beispiel laden.",
  "explain.show_raw": "Rohdaten anzeigen",
  "explain.hide_raw": "Rohdaten ausblenden",
  "explain.open_in_validator": "Im Validator öffnen",
  "explain.no_rating":
    "Keine Punktzahl, kein Reifegrad, kein Vergleich mit anderen Organisationen — und das mit Absicht.",
  "explain.organization": "Organisation",
  "explain.country": "Land",
  "explain.valid_until": "Gültig bis",
  "explain.updated": "Stand",
  "explain.posture": "Sicherheitsforschung",
  "explain.statement": "Im Wortlaut",
  "explain.in_scope_domains": "Domains im Geltungsbereich",
  "explain.in_scope_products": "Produkte im Geltungsbereich",
  "explain.out_of_scope": "Ausgeschlossene Systeme",
  "explain.precedence": "Im Konflikt",
  "explain.report_to": "Meldung an",
  "explain.encryption": "Verschlüsselung",
  "explain.languages": "Sprachen",
  "explain.response_within": "Antwort innerhalb",
  "explain.testing_default": "Alles nicht Genannte",
  "explain.required_fields": "Eine Meldung muss enthalten",
  "explain.proof_of_exploitation": "Ausnutzungsbeleg",
  "explain.model": "Offenlegung",
  "explain.deadline": "Regelfrist",
  "explain.advisories": "Advisories",
  "explain.pgp_available": "PGP verfügbar",
  "explain.none": "nicht angegeben",
  "explain.hours_one": "{n} Stunde",
  "explain.hours_other": "{n} Stunden",
  "explain.days_one": "{n} Tag",
  "explain.days_other": "{n} Tage",
  "explain.section.header": "Dokument",
  "explain.section.research": "Sicherheitsforschung",
  "explain.section.scope": "Geltungsbereich",
  "explain.section.contact": "Kontakt",
  "explain.section.testing": "Testregeln",
  "explain.section.report_requirements": "Meldeanforderungen",
  "explain.section.disclosure": "Offenlegung",

  "posture.open.headline": "TESTS ERWÜNSCHT — im Rahmen der Regeln unten",
  "posture.open.body":
    "Tests an den genannten Systemen sind erwünscht, im Rahmen der Regeln weiter unten. Wählen Sie das nur, wenn Sie eingehende Meldungen auch bearbeiten können.",
  "posture.limited.headline":
    "TESTS EINGESCHRÄNKT — nur im festgelegten Rahmen",
  "posture.limited.body":
    "Tests sind nur in einem klar abgesteckten Rahmen erlaubt, etwa gegen eine Sandbox oder mit einem eigenen Testkonto. Alles andere ist untersagt.",
  "posture.report_only.headline": "KEINE TESTEINLADUNG — Meldungen willkommen",
  "posture.report_only.body":
    "Sie laden nicht zu Tests ein, nehmen Meldungen aber entgegen und bearbeiten sie. Das ist keine schwächere Aussage als eine Testerlaubnis, sondern eine ehrliche. Die meisten Organisationen schweigen zu diesem Thema; hier steht wenigstens etwas.",
  "posture.prohibited.headline": "TESTS AUSGESCHLOSSEN",
  "posture.prohibited.body":
    "Tests sind ausgeschlossen, Meldungen unerwünscht oder auf einem anderen Weg vorgesehen. Auch das hilft weiter: Forschende wissen dann, dass sie hier nicht ansetzen sollten.",
  "posture.recommended": "für die meisten Organisationen die richtige Wahl",

  "precedence.out_overrides_in": "der Ausschluss gewinnt",
  "precedence.explicit_order": "der letzte passende Eintrag gewinnt",

  "testing.default.allowed": "erlaubt",
  "testing.default.prohibited": "untersagt",
  "testing.state.allowed": "erlaubt",
  "testing.state.prohibited": "untersagt",

  "activity.manual_testing": "Manuelle Tests",
  "activity.automated_scanning": "Automatisiertes Scannen",
  "activity.fuzzing": "Fuzzing",
  "activity.brute_force": "Brute Force",
  "activity.dos": "Überlastung (DoS)",
  "activity.social_engineering": "Social Engineering",
  "activity.phishing": "Phishing",
  "activity.physical": "Physischer Zugang",
  "activity.spam": "Spam",
  "activity.data_exfiltration": "Daten ausleiten",
  "activity.account_takeover": "Konten übernehmen",
  "activity.third_party_pivot": "Ausweitung auf Dritte",
  "activity.supply_chain": "Lieferkette",
  "activity.persistence": "Persistenz",

  "field.affected_asset": "betroffenes System",
  "field.description": "Beschreibung",
  "field.reproduction_steps": "Schritte zur Reproduktion",
  "field.impact": "Auswirkung",
  "field.discovery_date": "Datum der Entdeckung",
  "field.reporter_contact": "Ihre Kontaktdaten",
  "field.proposed_fix": "Lösungsvorschlag",

  "proof.required": "erforderlich",
  "proof.optional": "optional",
  "proof.prohibited": "nicht erwünscht",

  "disclosure.coordinated": "koordiniert",
  "disclosure.full_after_deadline": "vollständig nach Fristablauf",
  "disclosure.vendor_only": "nur gegenüber dem Hersteller",
  "disclosure.no_disclosure": "keine Offenlegung",

  "scope.state.in": "im Geltungsbereich",
  "scope.state.out": "ausgeschlossen",
  "scope.reason.third_party": "von Dritten betrieben",
  "scope.reason.legacy": "Altsystem",
  "scope.reason.not_operated": "nicht von uns betrieben",
  "scope.reason.other": "Sonstiges",

  "issue.required_missing": "Das Feld {field} fehlt.",
  "issue.required_missing.hint":
    "Ohne dieses Pflichtfeld lässt sich das Dokument nicht auswerten.",
  "issue.testing_required":
    "Diese Grundhaltung lädt zu Tests ein, deshalb sind Testregeln erforderlich.",
  "issue.testing_required.hint":
    "Ergänzen Sie einen testing-Abschnitt oder wählen Sie report_only.",
  "issue.version_unsupported": "Unbekannte Version. Erwartet wird {expected}.",
  "issue.version_unsupported.hint":
    "Bei unbekannter Version darf ein Werkzeug nicht raten.",
  "issue.enum_invalid": "Dieser Wert ist nicht definiert.",
  "issue.enum_invalid.hint": "Erlaubt sind: {allowed}",
  "issue.posture_unknown": "Diese Grundhaltung ist nicht definiert.",
  "issue.posture_unknown.hint":
    "Erlaubt sind: open, limited, report_only, prohibited.",
  "issue.canonical_not_https": "canonical muss eine absolute https-URL sein.",
  "issue.canonical_not_https.hint":
    "Beispiel: https://example.com/.well-known/cvd.json",
  "issue.pattern_invalid": "Dieser Wert hat nicht die erwartete Form.",
  "issue.format_invalid": "Dieser Wert ist kein gültiges {format}.",
  "issue.type_invalid": "Hier wird {expected} erwartet.",
  "issue.max_items": "Hier stehen zu viele Einträge.",
  "issue.min_items": "Hier ist mindestens ein Eintrag nötig.",
  "issue.schema_invalid": "Dieser Wert verletzt die Regel {keyword}.",
  "issue.json_parse": "Das ist kein gültiges JSON. {detail}",
  "issue.expires_past":
    "Das Ablaufdatum liegt in der Vergangenheit ({expires}).",
  "issue.expires_past.hint":
    "Werkzeuge behandeln das Dokument dann, als gäbe es keines.",
  "issue.expires_far":
    "Das Ablaufdatum liegt mehr als zwölf Monate in der Zukunft ({expires}).",
  "issue.expires_far.hint":
    "Bei einem kürzeren Zeitraum schaut eher noch einmal jemand hinein.",
  "issue.canonical_mismatch":
    "canonical zeigt auf {canonical}, abgerufen wurde die Datei aber von {retrieved}.",
  "issue.canonical_mismatch.hint":
    "Möglicherweise wurde das Dokument von anderswo kopiert.",
  "issue.scope_foreign_host":
    "{pattern} liegt nicht auf oder unter {own} — dort ist dieses Dokument veröffentlicht.",
  "issue.scope_foreign_host.hint":
    "Ein Dokument gilt für den Host, auf dem es liegt, und für alles darunter. Legen Sie dort ein eigenes Dokument ab, oder lassen Sie den Host in seiner security.txt auf dieses hier verweisen.",
  "issue.testing_target_foreign":
    "Die Regel für {activity} nennt {target}; {own} deckt das nicht ab.",
  "issue.testing_target_foreign.hint":
    "Solange dieser Host nicht selbst auf das Dokument verweist, übergehen Werkzeuge das Ziel.",
  "issue.canonical_has_credentials":
    "canonical enthält einen Benutzernamen oder ein Passwort.",
  "issue.canonical_has_credentials.hint":
    "Diese Datei wird veröffentlicht. Entfernen Sie die Zugangsdaten und behandeln Sie sie als kompromittiert.",
  "issue.scope_pattern_unusable":
    "{pattern} benennt keinen Host und trifft deshalb auf nichts zu.",
  "issue.scope_pattern_unusable.hint":
    "Tragen Sie einen Hostnamen ein, etwa example.com, oder *.example.com für alles darunter.",
  "issue.testing_ignored":
    "Bei der Grundhaltung {posture} bleiben Testregeln wirkungslos.",
  "issue.testing_ignored.hint":
    "Setzen Sie den Standard auf untersagt, oder wählen Sie eine Grundhaltung, die zu Tests einlädt.",
  "issue.testing_default_broad":
    "Alles nicht Genannte ist erlaubt, und nichts ist ausgenommen.",
  "issue.testing_default_broad.hint":
    "Damit sind auch Überlastungsangriffe, Social Engineering und physischer Zugang erlaubt. Nehmen Sie aus, was Sie nicht wollen.",
  "issue.condition_targets_empty":
    "Die Regel für {activity} hat eine leere Zielliste.",
  "issue.condition_targets_empty.hint":
    "Eine leere Liste schränkt nichts ein. Entfernen Sie sie, oder tragen Sie die Ziele ein.",
  "issue.string_too_long": "Dieser Text ist länger als {limit} Zeichen.",
  "issue.string_empty": "Dieser Wert darf nicht leer sein.",
  "issue.number_too_small": "Diese Zahl ist zu klein (Grenze {limit}).",
  "issue.number_too_large": "Diese Zahl ist zu groß (Grenze {limit}).",
  "issue.scope_private_address":
    "{pattern} ist eine private oder Loopback-Adresse.",
  "issue.scope_private_address.hint":
    "Von außen ist sie nicht erreichbar. Interne Adressen in einer öffentlichen Datei verraten mehr, als sie nützen.",
  "generate.step_intake": "Maschinenlesbarer Meldeweg",
  "generate.intake_question":
    "Können Sie strukturierte Meldungen entgegennehmen?",
  "generate.intake_note":
    "Freiwillig. Auch ohne diese Angabe ist das Dokument vollständig. Menschen melden weiterhin über die Kontaktwege, die Sie vorher angegeben haben.",
  "generate.intake_url": "Endpunkt, der Meldungen annimmt",
  "generate.intake_url_help":
    "Beliebige https-URL, Ihre eigene oder die eines Dienstleisters. Vorschläge gibt es hier nicht.",
  "generate.intake_schema": "Schema, das der Endpunkt akzeptiert (URL)",
  "generate.intake_profile": "Meldeprofil",
  "generate.intake_anonymous":
    "Meldungen ohne Kontaktangaben werden angenommen",
  "generate.intake_max_bytes": "Maximale Größe einer Meldung (Bytes)",
  "generate.intake_attachments": "Anhänge",
  "generate.intake_attachments_accepted": "angenommen",
  "generate.intake_attachments_after_contact": "nach Rückfrage",
  "generate.intake_attachments_not_accepted": "nicht angenommen",
  "explain.structured_intake": "Strukturierte Meldung",
  "explain.intake_offered": "möglich",
  "explain.anonymous_reports": "Anonyme Meldungen",
  "common.yes": "ja",
  "common.no": "nein",
  "issue.intake_not_https": "Der Endpunkt muss eine absolute https-URL sein.",
  "issue.intake_not_https.hint":
    "In einer Meldung stehen die Einzelheiten einer offenen Schwachstelle. Diese Angaben dürfen nicht unverschlüsselt übertragen werden.",
  "issue.intake_has_credentials":
    "Der Endpunkt enthält einen Benutzernamen oder ein Passwort.",
  "issue.intake_has_credentials.hint":
    "Diese Datei wird veröffentlicht. Entfernen Sie die Zugangsdaten und behandeln Sie sie als kompromittiert.",
  "issue.intake_third_party":
    "Meldungen gehen an {host} und damit an einen Host außerhalb von {own}.",
  "issue.intake_third_party.hint":
    "Das ist normal, wenn ein Dienstleister Ihre Meldestelle betreibt. Prüfen Sie, ob es der ist, den Sie gewählt haben.",
  "issue.intake_needs_version":
    "Das Dokument nutzt intake, gibt aber eine ältere Version an.",
  "issue.intake_needs_version.hint":
    "Setzen Sie cvd_policy auf {expected}, damit Werkzeuge den Block auswerten.",
  "issue.intake_profile_without_schema":
    "Sie nennen das Profil {profile}, geben aber keine Schema-URL an.",
  "issue.intake_profile_without_schema.hint":
    "Ohne Schema-URL muss ein Werkzeug von den Vorgaben des Profils ausgehen.",
  "issue.report_no_reproduction": "Keine Schritte zur Reproduktion.",
  "issue.report_no_impact": "Keine Auswirkung angegeben.",
  "issue.report_no_exploitation":
    "Keine Angabe, ob die Schwachstelle ausgenutzt wird.",
  "issue.report_credit_without_name":
    "Credits gewünscht, aber kein Name angegeben.",
  "issue.report_share_without_contact":
    "Weitergabe der Kontaktdaten erlaubt, aber es wurden keine angegeben.",
  "issue.scope_empty": "Der Geltungsbereich nennt weder Domains noch Produkte.",
  "issue.scope_empty.hint":
    "Ein Ziel, auf das kein Eintrag zutrifft, gilt als außerhalb des Geltungsbereichs.",
  "issue.scope_overlap":
    "{pattern} überschneidet sich mit dem früheren Eintrag {other}.",
  "issue.scope_overlap.hint":
    "Prüfen Sie, welcher Eintrag gewinnen soll — das steuert precedence.",
  "issue.product_support_past":
    "Die Unterstützung für {name} endete am {date}.",
  "issue.testing_rule_duplicate":
    "Eine zweite Regel für {activity} — es gilt nur die erste.",
  "issue.testing_rule_duplicate.hint":
    "Fassen Sie die Regeln zusammen. Ein späteres, großzügigeres Duplikat bleibt wirkungslos und führt Lesende in die Irre.",
  "issue.testing_unreachable":
    "Die Regel für {activity} erlaubt Tests, aber {target} liegt außerhalb des Geltungsbereichs.",
  "issue.testing_unreachable.hint": "So kann die Regel nie greifen.",
  "issue.contact_missing_encryption":
    "Grundhaltung open, aber kein Weg für verschlüsselte Meldungen.",
  "issue.contact_missing_encryption.hint":
    "Erwägen Sie einen PGP-Schlüssel oder ein S/MIME-Zertifikat.",

  "tools.schema_frozen": "eine veröffentlichte Version ändert sich nie",
  "tools.report_profile": "Meldeprofil",
  "tools.report_profile_note": "wie eine eingehende Meldung aufgebaut ist",
  "faq.q_machine": "Lassen sich eingehende Meldungen maschinell verarbeiten?",
  "faq.a_machine": "Seit Version 0.2 ja. Eine Policy kann einen Endpunkt nennen, der strukturierte Meldungen annimmt, dazu das Schema, das dieser Endpunkt erwartet, und ob anonyme Meldungen angenommen werden. Wie eine Meldung aufgebaut ist, steht in einem eigenen Profil namens report-0.1: drei Pflichtfelder — Titel, betroffenes Ziel, Beschreibung — und alles Weitere freiwillig, denn Reproduktion und Auswirkung liegen nicht immer vor, und ein fehlendes Feld darf niemanden davon abhalten, überhaupt zu melden. Was kein Werkzeug darf: eine Meldung von sich aus abschicken. In einer Meldung stehen die Einzelheiten einer offenen Schwachstelle; wohin sie gehen, entscheidet ein Mensch. Die Spezifikation schreibt das ausdrücklich vor.",
  "faq.q_versions": "Was hat sich in 0.2 geändert, und muss ich meine Datei neu erstellen?",
  "faq.a_versions": "Nein. Eine veröffentlichte Version ändert sich nie, und 0.1-Dokumente bleiben gültig und lesbar — Werkzeuge, die 0.2 beherrschen, müssen sie weiterhin verstehen. Version 0.2 ergänzt genau ein freiwilliges Feld, für den maschinenlesbaren Meldeweg aus der vorigen Frage. Wer ihn nicht braucht, hat nichts zu tun. Der Generator schreibt 0.2, weil das die aktuelle Version ist; inhaltlich steht in der Datei dasselbe wie vorher, plus dem, was Sie zusätzlich ausgefüllt haben.",
  "tools.title": "Werkzeuge",
  "tools.lead":
    "Alles, was zur Umsetzung des Formats nötig ist — und alles, was nötig ist, um es ohne diese Seite zu nutzen.",
  "tools.for_implementers": "Für Implementierer",
  "tools.schema": "JSON Schema",
  "tools.library": "Bibliothek",
  "tools.cli": "Kommandozeile",
  "tools.examples": "Beispiele",
  "tools.corpus": "Testkorpus",
  "tools.action": "GitHub Action",
  "tools.cli_body":
    "Exit-Codes: 0 gültig, 1 Fehler, 2 nur Warnungen, 3 nicht erreichbar. Damit läuft die Prüfung in jeder CI.",
  "tools.third_party": "Implementierungen Dritter",
  "tools.third_party_empty":
    "Diese Liste ist offen. Pull Requests sind willkommen.",

  "faq.title": "Fragen",
  "faq.q_prohibit": "Was, wenn ich Tests verbieten will?",
  "faq.a_prohibit":
    "Dann schreiben Sie genau das hinein, als Grundhaltung prohibited oder report_only. Das ist eine vorgesehene Antwort und kein Eingeständnis. Wer sie liest, weiß, dass hier nicht anzusetzen ist, und Sie bekommen Meldungen auf dem Weg, den Sie selbst gewählt haben, statt über den Blogbeitrag einer fremden Person.",
  "faq.q_securitytxt": "Ersetzt das die security.txt?",
  "faq.a_securitytxt":
    "Nein. Die security.txt bleibt, wie sie ist, und behält ihre Aufgabe. Dieses Format ergänzt sie um ein einziges Feld, CVD-Policy, das auf eine Datei verweist — mit den Antworten, für die in der security.txt keine Felder vorgesehen sind.",
  "faq.q_cra": "Ist das ein CRA-Nachweis?",
  "faq.a_cra":
    "Nein. Der Cyber Resilience Act verlangt Prozesse, keine JSON-Datei. Das Format kann festhalten, was Sie ohnehin entschieden haben: Kontaktstelle, unterstützte Versionen, Umgang mit der Offenlegung, und zwar so, dass ein Prüfer es lesen und ein Werkzeug es testen kann. Das ist Dokumentation, keine Konformität.",
  "faq.q_legal": "Gibt mir das Rechtssicherheit?",
  "faq.a_legal":
    "Nein. Ein Policy-Dokument ist eine einseitige Erklärung: kein Vertrag, keine Einwilligung im strafrechtlichen Sinn, kein Haftungsausschluss. Wer sich darauf verlässt, trägt das Risiko selbst. Umgekehrt gilt dasselbe: Wer eines veröffentlicht, erwirbt daraus keinen Anspruch gegen Forschende. Wenn die Rechtslage für Ihre Entscheidung wichtig ist, fragen Sie eine Anwältin oder einen Anwalt, kein Dateiformat.",
  "faq.q_who": "Wer betreibt diese Seite und wovon?",
  "faq.a_who":
    "Die Skalvar Technologies UG (haftungsbeschränkt) aus Wismar. Wir entwickeln Software für IT-Sicherheit und verdienen damit unser Geld — Produkte, die Sie bei uns kaufen können und für dieses Format nicht brauchen. Im Generator steht ein freies Feld für eine beliebige Meldeadresse, ohne Vorbelegung und ohne Auswahlliste. Sollte sich das je ändern, ist diese Seite nicht mehr neutral, und dann gehört das öffentlich gesagt.",
  "faq.q_others":
    "Warum nicht disclose.io, Bugcrowd oder eine Bug-Bounty-Plattform?",
  "faq.a_others":
    "Die lösen eine andere Aufgabe, und zwar gut: ein Programm betreiben, Forschende bezahlen, viele Meldungen sichten. Sie setzen voraus, dass Sie ein solches Programm überhaupt wollen. Die meisten Organisationen wollen das nicht und haben deshalb bislang gar nichts Maschinenlesbares anzubieten. Dieses Format setzt eine Ebene darunter an: eine Erklärung Ihrer Bedingungen, von Ihnen selbst abgelegt, ohne Konto lesbar.",
  "faq.q_official": "Ist das offiziell oder standardisiert?",
  "faq.a_official":
    "Nein. Es ist ein Entwurf, Version 0.1, veröffentlicht unter CC0. Das Feld in der security.txt ist bei der IANA nicht registriert; ein Antrag lohnt sich erst, wenn es echte Nutzung gibt. Bis dahin: ein Vorschlag, den Sie übernehmen, abwandeln oder liegen lassen können.",
  "faq.q_without": "Kann ich das ohne euch nutzen?",
  "faq.a_without":
    "Ja, darum geht es. Spezifikation und Schema stehen unter CC0: kopieren, selbst hosten, verändern. Bibliothek und Seite stehen unter Apache-2.0. Jedes Dokument aus dem Generator kommt ohne jeden Hinweis auf einen Anbieter aus, und die Datei liegt auf Ihrer eigenen Domain. Einen Rückkanal zu uns gibt es nicht.",
  "faq.q_data": "Was passiert mit den Daten, die ich eingebe?",
  "faq.a_data":
    "Sie bleiben im Browser-Tab. Der Generator legt Ihre Antworten im Session Storage ab, damit ein Neuladen sie nicht verwirft; beim Schließen des Tabs verschwinden sie. Es gibt keinen Server, an den etwas gehen könnte.",

  "imprint.title": "Impressum und Datenschutz",
  "imprint.tmg": "Angaben gemäß § 5 TMG",
  "imprint.represented_by": "Vertreten durch",
  "imprint.managing_directors": "Geschäftsführer",
  "imprint.register": "Registereintrag",
  "imprint.register_court": "Registergericht",
  "imprint.register_number": "Registernummer",
  "imprint.vat_title": "Umsatzsteuer-ID",
  "imprint.vat_body":
    "Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz",
  "imprint.rstv": "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV",
  "imprint.email": "E-Mail",
  "imprint.phone": "Telefon",
  "imprint.contact": "Kontakt",
  "imprint.contact_note":
    "Bewusst als reiner Text. Diese Seite hat kein Kontaktformular.",
  "imprint.privacy_title": "Datenschutz",
  "imprint.privacy_body":
    "Diese Seite setzt keine Cookies, lädt keine externen Ressourcen und wertet nichts aus. Was Sie in Generator, Prüfung oder Erklärung eingeben, verarbeitet allein Ihr Browser; übertragen wird nichts. Der Generator legt Ihre Antworten im Session Storage des Tabs ab, die gewählte Sprache im Local Storage. Beides lässt sich im Browser jederzeit löschen.",
  "imprint.hosting_title": "Hosting",
  "imprint.hosting_body":
    "Statisches Hosting in der EU. In den Server-Logs können die üblichen Zugriffsdaten anfallen; sie dienen dem Betrieb und der Absicherung der Seite.",
  "imprint.funding_title": "Finanzierung",
  "imprint.licence_title": "Lizenzen",
};
