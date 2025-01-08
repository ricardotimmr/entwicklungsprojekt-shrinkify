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

// Links von der Datenbank abrufen
function fetchLinks() {
    fetch("http://localhost:3000/links")
        .then((response) => response.json())
        .then((data) => {
            const linkList = document.getElementById("link-list");
            linkList.innerHTML = ""; // Vorherige Links löschen

            data.forEach((link) => {
                const listItem = document.createElement("li");
                listItem.innerHTML = `
                    <strong>Name:</strong> ${link.name} <br />
                    <strong>Gültig bis:</strong> ${link.expiry_date} <br />
                    <strong>Link:</strong> <a href="${link.url}" target="_blank">${link.url}</a>
                `;
                linkList.appendChild(listItem);
            });
        })
        .catch((err) => console.error("Fehler beim Abrufen der Links:", err));
}

// Event-Listener für das Formular
document.getElementById("link-form").addEventListener("submit", function (event) {
    event.preventDefault(); // Verhindert das Neuladen der Seite

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
    let url;
    if (currentDate > expiry) {
        // Link auf error.html verweisen, wenn abgelaufen
        url = `http://127.0.0.1:3000/POCs/8-poc-begrenzte-uploadlinks/public/error.html`;
    } else {
        // Link erstellen
        url = `http://127.0.0.1:3000/POCs/8-poc-begrenzte-uploadlinks/public/index.html?token=${token}`;
    }

    fetch("http://localhost:3000/create-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, expiryDate, url }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.message) {
                console.log(data.message);
                fetchLinks(); // Links erneut abrufen
            }
        })
        .catch((err) => console.error("Fehler beim Erstellen des Links:", err));

    // Felder zurücksetzen
    document.getElementById("link-name").value = "";
    document.getElementById("date").value = "";
});

document.getElementById("delete-all").addEventListener("click", function () {
    fetch("http://localhost:3000/delete-links", {
        method: "DELETE",
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.message) {
                console.log(data.message);
                fetchLinks(); // Links erneut abrufen
            }
        })
        .catch((err) => console.error("Fehler beim Löschen der Links:", err));
});

// Links beim Laden der Seite abrufen
fetchLinks();
