// Function to toggle the customer card
function toggleCard(button) {
    var card = button.closest('.customer').querySelector('.customer-links');

    if (card) {
        if (card.style.display === "none" || card.style.display === "") {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    }
}

// Function to add percentage symbol
function addPercentageSymbol(input) {
    if (input.value && !input.value.trim().endsWith('%')) {
        input.value = input.value.trim() + '%';
    }
}

// Function to add MB
function addMB(input) {
    if (input.value && !input.value.trim().endsWith('MB') && !input.value.trim().endsWith('mb')) {
        input.value = input.value.trim() + 'MB';
    }
}

// Function to add credits
function addCredits(input) {
    if (input.value && !input.value.trim().endsWith('Credits')) {
        input.value = input.value.trim() + 'Credits';
    }
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

    // Ziel-URL für die Weiterleitung (z. B. eine statische Seite)
    const targetUrl = "http://localhost:3000/index.html";

    // Token vom Server generieren lassen
    fetch("http://localhost:3000/generate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, expiryDate, url: targetUrl }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.token) {
                // URL mit Token erstellen
                const url = `http://localhost:3000/access-link?token=${data.token}`;

                // Link in der Datenbank speichern
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
                    .catch((err) =>
                        console.error("Fehler beim Erstellen des Links:", err)
                    );
            } else {
                console.error("Fehler: Kein Token erhalten.");
            }
        })
        .catch((err) => console.error("Fehler beim Generieren des Tokens:", err));

    // Felder zurücksetzen
    document.getElementById("link-name").value = "";
    document.getElementById("date").value = "";
});

// Links beim Laden der Seite abrufen
fetchLinks();