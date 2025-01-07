# Proof of Concepts

## 2. Sicherstellung der Originalqualität trotz Dateikomprimierung.
### Herausforderung und Lösung  
Eine effiziente Komprimierung muss die Dateigröße reduzieren, ohne sichtbare oder hörbare Qualitätsverluste zu verursachen. Dies erfordert die Implementierung verlustfreier oder moderat verlustbehafteter Komprimierungsalgorithmen, die das Original möglichst exakt reproduzieren. Zusätzlich ist eine dynamische Anpassung an die Dateiinhalte notwendig, um optimale Ergebnisse zu erzielen.

### Wichtige Akteure  
- **Asset-Owner:** Erwartet, dass die optimierten Dateien die gleiche Qualität wie das Original aufweisen.  
- **Content-Manager:** Muss sicherstellen, dass die Ergebnisse den Anforderungen der Endnutzer entsprechen.  

### Was wird benötigt?  
- **Technologien:**  
  - **Komprimierungsbibliotheken:** FFmpeg (Videos), Pillow (Bilder), LAME (Audio).  
  - **Vergleichstools:** PSNR (Peak Signal-to-Noise Ratio), SSIM (Structural Similarity Index) für Qualitätsbewertungen.  
  - **Dynamische Algorithmen:** Adaptive Bitrate Encoding, z. B. mit x264 oder x265 für Videos.  

### Erfolgskriterien  
- Subjektiv keine Qualitätsverluste bei optimierten Bildern, Videos oder Audiodateien.  
- Messbare Qualitätsmetriken (z. B. SSIM-Wert > 0.95 oder PSNR-Wert > 40 dB).  

### Fehlerkriterien  
- Deutliche Verschlechterung der Qualität (visuell oder auditiv).  
- Nutzerbeschwerden über fehlerhafte oder minderwertige Dateien.  

---

## 6. Unterstützung alternativer Upload-Quellen (z. B. OneDrive, Dropbox).
### Herausforderung und Lösung  
Um die Flexibilität zu erhöhen, soll der Service auch das Hochladen von Dateien aus Cloud-Diensten wie OneDrive oder Dropbox ermöglichen. Dies erspart Nutzern das manuelle Herunterladen von Dateien auf ihren Computer und ermöglicht einen nahtlosen Upload aus bereits genutzten Diensten.

### Wichtige Akteure  
- **Asset-Owner:** Möchte Dateien direkt aus ihren Cloud-Speichern hochladen, ohne Dateien manuell auf ihren Computer herunterzuladen.  
- **Content-Manager:** Möchte sicherstellen, dass Uploads aus verschiedenen Quellen sicher und korrekt erfolgen.  

### Was wird benötigt?  
- **Technologien:**  
  - **Cloud-Dienst-APIs:** Nutzung der APIs von OneDrive, Dropbox, Google Drive, um den Datei-Upload zu ermöglichen.  
  - **OAuth2:** Für die Authentifizierung und die sichere Verbindung mit Cloud-Diensten.  
  - **Backend:** Node.js, Python oder ein anderes Framework zur Integration der Cloud-Dienste.  

### Erfolgskriterien  
- Nutzer können sich mit ihren Cloud-Konten verbinden und Dateien ohne Probleme hochladen.  
- Die Authentifizierung über OAuth2 funktioniert reibungslos und sicher.  

### Fehlerkriterien  
- Fehler bei der API-Verbindung oder Authentifizierung (z. B. ungültige Token oder Abbruch der Verbindung).  
- Hochgeladene Dateien sind beschädigt oder unvollständig.  

---

## 7. Benachrichtigung mit Downloadoption an Asset-Owner senden.
### Herausforderung und Lösung  
Der Asset-Owner soll die Möglichkeit haben, sich eine E-Mail mit dem Download-Link zuzuschicken.

### Wichtige Akteure  
- **Asset-Owner:** Möchte sich den Download-Link per E-Mail zuschicken können.  

### Was wird benötigt?  
- **Technologien:**  
  - **SMTP-Dienste:** Mailersend API oder SendGrid für das Senden von E-Mails.  
  - **Backend:** Node.js oder Python (Flask/Django) zur E-Mail-Erstellung und Versand.  
  - **HTTP-Client:** Postman für API-Tests und Anfragen.  

### Erfolgskriterien  
- Die E-Mail erreicht den Asset-Owner innerhalb einer festgelegten Zeit (z. B. 5 Minuten).  
- Der Download-Link in der E-Mail funktioniert einwandfrei und führt den Asset-Owner zum richtigen Bereich.  

### Fehlerkriterien  
- Zustellfehler: E-Mail kann nicht zugestellt werden (z. B. aufgrund ungültiger E-Mail-Adresse).  
- Der Download-Link ist fehlerhaft oder führt zu einer falschen Datei.  

---

## 8. Zeitlich begrenzte, verschlüsselte Upload- und Download-Links.
### Herausforderung und Lösung  
Um die Sicherheit der hochgeladenen Dateien zu gewährleisten, sollen die Links für Uploads und Downloads nur eine begrenzte Gültigkeit haben und verschlüsselt werden. Dies schützt die Daten vor unbefugtem Zugriff und stellt sicher, dass die Links nur während eines festgelegten Zeitraums genutzt werden können.

### Wichtige Akteure  
- **Asset-Owner:** Möchte sicherstellen, dass seine Dateien nur für eine begrenzte Zeit verfügbar sind.  
- **Content-Manager:** Verantwortlich für die Verwaltung und Generierung der sicheren Links.  

### Was wird benötigt?  
- **Technologien:**  
  - **Token-Generierung:** JWT (JSON Web Tokens) für die Verschlüsselung der Links.  
  - **Backend:** Node.js oder Python zur Generierung und Verwaltung der Links.  
  - **Datenbank:** MongoDB oder PostgreSQL für die Speicherung und Verwaltung der Links und ihrer Gültigkeitsdauer.  

### Erfolgskriterien  
- Upload- und Download-Links sind nur innerhalb des festgelegten Zeitrahmens gültig.  
- Links sind sicher und verschlüsselt, sodass sie nicht ohne Berechtigung verwendet werden können.  

### Fehlerkriterien  
- Links sind nach Ablauf des Zeitrahmens immer noch gültig.  
- Links sind unsicher und können leicht entschlüsselt oder missbraucht werden.  

---

## 9. Authentifizierung der Nutzer ohne Login über sichere Links.
### Herausforderung und Lösung  
Um den Prozess für Asset-Owner so einfach wie möglich zu gestalten, soll auf ein Login verzichtet werden. Stattdessen erhalten sie einen sicheren Link, der eine Authentifizierung ermöglicht. Dies vereinfacht den Zugang, ohne dass der Asset-Owner mehrere Anmeldeschritte durchführen muss.

### Wichtige Akteure  
- **Asset-Owner:** Möchte sicher auf die Anwendung zugreifen, ohne sich mit einem Passwort einloggen zu müssen.  
- **Content-Manager:** Verantwortlich für die Verwaltung der sicheren Links und der Zugangskontrolle.  

### Was wird benötigt?  
- **Technologien:**  
  - **Sichere Links:** UUIDs oder JWT für die Authentifizierung über Links.  
  - **Backend:** Node.js oder Python zur Generierung und Verifizierung der Links.  
  - **Datenbank:** Speicherung der sicheren Links in einer Datenbank, z. B. MongoDB.  

### Erfolgskriterien  
- Asset-Owner kann sich über den sicheren Link ohne weiteres Login einloggen.  
- Links sind sicher und führen nur zum berechtigten Zugang.  

### Fehlerkriterien  
- Links funktionieren nicht oder führen zu einer Authentifizierungsfehler-Seite.  
- Sicherheit des Links wird kompromittiert und er kann von Unbefugten genutzt werden.  
