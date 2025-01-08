// Hilfsfunktion zum Erstellen eines verschlüsselten JWT
function generateToken(name, expiryDate) {
    // Beispiel für JWT-Generierung mit einem simplen Ansatz (nur für Demo-Zwecke)
    const payload = {
        name: name,
        exp: Math.floor(new Date(expiryDate).getTime() / 1000), // Unix Timestamp
    };
    const base64Payload = btoa(JSON.stringify(payload)); // Encodiert in Base64
    const signature = btoa("secret-key"); // Simulierte Signatur (geheime Schlüssel)
    return `${base64Payload}.${signature}`;
}

// Event-Listener für das Formular
document.getElementById("link-form").addEventListener("submit", function (event) {
    event.preventDefault(); // Verhindert das Neuladen der Seite

    // Eingabewerte abrufen
    const name = document.getElementById("link-name").value;
    const expiryDate = document.getElementById("date").value;

    if (!name || !expiryDate) {
        alert("Bitte alle Felder ausfüllen!");
        return;
    }

    // Token generieren
    const token = generateToken(name, expiryDate);

    // Ablaufdatum überprüfen
    const currentDate = new Date();
    const expiry = new Date(expiryDate);

    let link;
    if (currentDate > expiry) {
        // Link auf error.html verweisen, wenn abgelaufen
        link = `http://127.0.0.1:3000/POCs/8-poc-begrenzte-uploadlinks/public/error.html`;
    } else {
        // Link erstellen
        link = `http://127.0.0.1:3000/POCs/8-poc-begrenzte-uploadlinks/public/index.html?token=${token}`;
    }
    
    // Link in die Liste einfügen
    const linkList = document.getElementById("link-list");
    const listItem = document.createElement("li");
    listItem.innerHTML = `
        <strong>Name:</strong> ${name} <br />
        <strong>Gültig bis:</strong> ${expiryDate} <br />
        <strong>Link:</strong> <a href="${link}" target="_blank">${link}</a>
    `;
    linkList.appendChild(listItem);

    // Felder zurücksetzen
    document.getElementById("link-form").reset();
});
