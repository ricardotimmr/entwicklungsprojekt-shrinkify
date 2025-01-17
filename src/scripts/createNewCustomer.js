// Function to show the new customer form
document.getElementById("new-customer-button").addEventListener("click", function() {
    document.getElementById("new-customer-form").style.display = "block";
});

// Function to close the form
function closeCustomerForm() {
    document.getElementById("new-customer-form").style.display = "none";
}

document.getElementById("submit-customer").addEventListener("click", function() {
    const name = document.getElementById("customer-name").value;
    const email = document.getElementById("customer-email").value;

    if (name && email) {
        // Send the data to the backend to create the customer
        fetch("/create-customer", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                email: email
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update the customer list on success
                addCustomerToList(data.customer);
                closeCustomerForm(); // Close the form after submission
            } else {
                alert("Fehler: " + data.message);
            }
        })
        .catch(error => {
            console.error("Fehler beim Erstellen des Kunden:", error);
        });
    } else {
        alert("Bitte geben Sie sowohl den Namen als auch die E-Mail-Adresse ein.");
    }
});

function addCustomerToList(customer) {
    const customerList = document.querySelector(".customer-list");

    const customerDiv = document.createElement("div");
    customerDiv.classList.add("customer");
    
    const customerNameDiv = document.createElement("div");
    customerNameDiv.classList.add("customer-name");

    const customerButton = document.createElement("button");
    customerButton.classList.add("customer-button");
    customerButton.textContent = customer.name;
    customerButton.onclick = function() {
        toggleCard(this);
    };

    const customerIcon = document.createElement("span");
    customerIcon.classList.add("icon");
    customerIcon.textContent = "download";

    customerNameDiv.appendChild(customerButton);
    customerNameDiv.appendChild(customerIcon);
    
    // Create the new-link button for the customer
    const newLink = document.createElement("a");
    newLink.href = "/";
    newLink.classList.add("new-link");
    
    const linkText = document.createElement("p");
    linkText.textContent = "Neuer Link";
    
    const linkIcon = document.createElement("span");
    linkIcon.classList.add("icon");
    linkIcon.textContent = "add";

    newLink.appendChild(linkText);
    newLink.appendChild(linkIcon);

    // Create the customer links div (hidden by default)
    const customerLinksDiv = document.createElement("div");
    customerLinksDiv.classList.add("customer-links");
    customerLinksDiv.style.display = "none";

    // Append the new-link to the customer div
    customerDiv.appendChild(customerNameDiv);
    customerDiv.appendChild(customerLinksDiv);
    customerDiv.appendChild(newLink);

    // Append the customer card to the customer list
    customerList.appendChild(customerDiv);
}

function closeCustomerForm() {
    document.getElementById("new-customer-form").style.display = "none";
}