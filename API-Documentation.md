
# Shrinkify API Dokumentation

## Inhaltsverzeichnis
1. [Kundenverwaltung](#kundenverwaltung)
2. [Upload-Links](#upload-links)
3. [Dateiverwaltung](#dateiverwaltung)
4. [Bilder](#bilder)
5. [Credits](#credits)
6. [E-Mail-Versand](#e-mail-versand)
7. [Authentifizierung](#authentifizierung)

---

## Kundenverwaltung

### Erstelle einen neuen Kunden
**POST** `/customers`  
**Body:**
```json
{
  "name": "string",
  "email": "string"
}
```
**Antwort:**
```json
{
  "id": "integer",
  "name": "string",
  "email": "string"
}
```

### Alle Kunden abrufen
**GET** `/customers`  
**Antwort:**
```json
[
  {
    "id": "integer",
    "name": "string",
    "email": "string"
  }
]
```

---

## Upload-Links

### Erstelle einen neuen Upload-Link
**POST** `/cards`  
**Body:**
```json
{
  "customerId": "integer",
  "name": "string",
  "fileFormat": "string",
  "maxFileSize": "string",
  "compressionLevel": "string",
  "expirationDate": "YYYY-MM-DD",
  "credits": "integer"
}
```
**Antwort:**
```json
{
  "success": true,
  "card": {
    "id": "integer",
    "url": "string",
    "credits": "integer"
  }
}
```

### Lade alle Upload-Links eines Kunden
**GET** `/customers/:customerId/cards`

### Aktualisiere einen Upload-Link
**PATCH** `/cards/:cardId`  
**Body:** (mindestens ein Feld)
```json
{
  "file_format": "string",
  "max_file_size": "string",
  "compression_level": "string",
  "expiration_date": "YYYY-MM-DD",
  "credits": "integer"
}
```

### Lösche einen Upload-Link
**DELETE** `/cards/:cardId`

---

## Dateiverwaltung

### Lade eine Datei hoch
**POST** `/upload`  
**FormData:**
- **file**: Datei
- **cardId**: "integer"

**Antwort:**
```json
{
  "message": "Datei erfolgreich hochgeladen und komprimiert.",
  "compressed": {
    "name": "string",
    "path": "string",
    "size": "integer"
  }
}
```

### Lösche eine Datei
**DELETE** `/delete`  
**Body:**
```json
{
  "filename": "string"
}
```

---

## Bilder

### Bilder eines Upload-Links abrufen
**GET** `/images/:cardId`  

### Alle Bilder abrufen
**GET** `/images`  

### Alle Bilder als ZIP herunterladen
**GET** `/download-all/:cardId`  

---

## Credits

### Anfrage für zusätzliche Credits
**POST** `/request-credits`  
**Body:**
```json
{
  "cardId": "integer"
}
```

### Abrufen aller offenen Credit-Anfragen
**GET** `/credit-requests`

---

## E-Mail-Versand

### Sende einen Download-Link per E-Mail
**POST** `/send-email`  
**Body:**
```json
{
  "email": "string",
  "cardId": "integer"
}
```

---

## Authentifizierung

### Validierung eines Tokens
**GET** `/validate-token?token=XYZ`  
**Antwort:**
```json
{
  "valid": true,
  "data": {
    "cardId": "integer",
    "customerId": "integer",
    "projectName": "string"
  }
}
```