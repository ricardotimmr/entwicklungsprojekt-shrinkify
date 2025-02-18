document.addEventListener("DOMContentLoaded", () => {
    loadCustomers();

    const form = document.getElementById("new-customer-form");
    const body = document.body;
    
    // Show new customer form when clicking the button
    document.getElementById("new-customer-button").addEventListener("click", () => {
        form.style.display = "block";
        body.classList.add("blur-active");
    });

    // Close form when clicking the close button
    document.querySelector(".close-btn").addEventListener("click", () => {
        form.style.display = "none";
        body.classList.remove("blur-active");
    });

    // Handle form submission
    document.getElementById("submit-customer").addEventListener("click", () => {
        const name = document.getElementById("customer-name").value.trim();
        const email = document.getElementById("customer-email").value.trim();
    
        if (!name || !email) {
            alert("Bitte füllen Sie alle Felder aus.");
            return;
        }
    
        console.log("Submitting:", { name, email }); // Debugging
    
        fetch("http://localhost:3000/customers", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, email }),
        })
        .then(response => response.json())
        .then(data => {
            console.log("Response from server:", data); // Debugging
            if (data.error) {
                alert("Fehler: " + data.error);
            } else {
                addCustomerToList(data);
                resetCustomerForm();
            }
        })
        .catch(error => console.error("Error:", error));
    });

    const searchInput = document.getElementById("customer-search");

    if (searchInput) {
        searchInput.addEventListener("input", filterCustomers);
    }
});

// Function to filter customers
function filterCustomers() {
    const searchValue = document.getElementById("customer-search").value.toLowerCase();
    const customers = document.querySelectorAll(".customer");

    customers.forEach(customer => {
        const customerName = customer.querySelector(".customer-button").textContent.toLowerCase();
        
        if (customerName.includes(searchValue)) {
            customer.style.display = "grid"; // Show matching customers
        } else {
            customer.style.display = "none"; // Hide non-matching customers
        }
    });
}

// Fetch and display customers from the database
function loadCustomers() {
    fetch(`http://localhost:3000/customers?timestamp=${Date.now()}`) // Cache-busting
        .then(response => response.json())
        .then(customers => {
            const customerList = document.querySelector(".customer-list");
            customerList.innerHTML = "";
            customers.forEach(customer => {
                addCustomerToList(customer);
                // Now load cards for this customer
                loadCustomerCards(customer.id);
            });
        })
        .catch(error => console.error("Error loading customers:", error));
}

// Add a new customer to the UI dynamically
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

    // Ensure cards load for this customer
    loadCustomerCards(customer.id);
}

function resetCustomerForm() {
    document.getElementById("customer-name").value = "";
    document.getElementById("customer-email").value = "";
    document.getElementById("new-customer-form").style.display = "none";

    // Remove the blur effect from the body
    document.body.classList.remove("blur-active");
}