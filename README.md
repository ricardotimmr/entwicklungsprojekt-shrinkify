# Shrinkify - Web-Anwendung zur Optimierung von Bildern

Dieses Projekt ist Teil des Entwicklungsprojekts von **Christian Noss** und hat das Ziel, eine eigenständige Web-Anwendung zu entwickeln, die Kunden ermöglicht, übergroße Bilder automatisch vor dem Hochladen in ein Content-Management-System (CMS) zu optimieren. Die Lösung soll Speicher- und Performance-Probleme verhindern, indem Dateigrößen reduziert und die Nutzung des CMS vereinfacht wird.

**Projektseite**: [Entwicklungsprojekt - Christian Noss](https://cnoss.github.io/entwicklungsprojekt/)

## Dateiübersicht
Für eine einfache Orientierung im Code folgt eine Übersicht der wichtigsten Dateien. Diese Übersicht beschränkt sich auf die **projektspezifischen Dateien und Ordner**, deren Namen **nicht selbsterklärend** sind.

- _**POCs**_: Die einzelnen Umsetzungen der POCs, die nicht miteinander zusammenhängen
- _**src**_: Source Ordner
    - _**assets**_: Logos (Dropox, Google Drive etc.)
    - _**fonts**_: Einbindung der Schriftarten
    - _**scripts**_: Skripte für JavaScript
        - _**assetowner.js**_: Clientseitiger Code für die Asset Owner Seite - Up- und Download der Dateien
        - _**createNewCustomer.js**_: Clientseitiger Code für die Content Manager Seite - Erstellung und Verwaltung der Customers(Asset Owner)
        - _**createNewCustomerLinks.js**_: Clientseitiger Code für die Content Manager Seite - Erstellung und Verwaltung der Cards(Projekte) und personalisierten Links
    - _**styles**_: CSS Dateien für das Frontend
    - _**assetowner.html**_: HTML Code für das Frontend der Asset Owner Seite
    - _**contentmanager.html**_: HTML Code für das Frontend der Content Manager Seite
    - _**index.html**_: HTML Code für die Landing Page 
- _**index.js**_: Serverseitiger Code

## Technologie-Stack

- **Frontend**: HTML, CSS,  JavaScript, Jetpack Compose 
- **Backend**: Node.js, Express.js  
- **Upload**: Multer, Google Drive,  Dropbox
- **Dateiverarbeitung (Komprimierung)**: Sharp
- **Datenbank**: SQLite
- **Sicherheit**: Jsonwebtoken, Input Validation
- **Deployment**: Docker

## Nutzungsanleitung

Für die Nutzung von Shrinkify ist es nicht notwenig alle Abhängigkeiten einzelend zu installieren. Da die Anwendung über Docker läuft genügt es Docker einzurichten und den Quellcode über folgende Befehle laufen zu lassen: <br>
`docker build -t node-webapp .`  <br>
`docker run -p 3000:3000 node-webapp` <br>

Es wird so ein Image erstellt, welches alle notwendigen Abhängigkeiten installiert und die reibungslose Nutzung der Shrinkify Webanwendung möglich macht.


## Verwendung

1. **Für Unternehmen/Einzelpersonen (Asset Owner)**: Besuche den personalisierten Link, der dir zur Verfügung gestellt wurde, und lade deine Dateien hoch. Die Anwendung optimiert die Dateien automatisch, und du kannst sie anschließend herunterladen.
   
2. **Für Admins (Content-Manager)**:
Melde dich im Admin-Dashboard an und lege die Vorgaben für die Optimierung für deine Kunden (Asset Owner) fest (z.B. Komprimierungsrate, maximale Auflösung). Erstelle personalisierte Links für Asset Owner und verwalte deren Dateiupload-Guthaben.

## Dokumentation & Ressourcen

- **Wiki**: Detaillierte technische Dokumentation und Anleitungen zur Nutzung der Anwendung findest du im [Projekt-Wiki](https://github.com/ricardotimmr/entwicklungsprojekt-shrinkify/wiki)
- **Exposé**: [Exposé ‐ Web‐Anwendung zur automatischen Dateikomprimierung für CMS](https://github.com/ricardotimmr/entwicklungsprojekt-shrinkify/wiki/Exposé-%E2%80%90-Web%E2%80%90Anwendung-zur-automatischen-Dateikomprimierung-für-CMS)
- **Weekly Documentation**: [Wöchentliche Dokumentation der Arbeit an Shrinkify](https://github.com/ricardotimmr/entwicklungsprojekt-shrinkify/wiki/Weekly-Documentation)
- **Kanban Board**: [Kanban Board mit Issues für das Entwicklungsprojekt Shrinkify](https://github.com/users/ricardotimmr/projects/2)
- **Miro-Board**: Weitere Details und die visuelle Darstellung des Projekts findest du auf dem [Miro-Board](https://miro.com/app/board/uXjVLQGRIBo=/)

## Contributors

- [Mia Charlotte Henrichsmeyer](https://github.com/miahenri)
- [Cosima Hiromi Zink](https://github.com/cosimazink)
- [Ricardo Timm](https://github.com/ricardotimmr)
