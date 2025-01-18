// Function to show the new customer form
document.getElementById("new-customer-button").addEventListener("click", function () {
    document.getElementById("new-customer-form").style.display = "block";
});

// Function to close the new customer form
function closeCustomerForm() {
    document.getElementById("new-customer-form").style.display = "none";
}

document.getElementById("submit-customer").addEventListener("click", function () {
    const name = document.getElementById("customer-name").value.trim();
    const email = document.getElementById("customer-email").value.trim().toLowerCase();


    if (name && email) {
        // Send the data to the backend to create the customer
        fetch("/create-customer", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: name,
                email: email,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    // Update the customer list on success
                    addCustomerToList(data.customer);
                    closeCustomerForm(); // Close the form after submission
                } else {
                    alert("Fehler: " + data.message);
                }
            })
            .catch((error) => {
                console.error("Fehler beim Erstellen des Kunden:", error);
            });
    } else {
        alert("Bitte geben Sie sowohl den Namen als auch die E-Mail-Adresse ein.");
    }
});

function addCustomerToList(customer) {
    const customerList = document.querySelector(".customer-list");

    const customerHTML = `
    <div class="customer" data-id="${customer.id}">
        <div class="customer-name">
            <button class="customer-button" onclick="toggleCard(this)">${customer.name}</button>
            <span class="icon">download</span>
        </div>
        <div class="customer-links" style="display: none;">
            ${(customer.cards || []).map(card => `
                <div class="card" data-id="${card.id}">
                    <!-- Card content here -->
                </div>
            `).join('')}
        </div>
        <a href="javascript:void(0);" class="new-link" onclick="openNewLinkForm('${customer.id}')">
            <p>Neuer Link</p>
            <span class="icon">add</span>
        </a>
    </div>
`;


    customerList.insertAdjacentHTML("beforeend", customerHTML);
}
