## 4. Fortschrittsanzeige für Upload und Optimierung.
### Herausforderung und Lösung  
Das Fehlen einer Fortschrittsanzeige kann zu einer schlechten Nutzererfahrung führen, besonders bei längeren Uploads. Eine visuelle Anzeige gibt dem Nutzer eine Vorstellung davon, wie lange der Upload oder die Optimierung noch dauert, was zu einer besseren Wahrnehmung des Prozesses führt und Ungewissheit reduziert.

### Wichtige Akteure  
- **Asset-Owner:** Möchte während des Uploads sehen, wie viel des Prozesses bereits abgeschlossen ist.  
- **Content-Manager:** Möchte den Fortschritt bei der Dateikomprimierung überwachen können, um bei Bedarf eingreifen zu können.  

### Was wird benötigt?  
- **Technologien:**  
  - **Frontend-Frameworks:** React oder Vue.js für dynamische UI-Elemente.  
  - **Backend-Technologien:** Node.js oder Python (Flask/Django) zur Kommunikation von Statusmeldungen.  
  - **WebSockets:** Für Echtzeit-Updates der Fortschrittsanzeige (z. B. mit `socket.io` oder `WebSocket`).  

### Erfolgskriterien  
- Die Fortschrittsanzeige aktualisiert sich in Echtzeit, ohne den Nutzer zu stören.  
- Der Nutzer kann den Upload-/Optimierungsfortschritt eindeutig nachvollziehen (z. B. als Prozentangabe oder als Balken).  

### Fehlerkriterien  
- Fortschrittsanzeige bleibt beim Laden hängen oder zeigt falsche Werte.  
- Der Upload-/Optimierungsprozess wird ohne Fortschrittsanzeige durchgeführt, was zu Verwirrung führt.  
