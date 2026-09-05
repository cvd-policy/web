import type { Dict } from "./en.js";

export const de: Dict = {
  "lang.switch": "Sprache",

  "nav.home": "Start",
  "nav.spec": "Spezifikation",
  "nav.generate": "Erzeugen",
  "nav.validate": "Prüfen",
  "nav.explain": "Legacy-Erklärung",
  "nav.tools": "Tools",
  "nav.faq": "Fragen",
  "nav.imprint": "Impressum",
  "nav.skip": "Zum Inhalt springen",
  "nav.main": "Hauptnavigation",

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
  "generate.languages_none": "Keine ausgewählt",
  "common.hint_label": "Was in dieses Feld gehört",
  "common.hint_example": "Beispiel:",
  "common.invalid_utf8": "Die ausgewählte Datei ist kein gültiges UTF-8.",

  "footer.funding":
    "Diese Seite betreibt die Skalvar Technologies UG (haftungsbeschränkt) aus Wismar. Wir entwickeln Software für IT-Sicherheit und verdienen damit unser Geld. Format, Bibliothek und Seite lassen sich ohne unsere Produkte und ohne uns verwenden.",
  "footer.privacy":
    "Kein Tracking, keine Cookies, keine Analyse, keine externen Schriften. Was Sie eingeben, bleibt in Ihrem Browser.",
  "footer.licence":
    "Spezifikation und Schema: CC0-1.0. Bibliothek und Seite: Apache-2.0.",

  "home.title": "Sagen Sie, wie Sie mit Schwachstellenmeldungen umgehen.",
  "home.lead":
    "Das CVD-Policy-Format ist eine kleine JSON-Datei an einer ausdrücklich angekündigten HTTPS-URI. Sie benennt meldefähige Assets, die vom Herausgeber erklärten Testregeln und den Meldeweg. Tools können die Datei auswerten, Menschen können sie lesen.",
  "home.what_title": "Kurz erklärt",
  "home.what_body":
    "Die security.txt nennt eine Kontaktadresse. V1 ergänzt eine Erklärung des Herausgebers zu meldefähigen Assets, Testregeln, Meldepräferenzen und dem weiteren Ablauf. Sie beweist weder Eigentum noch Kontrolle, erteilt keine rechtliche Erlaubnis und garantiert keinen Safe Harbor. Ein Tool kann diese Erklärung vor der ersten Anfrage auswerten.",
  "home.privacy_title": "Nichts verlässt Ihr Gerät",
  "home.privacy_body":
    "Generator, Prüfung und Erklärung laufen vollständig im Browser. Kein Backend, kein Upload, keine Anfrage an fremde Domains. Wer das nicht glaubt, öffnet die Entwicklertools und schaut im Netzwerk-Tab nach.",
  "home.cta_generate": "Datei erstellen",
  "home.cta_validate": "Datei prüfen",
  "home.cta_spec": "Spezifikation lesen",
  "home.example_title": "So sieht das aus",
  "home.example_caption":
    "Ein vollständiges Dokument: eine Organisation, die Meldungen annimmt, aber nicht zu Tests einlädt.",
  "home.steps_title": "Drei Schritte",
  "home.step_1": "Das V1-Policy-Dokument erstellen und herunterladen.",
  "home.step_2":
    "Die Datei an der gewählten exakten HTTPS-URI veröffentlichen.",
  "home.step_3": "Diese URI mit genau einem CVD-Policy-Feld in /.well-known/security.txt ankündigen.",
  "home.not_title": "Abgrenzung",
  "home.not_1":
    "Kein Ersatz für die security.txt, sondern eine Ergänzung um ein Feld.",
  "home.not_2":
    "Kein Nachweis regulatorischer Anforderungen, auch nicht für den CRA.",
  "home.not_3":
    "Keine rechtliche Erlaubnis und kein Eigentumsnachweis. Festgehalten wird eine Erklärung des Herausgebers, mehr nicht.",
  "home.not_4":
    "Keine Bewertung: keine Punktzahl, kein Reifegrad, kein Vergleich.",
  "home.v1_notice_intro": "Experimentelle V1-Implementierung von",
  "home.v1_notice_change": "Das vorgeschlagene Feld und der Medientyp können sich ändern.",

  "spec.title": "Spezifikation",
  "spec.lead":
    "Kandidat für Version 1 — das Format, das der aktuelle Generator und Validator umsetzen. Veröffentlicht unter CC0-1.0.",
  "spec.versions_note": "Die Versionen 0.1 und 0.2 bleiben als eingefrorene Legacy-Formate verfügbar.",
  "spec.package_versions_note":
    "Paketversionen sind keine Formatversionen. @cvd-policy/core 0.5.0-rc.1 setzt das experimentelle Format V1 um; cvd_policy im Dokument wählt die Dokumentregeln.",
  "spec.schema": "JSON Schema",
  "spec.v1_notice_intro": "Dies ist der experimentelle V1-Kandidat zu",
  "spec.v1_notice_change": "Er ist weder RFC noch IETF-Konsens und kann sich ändern.",
  "spec.translation_notice": "Die englische Spezifikation ist normativ. Diese deutsche Übersetzung ist informativ.",
  "spec.legacy_title": "Legacy 0.x",
  "spec.legacy_body": "Bestehende Dokumente der Versionen 0.1 und 0.2 behalten ihre eingefrorenen Spezifikationen und Schemas. Auch das Profil report-0.1 ist Legacy und kein V1-Meldetransport.",

  "notfound.title": "Seite nicht gefunden",
  "notfound.lead":
    "Unter dieser Adresse gibt es hier keine Seite. Die gesuchte Datei liegt möglicherweise auf einer fremden Domain — diese Seite hält nur das Format selbst vor.",

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
    "Nur Legacy 0.x: Der historische Standardpfad war https://<Ihre Domain>/.well-known/cvd.json.",
  "generate.canonical": "Ort der Datei",
  "generate.posture_question": "Wie gehen Sie mit Sicherheitsforschung um?",
  "generate.statement": "In Ihren eigenen Worten",
  "generate.statement_help":
    "Richtet sich an Menschen, nicht an Tools. Höchstens 1000 Zeichen.",
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
  "generate.scope_reason": "Ausschlussgrund",
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
  "generate.result_title": "Ihre Dateien",
  "generate.result_step1": "Datei ablegen unter",
  "generate.result_step2": "Diese Zeile in Ihre security.txt aufnehmen",
  "generate.result_step2_help":
    "Hat der Host noch keine security.txt, nehmen Sie die oben — diese Zeile steht dort bereits.",
  "generate.result_step3": "Prüfen",
  "generate.result_securitytxt_preview": "security.txt anzeigen",
  "generate.import_title": "Veröffentlichen Sie bereits eine security.txt?",
  "generate.import_help":
    "Ziehen Sie die Datei hierher — was darin schon beantwortet ist, wird übernommen: Kontakte, Sprachen, das Ablaufdatum, die Domain und der Link zu Ihrem Schlüssel. Der Schlüssel selbst wird nicht angefasst; übernommen wird allein die Adresse, die auf ihn verweist, und zwar unverändert. Gelesen wird die Datei in diesem Tab, hochgeladen wird sie nicht.",
  "generate.securitytxt_drop_hint": "security.txt hierher ziehen oder Datei auswählen",
  "generate.import_done": "Eingelesen",
  "generate.import_done_help":
    "Im letzten Schritt erhalten Sie dieselbe Datei mit der ergänzten Zeile CVD-Policy zurück — so veröffentlichen Sie beides gemeinsam.",
  "generate.import_signed":
    "Diese Datei ist signiert. Die ergänzte Zeile CVD-Policy zerstört die Signatur — ein Feld hinzuzufügen und die Signatur zu behalten, geht nicht — Sie müssen die Datei vor der Veröffentlichung also erneut signieren.",
  "generate.import_forget": "Datei verwerfen",
  "generate.merge_title": "Vorhandene security.txt ergänzen",
  "generate.merge_help":
    "Fügen Sie Ihre bisherige Datei ein oder ziehen Sie sie hierher. Sie kommt zurück mit dem Feld CVD-Policy, das auf Ihre cvd.json verweist — sonst bleibt alles, wie es war: Kommentare, Reihenfolge, Leerzeilen. Gelesen wird die Datei in diesem Tab, hochgeladen wird sie nicht.",
  "generate.merge_paste": "Ihre bisherige security.txt",
  "generate.merge_added": "Feld ergänzt",
  "generate.merge_replaced": "Feld aktualisiert",
  "generate.merge_unchanged": "Bereits aktuell",
  "generate.merge_previous": "vorher",
  "generate.merge_signed":
    "Diese Datei ist signiert. Die Signatur passt nicht mehr zum geänderten Text — signieren Sie die Datei vor der Veröffentlichung erneut.",
  "generate.result_publish": "Veröffentlichen",
  // Eine Zeile pro Feld. Bewusst kurz: ein Hinweis am Eingabefeld, nicht die
  // Erklärung, die die Spezifikationsseite trägt.
  "generate.hint_org_name":
    "Der rechtliche Name der Organisation, für die diese Policy gilt, wie im Impressum oder Registereintrag.",
  "generate.hint_domain":
    "Die Domain, auf der Sie die Datei veröffentlichen. Daraus ergeben sich der Ablageort und ein erster Geltungsbereich.",
  "generate.hint_canonical":
    "Die genaue Adresse, unter der die fertige cvd.json erreichbar sein wird. Meldende und Tools prüfen damit, dass die Datei wirklich Ihre ist.",
  "generate.hint_org_country":
    "Zweibuchstabiger Ländercode des Sitzes der Organisation.",
  "generate.hint_org_url":
    "Ihre Hauptwebsite, damit Meldende sehen, an wen sie sich wenden.",
  "generate.hint_channel_email":
    "Eine Adresse, die Fremde ohne Konto erreichen. Eine Rollenadresse überdauert jede einzelne Person.",
  "generate.hint_channel_form":
    "Eine Seite mit einem Meldeformular. Sie muss ohne Anmeldung erreichbar sein.",
  "generate.hint_channel_postal":
    "Eine Postanschrift. Sie steht in der Policy, hat aber kein security.txt-Feld und wird dort nie eingetragen.",
  "generate.hint_languages":
    "Sprachen, in denen Sie eine Meldung bearbeiten können, die sicherste zuerst.",
  "generate.hint_pgp_url":
    "Wo Ihr öffentlicher Schlüssel abrufbar ist, damit Meldende vor dem Senden verschlüsseln können.",
  "generate.hint_pgp_fingerprint":
    "Der Fingerabdruck dieses Schlüssels, damit Meldende prüfen können, dass sie den richtigen geladen haben.",
  "generate.hint_ack_hours":
    "Stunden, in denen Sie den Eingang bestätigen. Eine Eingangsbestätigung ist noch keine Antwort.",
  "generate.hint_update_days":
    "In welchem Abstand Sie über den Stand berichten, solange die Meldung offen ist, in Tagen.",
  "generate.hint_expires":
    "Das Datum, an dem diese Policy ungültig wird. Setzen Sie sich eine Erinnerung: Eine abgelaufene Policy gilt wie keine.",
  "generate.hint_statement":
    "Ein bis zwei Sätze in Ihren eigenen Worten. Meldende lesen sie unverändert; für die Prüfung durch Tools ändert sie nichts.",
  "generate.hint_scope_pattern":
    "Ein Host oder ein Platzhalter, der die gemeinten Systeme abdeckt.",
  "generate.hint_scope_reason":
    "Warum das außerhalb des Geltungsbereichs liegt. Für Menschen geschrieben, nicht für Tools.",
  "generate.hint_product_name":
    "Das Produkt, wie Sie es verkaufen oder ausliefern — der Name, den Meldende kennen.",
  "generate.hint_product_versions":
    "Welche Versionen gemeint sind. Ein Bereich oder eine Liste, in der Form Ihrer Release Notes.",
  "generate.hint_product_supported":
    "Das Datum, an dem der Support für diese Versionen endet.",
  "generate.hint_product_purl":
    "Die Package-URL, falls das Produkt über eine Paketquelle verteilt wird.",
  "generate.hint_product_sbom":
    "Wo die Stückliste (SBOM) für dieses Produkt abrufbar ist.",
  "generate.hint_testing_activity":
    "Die Art des Testens, um die es in dieser Regel geht. Alles, was Sie nicht aufführen, gilt als verboten.",
  "generate.hint_testing_rps":
    "Wie viele Anfragen pro Sekunde Sie beim Testen höchstens hinnehmen.",
  "generate.hint_testing_ua":
    "Ein User-Agent, um den Sie Forschende bitten, damit Sie deren Verkehr von einem Angriff unterscheiden können.",
  "generate.hint_testing_targets":
    "Wo stattdessen getestet werden soll, wenn Sie die Produktivumgebung heraushalten möchten.",
  "generate.hint_testing_account":
    "Wo Forschende ein Testkonto bekommen, falls Ihre Regeln eines verlangen.",
  "generate.hint_testing_note":
    "Was Forschende sonst wissen müssen und die Regel selbst nicht hergibt.",
  "generate.hint_report_max_mb":
    "Der größte Anhang, den Ihr Postfach annimmt, in Megabyte.",
  "generate.hint_report_template":
    "Eine Vorlage, an der sich Meldungen orientieren sollen. Ein fehlendes Feld darf eine Meldung nie verhindern.",
  "generate.hint_intake_url":
    "Der Endpunkt, der eine strukturierte Meldung annimmt. Nur https und nie mit Zugangsdaten in der URL.",
  "generate.hint_intake_schema":
    "Das Schema, das dieser Endpunkt erwartet, damit ein Tool eine Meldung vor dem Senden prüfen kann.",
  "generate.hint_intake_max_bytes":
    "Die größte Übermittlung, die der Endpunkt annimmt, in Bytes.",
  "generate.hint_disclosure_deadline":
    "Tage nach Eingang einer Meldung, bevor Details veröffentlicht werden dürfen. Gezählt ab Eingang, nicht ab Behebung.",
  "generate.result_zip_help":
    "Alles in einem Archiv, beide Verzeichnisse bereits angelegt und bereit, im Web-Root entpackt zu werden. Nehmen Sie dieses, sofern Sie nicht eine einzelne Datei brauchen: Die security.txt darin nennt im Feld Policy: die /security/cvd.html, beide müssen also zusammen veröffentlicht werden.",
  "generate.result_files_help":
    "Die cvd.json und die security.txt gehören unter /.well-known/, wo Tools sie erwarten. Die cvd.html ist die Seite für Menschen und kommt stattdessen nach /security/: Sie wird von niemandem automatisch gesucht und hat in einem reservierten Verzeichnis nichts verloren. Veröffentlichen Sie sie mit, sonst führt die Zeile Policy: in der security.txt ins Leere.",
  "generate.result_files_merged":
    "Die security.txt hier ist Ihre eigene Datei mit der ergänzten Zeile CVD-Policy, keine neue. Die cvd.html ist die Seite für Menschen, aus denselben Angaben erzeugt.",
  "generate.result_permalink": "Entwurfslink",
  "generate.result_permalink_help":
    "Der Entwurf steckt hinter dem #-Zeichen der URL. Diesen Teil übertragen Browser grundsätzlich nicht an den Server — der Link bleibt auf Ihrem Gerät, solange Sie ihn nicht selbst weitergeben.",
  "generate.result_no_leak":
    "Kein Datenabfluss: Diese Dateien sind vollständig auf Ihrem Gerät entstanden.",
  "generate.result_invalid":
    "Das Dokument ist noch nicht gültig. Die Prüfung nennt die Gründe.",
  "generate.result_valid": "Das Dokument ist gültig.",
  "generate.clear_state": "Eingaben aus diesem Browser löschen",
  "generate.clear_state_help":
    "Ihre Antworten liegen nur in diesem Tab. Schließen Sie ihn, sind sie weg.",
  "generate.unsaved_warning":
    "Ihre Eingaben werden nirgends gespeichert. Verlassen Sie die Seite, sind sie verloren.",
  "generate.v1_title": "V1-CVD-Policy erzeugen",
  "generate.v1_lead": "Erfassen Sie alle V1-Felder im geführten Editor oder bearbeiten Sie direkt das JSON. Anschließend bereiten Sie die Dateien für die von Ihnen kontrollierten Zielorte vor.",
  "generate.v1_notice_intro": "Experimentelle Implementierung von",
  "generate.v1_notice_change": "Der vorgeschlagene Feldname und der Medientyp können sich ändern.",
  "generate.policy_uri": "Policy-URI",
  "generate.policy_uri_help": "Erforderliche, ausdrücklich angegebene HTTPS-URI. Es gibt keinen standardisierten Standardpfad für die JSON-Datei.",
  "generate.security_txt_uri": "security.txt-URI",
  "generate.human_policy_uri": "URI der menschenlesbaren Policy",
  "generate.human_policy_uri_help": "Eine neu erzeugte security.txt verlinkt diese URI über ihr Policy-Feld.",
  "generate.human_policy_merge_note": "Beim Zusammenführen bleiben vorhandene Policy-Felder unverändert. Der Generator ergänzt oder ersetzt für diese HTML-Datei kein Policy-Feld.",
  "generate.v1_policy_json": "V1-Policy-JSON",
  "generate.merge_existing": "In eine bestehende security.txt einfügen",
  "generate.merge_existing_help": "Kommentare und bestehende Felder bleiben erhalten. Jedes alte CVD-Policy-Feld wird durch genau einen Wert ersetzt. Signierte Dateien werden abgelehnt.",
  "generate.local_validation": "Lokale Prüfung",
  "generate.valid_v1": "Lokal gültiges V1-Dokument",
  "generate.local_scope": "Die lokale Prüfung betrifft das Dokument, nicht Authority, Veröffentlichung, Eigentum, rechtliche Erlaubnis oder Testerlaubnis für ein Ziel.",
  "generate.download_layout": "Exakte Webroot-Struktur herunterladen",
  "generate.zip_unavailable": "Kein ZIP: Alle drei sicheren Pfade müssen denselben HTTPS-Ursprung haben und dürfen keine Abfrage, kein Fragment, keine Zugangsdaten und keine übergeordneten Segmente enthalten.",
  "generate.network_check": "Netzwerkprüfung nach der Veröffentlichung",
  "generate.local_only": "Dieser Browser prüft nur das lokale Dokument. Die CLI prüft Discovery, Authority, Redirects, Medientyp und die veröffentlichte Policy, da CORS Browseranfragen blockieren kann.",
  "generate.security_txt_uri_error": "Die security.txt-URI muss eine exakte HTTPS-URL auf /.well-known/security.txt sein",
  "generate.editor_mode": "Editormodus",
  "generate.editor_guided": "Geführter Editor",
  "generate.editor_json": "Erweitertes JSON",
  "generate.editor_json_help": "Die direkte JSON-Bearbeitung erhält jeden V1-Wert. Ein gültiges Dokument können Sie wieder in den geführten Editor übernehmen.",
  "generate.editor_apply_json": "JSON in geführten Editor übernehmen",
  "generate.editor_identity": "Dokument und Organisation",
  "generate.editor_identity_help": "Der Herausgeber und die beiden Zeitpunkte, die diese konkrete Erklärung begrenzen.",
  "generate.editor_org_name": "Name der Organisation",
  "generate.editor_org_uri": "Website der Organisation",
  "generate.editor_last_updated": "Zuletzt aktualisiert",
  "generate.editor_expires": "Gültig bis",
  "generate.editor_set_now": "Auf jetzt setzen",
  "generate.editor_contact": "Meldekontakt",
  "generate.editor_contact_help": "Geordnete mailto-, tel- oder HTTPS-URIs. Das sind Kontaktwege; V1 definiert keinen Meldetransport.",
  "generate.editor_channels": "Kontaktwege, eine URI pro Zeile",
  "generate.editor_channels_help": "Mindestens einer. Ordnen Sie die Kontaktwege nach Ihrer Präferenz.",
  "generate.editor_languages": "Bevorzugte Sprach-Tags, einer pro Zeile",
  "generate.editor_encryption": "Verschlüsselungs-URIs, eine pro Zeile",
  "generate.editor_research": "Grundhaltung zur Forschung",
  "generate.editor_research_help": "Die Grundhaltung liefert Kontext. Selbst open erlaubt ohne ausdrückliche Regel keine Tests.",
  "generate.editor_posture": "Grundhaltung",
  "generate.editor_posture_open": "Offen für Forschung",
  "generate.editor_posture_limited": "Eingeschränkte Forschung",
  "generate.editor_posture_report_only": "Nur Meldungen",
  "generate.editor_posture_prohibited": "Forschung untersagt",
  "generate.editor_statement": "Erklärung des Herausgebers",
  "generate.editor_scope": "Meldebereich",
  "generate.editor_scope_help": "Die beschriebenen Assets können gemeldet werden. Der Bereich beweist kein Eigentum und erlaubt keine Tests.",
  "generate.editor_web_scope": "Webziele",
  "generate.editor_add_web": "Webziel hinzufügen",
  "generate.editor_web_entry": "Webziel {n}",
  "generate.editor_product_scope": "Produkte",
  "generate.editor_add_product": "Produkt hinzufügen",
  "generate.editor_product_entry": "Produkt {n}",
  "generate.editor_id": "Stabile ID",
  "generate.editor_state": "Bereichsstatus",
  "generate.editor_rule_state": "Regelstatus",
  "generate.editor_in": "Meldbar (in)",
  "generate.editor_out": "Ausgeschlossen (out)",
  "generate.editor_host": "Host",
  "generate.editor_path": "Pfadpräfix",
  "generate.editor_ports": "Ports, durch Kommas getrennt",
  "generate.editor_subdomains": "Subdomains einschließen",
  "generate.editor_product_name": "Produktname",
  "generate.editor_identifiers": "Produkt-Identifier-URIs, eine pro Zeile",
  "generate.editor_testing": "Testregeln",
  "generate.editor_testing_help": "Regeln sind Erklärungen des Herausgebers ohne eigenständige Rechtswirkung. Verbote überstimmen Erlaubnisse.",
  "generate.editor_testing_enable": "Ausdrückliche Testregeln aufnehmen",
  "generate.editor_testing_notice": "Erlaubende Regeln brauchen Ziel-IDs. Automatisierte Scans und Fuzzing brauchen außerdem Raten- und Parallelitätsgrenzen; Credential-Tests zusätzlich ausschließlich Testkonten.",
  "generate.editor_add_rule": "Regel hinzufügen",
  "generate.editor_rule": "Testregel {n}",
  "generate.editor_activity": "Aktivität oder Extension-URI",
  "generate.editor_activity_custom": "Eigene Extension-Aktivität",
  "generate.editor_activity_uri": "URI der eigenen Aktivität",
  "generate.editor_prohibited": "Untersagt",
  "generate.editor_permitted": "Vom Herausgeber als erlaubt erklärt",
  "generate.editor_permitted_unavailable": "Erlaubnisregeln benötigen eine offene oder eingeschränkte Grundhaltung und mindestens ein meldbares Webziel.",
  "generate.editor_target_ids": "Ziel-IDs, eine pro Zeile",
  "generate.editor_no_testing_targets": "Fügen Sie ein meldbares Webziel hinzu, bevor Sie eine Testaktivität erlauben.",
  "generate.editor_conditions": "Bedingungen aufnehmen",
  "generate.editor_rps": "Anfragen pro Sekunde, höchstens",
  "generate.editor_concurrency": "Gleichzeitige Anfragen, höchstens",
  "generate.editor_user_agent": "Erforderlicher User-Agent-Text",
  "generate.editor_test_accounts": "Nur Testkonten",
  "generate.editor_reporting": "Meldepräferenzen",
  "generate.editor_reporting_help": "Gewünschte Felder sind Präferenzen, keine Einreichungspflichten. V1 definiert weder Intake-Endpunkt noch API oder Meldetransport.",
  "generate.editor_requested_fields": "Gewünschte Angaben in Meldungen",
  "generate.editor_requested_affected_asset": "Betroffenes Asset",
  "generate.editor_requested_vulnerability_type": "Art der Schwachstelle",
  "generate.editor_requested_description": "Beschreibung",
  "generate.editor_requested_reproduction_steps": "Reproduktionsschritte",
  "generate.editor_requested_impact": "Auswirkung",
  "generate.editor_requested_environment": "Umgebung",
  "generate.editor_requested_evidence": "Belege",
  "generate.editor_requested_researcher_contact": "Kontakt der meldenden Person",
  "generate.editor_requested_disclosure_preference": "Offenlegungspräferenz",
  "generate.editor_proof": "Ausnutzungsbeleg",
  "generate.editor_proof_not_requested": "Nicht gewünscht",
  "generate.editor_proof_requested": "Falls sicher gewünscht",
  "generate.editor_proof_prohibited": "Untersagt",
  "generate.editor_response": "Antwortziele",
  "generate.editor_response_help": "Optionale operative Zielwerte, keine Zusagen oder Garantien.",
  "generate.editor_response_enable": "Antwortziele angeben",
  "generate.editor_ack_days": "Eingangsbestätigung innerhalb von Tagen",
  "generate.editor_assessment_days": "Erste Einschätzung innerhalb von Tagen",
  "generate.editor_update_days": "Abstand der Zwischenstände in Tagen",
  "generate.editor_disclosure": "Offenlegungspräferenz",
  "generate.editor_disclosure_help": "Ein Wunsch zur Koordination, keine Erlaubnis zur Veröffentlichung.",
  "generate.editor_disclosure_enable": "Offenlegungspräferenz angeben",
  "generate.editor_approach": "Vorgehen",
  "generate.editor_approach_coordinated": "Koordiniert",
  "generate.editor_approach_case": "Von Fall zu Fall",
  "generate.editor_approach_none": "Keine Präferenz",
  "generate.editor_default_days": "Regelfrist in Tagen",
  "generate.editor_disclosure_statement": "Erklärung zur Offenlegung",
  "generate.editor_extensions": "Extensions",
  "generate.editor_extensions_help": "Optionale Daten mit URI-Schlüsseln. Kennzeichnen Sie eine Extension nur dann als kritisch, wenn sie vor Nutzung der Policy verstanden werden muss.",
  "generate.editor_critical_extensions": "Kritische Extension-URIs, eine pro Zeile",
  "generate.editor_extension": "Extension {n}",
  "generate.editor_extension_uri": "Extension-URI",
  "generate.editor_extension_value": "JSON-Wert",
  "generate.editor_extension_critical": "Diese Extension ist kritisch",
  "generate.editor_extension_error": "Extension-URIs müssen eindeutig und alle Werte gültiges JSON sein. Publikationsdateien bleiben bis zur Korrektur gesperrt.",
  "generate.editor_invalid": "Behebe die Fehler im geführten Editor, bevor du Publikationsdateien herunterlädst.",
  "generate.editor_add_extension": "Extension hinzufügen",

  "validate.title": "Policy prüfen",
  "validate.lead":
    "Datei einfügen, hineinziehen oder ein Beispiel laden. Hochgeladen wird nichts.",
  "validate.paste": "Einfügen",
  "validate.examples": "Beispiele",
  "validate.drop_hint": "Policy-JSON hierher ziehen oder Datei auswählen",
  "validate.result_valid": "Gültig",
  "validate.result_valid_local_v1": "Lokal gültiges V1-Dokument",
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
  "validate.v1_title": "CVD-Policy prüfen",
  "validate.v1_lead": "Fügen Sie JSON ein oder laden Sie es hoch. Die Prüfung läuft lokal in Ihrem Browser.",
  "validate.v1_notice": "V1 ist eine experimentelle Implementierung von",
  "validate.legacy_title": "Prüfung bisheriger 0.x-Versionen",
  "validate.legacy_body": "Nur für bestehende Dokumente der Versionen 0.1 und 0.2 einschalten.",
  "validate.policy_json": "Policy-JSON",
  "validate.v1_no_issues": "Keine Probleme gefunden.",
  "validate.local_scope": "Dieses Ergebnis belegt weder Authority noch korrekte Veröffentlichung, Eigentum, rechtliche Erlaubnis oder Testerlaubnis für ein Ziel.",
  "validate.deployed_title": "Veröffentlichte Policy prüfen",
  "validate.deployed_help": "Die CLI folgt /.well-known/security.txt zur dort angekündigten CVD-Policy-URI. Der Browser-Validator ermittelt sie nicht über das Netzwerk.",

  "explain.page_subtitle": "Richtlinie zur koordinierten Offenlegung von Schwachstellen",
  "explain.page_expires": "Diese Richtlinie gilt erklärtermaßen bis",
  "explain.title": "Legacy-0.x-Policy erklären",
  "explain.lead":
    "Ein eingefrorenes Dokument der Version 0.1 oder 0.2, ausgeschrieben für alle, die kein JSON lesen.",
  "explain.legacy_notice": "Dieser Erklärer unterstützt V1 nicht. Nutzen Sie Prüfen für die lokale Prüfung eines V1-Dokuments.",
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
  "activity.credential_testing": "Credential-Tests",
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
    "Bei unbekannter Version darf ein Tool nicht raten.",
  "issue.enum_invalid": "Dieser Wert ist nicht definiert.",
  "issue.enum_invalid.hint": "Erlaubt sind: {allowed}",
  "issue.posture_unknown": "Diese Grundhaltung ist nicht definiert.",
  "issue.posture_unknown.hint":
    "Erlaubt sind: open, limited, report_only, prohibited.",
  "issue.canonical_not_https": "canonical muss eine absolute https-URL sein.",
  "issue.canonical_not_https.hint":
    "Legacy-0.x-Beispiel: https://example.com/.well-known/cvd.json",
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
    "Tools behandeln das Dokument dann, als gäbe es keines.",
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
    "Solange dieser Host nicht selbst auf das Dokument verweist, übergehen Tools das Ziel.",
  "issue.canonical_has_credentials":
    "canonical enthält einen Benutzernamen oder ein Passwort.",
  "issue.canonical_has_credentials.hint":
    "Diese Datei wird veröffentlicht. Entfernen Sie die Zugangsdaten und behandeln Sie sie als kompromittiert.",
  "issue.scope_pattern_unusable":
    "{pattern} benennt keinen Host und trifft deshalb auf nichts zu.",
  "issue.scope_pattern_unusable.hint":
    "Tragen Sie einen Hostnamen ein, etwa example.com, oder *.example.com für alles darunter.",
  "issue.posture_contradiction":
    "Die Grundhaltung {posture} lädt nicht zu Tests ein, es sind aber Testregeln eingetragen.",
  "issue.posture_contradiction.hint":
    "Entfernen Sie die Regeln — oder wählen Sie die Grundhaltung limited oder open, wenn Sie Tests tatsächlich erlauben wollen.",
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
    "Setzen Sie cvd_policy auf {expected}, damit Tools den Block auswerten.",
  "issue.intake_profile_without_schema":
    "Sie nennen das Profil {profile}, geben aber keine Schema-URL an.",
  "issue.intake_profile_without_schema.hint":
    "Ohne Schema-URL muss ein Tool von den Vorgaben des Profils ausgehen.",
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

  "tools.schema_frozen": "0.1 und 0.2 sind eingefrorene Legacy-Formate; V1 kann sich ändern",
  "tools.report_profile": "Meldeprofil",
  "tools.report_profile_note": "nur Legacy 0.x; V1 definiert keinen Meldetransport",
  "tools.title": "Tools",
  "tools.lead":
    "Alles, was zur Umsetzung des Formats nötig ist — und alles, was nötig ist, um es ohne diese Seite zu nutzen.",
  "tools.for_implementers": "Für Entwickler",
  "tools.schema": "JSON Schema",
  "tools.library": "Bibliothek",
  "tools.cli": "Kommandozeile",
  "tools.on_npm": "auf npm",
  "tools.examples": "V1-Beispiele",
  "tools.legacy_examples": "Legacy-0.x-Beispiele",
  "tools.legacy_report_profile": "Legacy-Meldeprofil",
  "tools.corpus": "Testkorpus",
  "tools.action": "GitHub Action",
  "tools.cli_body":
    "Exit-Codes: 0 vollständiger V1-Erfolg, 1 Validierungsfehler, 2 ausdrückliche application/json-Kompatibilitätswarnung, 3 nicht erreichbar. application/json wird nur mit --allow-application-json akzeptiert.",
  "tools.securitytxt": "security.txt",
  "tools.securitytxt_body":
    "Die V1-Bibliothek erzeugt eine vollständige security.txt oder liefert einen zusammengeführten Text zurück. Kommentare, Reihenfolge, Leerzeilen, Zeilenenden und alle Felder außer vorherigen CVD-Policy-Einträgen bleiben erhalten.",
  "tools.securitytxt_signed":
    "Beim Zusammenführen einer im Klartext signierten Datei wird ein Fehler ausgelöst, statt die Signatur still zu zerstören. Das Ergebnis muss separat erzeugt und erneut signiert werden.",
  "tools.third_party": "Implementierungen Dritter",
  "tools.third_party_empty":
    "Diese Liste ist offen. Pull Requests sind willkommen.",
  "tools.v1_notice_intro": "Experimentelle Implementierung von",
  "tools.v1_notice_release": "Installieren Sie genau den angegebenen Release Candidate, nicht das wechselnde Tag next.",

  "faq.title": "Fragen",
  "faq.q_prohibit": "Was, wenn ich Tests verbieten will?",
  "faq.a_prohibit":
    "Dann schreiben Sie genau das hinein, als Grundhaltung prohibited oder report_only. Das ist eine vorgesehene Antwort und kein Eingeständnis. Wer sie liest, weiß, dass hier nicht anzusetzen ist, und Sie bekommen Meldungen auf dem Weg, den Sie selbst gewählt haben, statt über den Blogbeitrag einer fremden Person.",
  "faq.q_securitytxt": "Ersetzt das die security.txt?",
  "faq.a_securitytxt":
    "Nein. Die security.txt bleibt, wie sie ist, und behält ihre Aufgabe. Dieses Format ergänzt sie um ein einziges Feld, CVD-Policy, das auf eine Datei verweist — mit den Antworten, für die in der security.txt keine Felder vorgesehen sind.",
  "faq.q_securitytxt_write": "Schreibt das auch meine security.txt?",
  "faq.a_securitytxt_write":
    "Ja. Ohne vorhandene Datei erzeugt der V1-Generator Contact, Expires, Canonical, Policy und genau ein CVD-Policy-Feld mit der ausdrücklich gewählten HTTPS-Policy-URI. Bei einer vorhandenen Datei bleiben Kommentare und alle anderen Felder erhalten; alte CVD-Policy-Felder werden entfernt und der konfigurierte Wert genau einmal eingesetzt. Die Datei bleibt im Browser und wird nie hochgeladen.",
  "faq.q_signed": "Ich signiere meine security.txt. Was passiert dann?",
  "faq.a_signed":
    "RFC 9116 erlaubt eine im Klartext signierte security.txt, und jede Änderung zerstört ihre Signatur. Der Generator lehnt die Änderung deshalb ab und erzeugt keine geänderte Datei. Bereiten Sie eine unsignierte Fassung mit CVD-Policy vor und signieren Sie erst diese vollständige Datei erneut.",
  "faq.q_cra": "Ist das ein CRA-Nachweis?",
  "faq.a_cra":
    "Nein. Der Cyber Resilience Act verlangt Prozesse, keine JSON-Datei. Das Format kann festhalten, was Sie ohnehin entschieden haben: Kontaktstelle, unterstützte Versionen, Umgang mit der Offenlegung, und zwar so, dass ein Prüfer es lesen und ein Tool es testen kann. Das ist Dokumentation, keine Konformität.",
  "faq.q_legal": "Gibt mir das Rechtssicherheit?",
  "faq.a_legal":
    "Nein. Ein Policy-Dokument ist eine einseitige Erklärung: kein Vertrag, keine Einwilligung im strafrechtlichen Sinn, kein Haftungsausschluss. Wer sich darauf verlässt, trägt das Risiko selbst. Umgekehrt gilt dasselbe: Wer eines veröffentlicht, erwirbt daraus keinen Anspruch gegen Forschende. Wenn die Rechtslage für Ihre Entscheidung wichtig ist, fragen Sie eine Anwältin oder einen Anwalt, kein Dateiformat.",
  "faq.q_machine": "Lassen sich eingehende Meldungen maschinell verarbeiten?",
  "faq.a_machine": "V1 beschreibt gewünschte Meldefelder, veröffentlicht aber absichtlich keine Report-API und keinen Transport-Endpunkt. Meldungen gehen nur an einen vom Herausgeber gewählten öffentlichen Contact-Kanal.",
  "faq.q_versions": "Was passiert mit vorhandenen Dokumenten der Versionen 0.1 und 0.2?",
  "faq.a_versions": "Sie bleiben gültige Legacy-Formate und werden nicht stillschweigend umgewandelt. Dieser Generator schreibt das inkompatible V1-Entwurfsformat; für vorhandene Dokumente muss die Legacy-Validierung ausdrücklich gewählt werden.",
  "faq.q_who": "Wer betreibt diese Seite und wovon?",
  "faq.a_who":
    "Die Skalvar Technologies UG (haftungsbeschränkt) aus Wismar. Wir entwickeln Software für IT-Sicherheit und verdienen damit unser Geld — Produkte, die Sie bei uns kaufen können und für dieses Format nicht brauchen. V1 definiert keine Intake-API und keine Anbieterauswahl; Herausgeber wählen ihre eigene öffentliche Contact-URI. Sollte sich das je ändern, ist diese Seite nicht mehr neutral, und dann gehört das öffentlich gesagt.",
  "faq.q_others":
    "Warum nicht disclose.io, Bugcrowd oder eine Bug-Bounty-Plattform?",
  "faq.a_others":
    "Die lösen eine andere Aufgabe, und zwar gut: ein Programm betreiben, Forschende bezahlen, viele Meldungen sichten. Sie setzen voraus, dass Sie ein solches Programm überhaupt wollen. Die meisten Organisationen wollen das nicht und haben deshalb bislang gar nichts Maschinenlesbares anzubieten. Dieses Format setzt eine Ebene darunter an: eine Erklärung an der von Ihnen gewählten URI, ohne Konto lesbar.",
  "faq.q_official": "Ist das offiziell oder standardisiert?",
  "faq.a_official":
    "Nein. V1 ist eine experimentelle Implementierung von draft-behring-cvd-policy-00. Das vorgeschlagene security.txt-Feld und der Medientyp sind nicht registriert und können sich ändern; 0.1 und 0.2 bleiben veröffentlichte Legacy-Formate.",
  "faq.q_without": "Kann ich das ohne euch nutzen?",
  "faq.a_without":
    "Ja, darum geht es. Spezifikation und Schema stehen unter CC0: kopieren, selbst hosten, verändern. Bibliothek und Seite stehen unter Apache-2.0. Jedes erzeugte Dokument kommt ohne Anbieter aus und darf an jeder ausdrücklich gewählten HTTPS-URI veröffentlicht werden, die Sie kontrollieren. Einen Rückkanal zu uns gibt es nicht.",
  "faq.q_data": "Was passiert mit den Daten, die ich eingebe?",
  "faq.a_data":
    "Sie bleiben auf der aktuellen Seite. Der V1-Generator speichert die Policy nicht; beim Neuladen oder Verlassen der Seite geht sie verloren. Es gibt keinen Server, an den etwas gesendet wird.",

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
    "Diese Seite setzt keine Cookies, lädt keine externen Ressourcen und wertet nichts aus. Was Sie in Generator, Prüfung oder Erklärung eingeben, verarbeitet allein Ihr Browser; übertragen wird nichts. Der V1-Generator speichert keine Policy-Daten; nur die gewählte Sprache liegt im Local Storage und lässt sich im Browser löschen.",
  "imprint.hosting_title": "Hosting",
  "imprint.hosting_body":
    "Statisches Hosting in der EU. In den Server-Logs können die üblichen Zugriffsdaten anfallen; sie dienen dem Betrieb und der Absicherung der Seite.",
  "imprint.funding_title": "Finanzierung",
  "imprint.licence_title": "Lizenzen",
};
