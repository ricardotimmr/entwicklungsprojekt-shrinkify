document.addEventListener("DOMContentLoaded", () => {
    loadCustomers();
    
    // Show new customer form when clicking the button
    document.getElementById("new-customer-button").addEventListener("click", () => {
        document.getElementById("new-customer-form").style.display = "block";
    });

    // Close form when clicking the close button
    document.querySelector(".close-btn").addEventListener("click", () => {
        document.getElementById("new-customer-form").style.display = "none";
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

    // Event delegation for dynamically created buttons
    document.querySelector(".customer-list").addEventListener("click", (event) => {
        if (event.target.classList.contains("new-link")) {
            openProjectForm(event.target);
        }
    });
});

// Toggle the display of the customer links
function toggleCard(button) {
    const customerDiv = button.closest(".customer");
    const customerLinks = customerDiv.querySelector(".customer-links");

    if (customerLinks.style.display === "none" || customerLinks.style.display === "") {
        customerLinks.style.display = "block";
    } else {
        customerLinks.style.display = "none";
    }
}

// Fetch and display customers from the database
function loadCustomers() {
    fetch("http://localhost:3000/customers")
        .then(response => response.json())
        .then(customers => {
            const customerList = document.querySelector(".customer-list");
            customerList.innerHTML = "";
            customers.forEach(customer => addCustomerToList(customer));
        })
        .catch(error => console.error("Error loading customers:", error));
}

// Add a new customer to the UI dynamically
function addCustomerToList(customer) {
    const customerList = document.querySelector(".customer-list");

    const customerDiv = document.createElement("div");
    customerDiv.classList.add("customer");

    customerDiv.innerHTML = `
        <div class="customer-name">
            <button class="customer-button" onclick="toggleCard(this)">${customer.name}</button>
            <span class="icon">download</span>
        </div>
        <div class="customer-links" style="display: none;"></div>
        <button class="new-link" onclick="openProjectForm(this)">
                            <p>Neuer Link</p>
                            <span class="icon">add</span>
                        </button>
    `;

    customerList.appendChild(customerDiv);
}

// Reset the new customer form
function resetCustomerForm() {
    document.getElementById("customer-name").value = "";
    document.getElementById("customer-email").value = "";
    document.getElementById("new-customer-form").style.display = "none";
}