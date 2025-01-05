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
