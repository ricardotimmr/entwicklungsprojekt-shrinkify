// Function to toggle the customer card
function toggleCard(button) {
    const card = button.closest('.customer').querySelector('.customer-links');

    if (card) {
        card.style.display = card.style.display === "none" || card.style.display === "" ? "block" : "none";
    }
}

// Function to open the new link form
function openNewLinkForm(customerId) {
    const form = document.getElementById("new-link-form");
    form.style.display = "block";
    form.dataset.customerId = customerId; // Associate the form with the customer
}

// Function to close the new link form
function closeNewLinkForm() {
    const form = document.getElementById("new-link-form");
    form.style.display = "none";
    form.dataset.customerId = "";
}

// Event listener for creating a new link
document.getElementById("submit-link").addEventListener("click", function () {
    const projectName = document.getElementById("project-name").value;
    const customerId = document.getElementById("new-link-form").dataset.customerId;

    if (!projectName) {
        alert("Bitte Projektname eingeben!");
        return;
    }

    // Create the card in the database
    fetch(`/create-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, projectName }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                addCardToCustomer(data.card, customerId);
                closeNewLinkForm();
            } else {
                alert("Fehler: " + data.message);
            }
        })
        .catch((err) => console.error("Fehler beim Erstellen der Karte:", err));
});

function loadCustomerCards(customerId) {
    fetch(`/customer-cards/${customerId}`)
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                const customerLinks = document.querySelector(
                    `.customer[data-id='${customerId}'] .customer-links`
                );

                customerLinks.innerHTML = ""; // Remove old cards
                data.cards.forEach((card) => addCardToCustomer(card, customerId));
            } else {
                console.error("Fehler beim Laden der Karten:", data.message);
            }
        })
        .catch((err) => console.error("Fehler beim Laden der Karten:", err));
}

function addCardToCustomer(card, customerId) {
    const customer = document.querySelector(`.customer[data-id='${customerId}']`);
    const customerLinks = customer.querySelector(".customer-links");

    const cardHTML = `
        <div class="card" data-id="${card.id}">
            <div class="project">
                <h3>${card.projectName}</h3>
                <div class="project-link">
                    <a href="${card.url || '/'}">${card.url || 'https:/shrinkify.de/Projekt-1/...'}</a>
                    <span class="icon">delete</span>
                </div>
            </div>
            <div class="settings">
                <form class="setting-1">
                    <label for="fformat">Dateiformat</label>
                    <select class="fformat" name="fformat" data-card-id="${card.id}">
                        <option value=".jpg" ${card.format === '.jpg' ? 'selected' : ''}>.jpg</option>
                        <option value=".png" ${card.format === '.png' ? 'selected' : ''}>.png</option>
                    </select>
                    <label for="fsize">Dateigröße (max.)</label>
                    <input type="text" placeholder="50 MB" value="${card.size || ''}" onblur="addMB(this)" class="fsize" name="fsize" data-card-id="${card.id}">
                 </form>
                 <form class="setting-2">
                    <label for="dcompression">Komprimierungsgrad</label>
                    <input type="text" placeholder="80%" value="${card.compression || ''}" onblur="addPercentageSymbol(this)" class="dcompression" name="dcompression" data-card-id="${card.id}">
                 </form>
                 <form class="setting-3">
                    <label for="edate">Ablaufdatum des Links</label>
                    <input type="date" value="${card.expiryDate || ''}" class="edate" name="edate" data-card-id="${card.id}">
                    <label for="credits">Guthaben Anzeige</label>
                    <input type="text" placeholder="6 Credits" value="${card.credits || ''}" onblur="addCredits(this)" class="credits" name="credits" data-card-id="${card.id}">
                 </form>
            </div>
        </div>
    `;

    customerLinks.insertAdjacentHTML("beforeend", cardHTML);
}

// Function to update card settings
function updateCardSettings(event) {
    const cardId = event.target.dataset.cardId;
    const field = event.target.name;
    const value = event.target.value;

    fetch(`/update-card/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (!data.success) {
                alert("Fehler beim Aktualisieren der Einstellungen: " + data.message);
            }
        })
        .catch((err) => console.error("Fehler beim Aktualisieren der Einstellungen:", err));
}
