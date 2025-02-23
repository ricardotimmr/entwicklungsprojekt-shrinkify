document.addEventListener("DOMContentLoaded", () => {
    // Initialisierung und Event-Listener setzen
    loadCustomers();

    const form = document.getElementById("new-customer-form");
    const body = document.body;

    document.getElementById("new-customer-button").addEventListener("click", () => {
        form.style.display = "block";
        body.classList.add("blur-active");
    });

    document.querySelector(".close-btn").addEventListener("click", () => {
        form.style.display = "none";
        body.classList.remove("blur-active");
    });

    document.getElementById("submit-customer").addEventListener("click", () => {
        const name = document.getElementById("customer-name").value.trim();
        const email = document.getElementById("customer-email").value.trim();

        if (!name || !email) {
            alert("Bitte füllen Sie alle Felder aus.");
            return;
        }

        // Neuen Kunden an den Server senden
        fetch("http://localhost:3000/customers", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, email }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert("Fehler: " + data.error);
            } else {
                addCustomerToList(data);
                resetCustomerForm();
            }
        })
        .catch(error => console.error("Fehler:", error));
    });

    const searchInput = document.getElementById("customer-search");
    if (searchInput) {
        searchInput.addEventListener("input", filterCustomers);
    }
});

// Filtert Kunden basierend auf der Suchanfrage
function filterCustomers() {
    const searchValue = document.getElementById("customer-search").value.toLowerCase();
    const customers = document.querySelectorAll(".customer");

    customers.forEach(customer => {
        const customerName = customer.querySelector(".customer-button").textContent.toLowerCase();
        customer.style.display = customerName.includes(searchValue) ? "grid" : "none";
    });
}

// Lädt Kunden vom Server und zeigt sie an
function loadCustomers() {
    fetch(`http://localhost:3000/customers?timestamp=${Date.now()}`)
        .then(response => response.json())
        .then(customers => {
            const customerList = document.querySelector(".customer-list");
            customerList.innerHTML = "";

            customers.forEach(customer => {
                addCustomerToList(customer);
            });

            customers.forEach(customer => {
                loadCustomerCards(customer.id);
            });
        })
        .catch(error => console.error("Fehler beim Laden der Kunden:", error));
}

// Fügt einen neuen Kunden zur Benutzeroberfläche hinzu
function addCustomerToList(customer) {
    const customerList = document.querySelector(".customer-list");

    const customerDiv = document.createElement("div");
    customerDiv.classList.add("customer");
    customerDiv.setAttribute("data-id", customer.id);

    customerDiv.innerHTML = `
        <div class="customer-name">
            <button class="customer-button" onclick="toggleCard(this)">${customer.name}</button>
            <span class="icon">download</span>
        </div>
        <div class="customer-links" style="display: none;"></div>
        <a href="javascript:void(0);" class="new-link" onclick="openNewLinkForm('${customer.id}')">
            <p>Neuer Link</p>
            <span class="icon">add</span>
        </a>
    `;

    customerList.appendChild(customerDiv);
    loadCustomerCards(customer.id);
}

// Setzt die Eingabefelder des Formulars zurück und blendet es aus
function resetCustomerForm() {
    document.getElementById("customer-name").value = "";
    document.getElementById("customer-email").value = "";
    document.getElementById("new-customer-form").style.display = "none";
    document.body.classList.remove("blur-active");
}