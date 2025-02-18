document.addEventListener("DOMContentLoaded", () => {
    // Initial load of cards for all customers
    const customers = document.querySelectorAll(".customer");
    customers.forEach(customer => {
        const customerId = customer.dataset.id;
        if (customerId) {
            loadCustomerCards(customerId);
        }
    });

    // Event listener for submitting a new link
    document.getElementById("submit-link").addEventListener("click", function () {
        const projectName = document.getElementById("project-name").value;
        const customerId = document.getElementById("new-link-form").dataset.customerId;

        if (!projectName) {
            alert("Bitte Projektname eingeben!");
            return;
        }

        // Create the card in the database
        fetch(`/cards`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customerId: customerId,
                name: projectName,
                expirationDate: new Date().toISOString().split('T')[0] // Example expiration date
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP-Fehler! Status: ${response.status}`);
                }
                return response.json();
            })
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
});

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

// Load cards for a specific customer
function loadCustomerCards(customerId) {
    console.log(`Loading cards for customer ${customerId}`); // Debugging

    fetch(`/customers/${customerId}/cards?timestamp=${Date.now()}`) // Cache-busting
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Received cards:", data); // Debugging
            if (data.success) {
                const customerLinks = document.querySelector(`.customer[data-id='${customerId}'] .customer-links`);
                customerLinks.innerHTML = ""; // Clear previous cards
                data.cards.forEach(card => addCardToCustomer(card, customerId));
            } else {
                console.error("Fehler beim Laden der Karten:", data.message);
            }
        })
        .catch(err => console.error("Fehler beim Laden der Karten:", err));
}

// Add a new card to the UI dynamically
function addCardToCustomer(card, customerId) {
    const customer = document.querySelector(`.customer[data-id='${customerId}']`);
    const customerLinks = customer.querySelector(".customer-links");

    const cardHTML = `
        <div class="card" data-id="${card.id}">
            <div class="project">
                <h3>${card.name}</h3>
                <div class="project-link">
                    <a href="${card.url || '#'}">${card.url || 'Keine URL angegeben'}</a>
                    <span class="icon">delete</span>
                </div>
            </div>
            <div class="settings">
                <form class="setting-1">
                    <label for="fformat">Dateiformat</label>
                    <select class="fformat" name="fformat" data-card-id="${card.id}">
                        <option value=".jpg" ${card.file_format === '.jpg' ? 'selected' : ''}>.jpg</option>
                        <option value=".png" ${card.file_format === '.png' ? 'selected' : ''}>.png</option>
                    </select>
                    <label for="fsize">Dateigröße (max.)</label>
                    <input type="text" placeholder="50 MB" value="${card.max_file_size || ''}" class="fsize" name="fsize" data-card-id="${card.id}">
                 </form>
                 <form class="setting-2">
                    <label for="dcompression">Komprimierungsgrad</label>
                    <input type="text" placeholder="80%" value="${card.compression_level || ''}" class="dcompression" name="dcompression" data-card-id="${card.id}">
                 </form>
                 <form class="setting-3">
                    <label for="edate">Ablaufdatum des Links</label>
                    <input type="date" value="${card.expiration_date || ''}" class="edate" name="edate" data-card-id="${card.id}">
                </form>
            </div>
        </div>
    `;

    customerLinks.insertAdjacentHTML("beforeend", cardHTML);
}
