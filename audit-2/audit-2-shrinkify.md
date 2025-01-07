# Shrinkify Audit 2

## Design-Entscheidungen

Für unser Projekt haben wir uns auf zwei Design-Optionen festgelegt: <br>
Beide Designs teilen den gleichen strukturellen Aufbau und unterscheiden sich ausschließlich in der Farbwahl.

1. **Graues Design**  
   - Basisfarbe: Grau  
   - Header-Akzent: Orange, um visuell hervorzustechen  

**Linkpage:**

   ![Linkpage grey](images/laptop-link-page-grey.png)

**Admin-Dashboard:**

   ![Admin-Dashboard grey](images/laptop-admin-dashboard-grey.png)

2. **Lila Design**  
   - Hintergrund mit Farbverlauf: Dunkel Lila → Dunkel Blau  
   - Generelles Farbschema: Lila  

**Linkpage:**

   ![Linkpage purple](images/laptop-link-page-purple.png)

**Admin-Dashboard:**

   ![Admin-Dashboard purple](images/laptop-admin-dashboard-purple.png)

## Proof of Concepts

## 1. Schnelle und verzögerungsfreie Verarbeitung großer Dateien.
### Herausforderung und Lösung  
Große Dateien beanspruchen signifikante Systemressourcen, was zu Verarbeitungsengpässen führen kann. Um dies zu verhindern, werden moderne Serverarchitekturen eingesetzt, die Lasten verteilen und datenintensive Prozesse parallelisieren. Der Einsatz von datenstromorientierten Technologien reduziert die Ladezeiten und ermöglicht eine reibungslose Bearbeitung, selbst bei großen Dateien oder hoher Nutzerauslastung.

### Wichtige Akteure  
- **Asset-Owner:** Möchte große Dateien hochladen und möglichst schnell Ergebnisse erhalten.  
- **Content-Manager:** Erwartet eine stabile Performance der Anwendung, auch bei hohen Systemanforderungen.  

### Was wird benötigt?  
- **Technologien:**  
  - **Load Balancer:** NGINX oder HAProxy zur Verteilung von Anfragen.  
  - **Parallele Datenverarbeitung:** Multithreading-Frameworks wie `concurrent.futures` (Python) oder `java.util.concurrent` (Java).  
  - **Streaming-Technologien:** Apache Kafka oder RabbitMQ zur effizienten Datenübertragung und Verarbeitung.  
  - **Cloud-Speicher:** AWS S3, Azure Blob Storage oder Google Cloud Storage für schnelle Dateiablage.  

### Erfolgskriterien  
- Dateien größer als 500 MB werden innerhalb eines definierten Zeitrahmens verarbeitet (z. B. unter 60 Sekunden).  
- Der Server bleibt stabil und reagiert auch bei gleichzeitigen Uploads großer Dateien.  

### Fehlerkriterien  
- Verarbeitungszeit überschreitet die Toleranzgrenze (z. B. über 2 Minuten).  
- Server stürzt ab oder wird bei hoher Belastung nicht mehr erreichbar.  
- Qualitätsverlust bei der Datenverarbeitung aufgrund von Systemüberlastung.  

---

## 3. Effiziente Reduzierung der Dateigröße durch Kompression.
### Herausforderung und Lösung  
Die Dateigröße muss durch intelligente Algorithmen deutlich reduziert werden, um Speicherplatz zu sparen und Downloadzeiten zu verkürzen. Gleichzeitig sollen die Algorithmen anpassbar sein, je nach Dateityp und Komplexität.  

### Wichtige Akteure  
- **Asset-Owner:** Profitiert von schnelleren Uploads und einer verbesserten Performance beim Download.  
- **Content-Manager:** Kann durch geringeren Speicherverbrauch Ressourcen effizienter verwalten.  

### Was wird benötigt?  
- **Technologien:**  
  - **Algorithmen:** Huffman-Encoding, Run-Length-Encoding (RLE), oder Deep Learning-basierte Komprimierungsmodelle.  
  - **Software-Tools:** TinyPNG (Bilder), HandBrake (Videos).  
  - **Plattform-Integration:** Integration in Node.js-Services für Echtzeitverarbeitung.  

### Erfolgskriterien  
- Reduzierung der Dateigröße um mindestens 50%, ohne sichtbare Qualitätsverluste.  
- Schnelle Verarbeitung innerhalb von Sekunden bei Dateien bis zu 1 GB.  

### Fehlerkriterien  
- Dateien sind nach der Komprimierung beschädigt oder können nicht mehr geöffnet werden.  
- Reduktion der Dateigröße bleibt deutlich unter den Erwartungen (z. B. < 10%).     

---


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

---

## 5. Drag-and-Drop-Funktionalität für komfortablen Datei-Upload.
### Herausforderung und Lösung  
Eine benutzerfreundliche Drag-and-Drop-Oberfläche ermöglicht es Nutzern, Dateien schnell und einfach per Ziehen und Ablegen hochzuladen. Dies verbessert die User Experience und reduziert die Notwendigkeit für komplizierte Datei-Auswahldialoge.

### Wichtige Akteure  
- **Asset-Owner:** Erwartet eine einfache Möglichkeit, Dateien hochzuladen, ohne umständliche Datei-Auswahl verwenden zu müssen.  
- **Content-Manager:** Wünscht sich eine unkomplizierte Möglichkeit, Uploads zu validieren und zu überwachen.  

### Was wird benötigt?  
- **Technologien:**  
  - **Frontend-Frameworks:** HTML5 File API für Drag-and-Drop-Unterstützung.  
  - **Bibliotheken:** React Dropzone oder FilePond für eine benutzerfreundliche Datei-Drop-Zone.  
  - **CSS/JS:** Visualisierung von Drop-Zonen und Animationen beim Ziehen von Dateien.  

### Erfolgskriterien  
- Nutzer können Dateien per Drag-and-Drop hochladen, ohne zusätzliche Aktionen durchzuführen.  
- Uploads beginnen sofort nach dem Ablegen der Dateien und werden ohne Fehler verarbeitet.  

### Fehlerkriterien  
- Drag-and-Drop funktioniert nicht in allen gängigen Browsern.  
- Der Upload startet nicht korrekt, wenn Dateien per Drag-and-Drop abgelegt werden.  
