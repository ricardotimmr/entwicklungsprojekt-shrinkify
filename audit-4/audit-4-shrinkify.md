# ADR Technologien

## Frontend
**Finale Entscheidung: Vanilla**
- Einfindung in Framework zeitaufwändig 
- Durch Vanilla schnellere Entwicklung ohne zusätzliches SetUp 
- Shrinkify benötigt keine komplexen UI-Interaktionen, die ein Framework rechtfertigen würden

## Backend
**Finale Entscheidung: Node.js mit Express.js**
- Gute Performance für Datei-Handling und Komprimierung.
- Einfache Integration mit modernen Frontends wie Vue.js oder React.
- Vielfältige Bibliotheken für personalisierte Links und Fortschrittsanzeigen.

## Konvertierungstechnologien
**Finale Entscheidung: Sharp**
- Ideal für eine JavaScript/Node.js-Umgebung aufgrund seiner Geschwindigkeit und Effizienz

## Containerisierungstechnologien
**Finale Entscheidung: Docker + Docker Compose**
- Docker Compose ermöglicht eine schnelle und unkomplizierte Verwaltung von Multi-Container-Anwendungen durch eine einfache Konfigurationsdatei
- Es bietet eine konsistente Entwicklungs- und Testumgebung
- Ressourcenschonender als vollständige virtuelle Maschinen

## Sicherheit
**Finale Entscheidung: JWT**
- Leichte, sichere und effiziente Lösung, um personalisierte Upload-Links zu schützen

Hauptgrund, weswegen wir der ursprünglichen Sicherheitsstrategie nicht exakt gefolgt sind: 
- Keine Verwendung von Login-System mit Benutzerkonten


# Poster

![Poster Shrinkify](ep-plakat-shrinkify.png)

- Orientiert an dem Design der TH Köln, integriert jedoch gleichzeitig unser eigenes Design
- Elemente unseres Designs wurden bewusst eingebunden, um die visuelle Identität der Anwendung zu wahren
- Kerninhalte: Szenario, Projektbeschreibung, Funktionsweise, Technologiestack & Zielsetzung