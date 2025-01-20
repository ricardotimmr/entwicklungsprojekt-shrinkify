// Open the new project form
function openProjectForm(button) {
    const customerDiv = button.closest(".customer");
    const projectForm = customerDiv.querySelector(".new-project-form");
    projectForm.style.display = "block";
}

// Close the new project form
function closeProjectForm(button) {
    const projectForm = button.closest(".new-project-form");
    projectForm.style.display = "none";
}

// Handle form submission
document.addEventListener("click", (event) => {
    if (event.target.classList.contains("submit-project")) {
        const customerDiv = event.target.closest(".customer");
        const projectForm = customerDiv.querySelector(".new-project-form");
        const projectName = projectForm.querySelector(".project-name").value.trim();
        const fileFormat = projectForm.querySelector(".file-format").value;
        const maxFileSize = projectForm.querySelector(".max-file-size").value.trim();
        const compressionLevel = projectForm.querySelector(".compression-level").value.trim();
        const expirationDate = projectForm.querySelector(".expiration-date").value;

        if (!projectName || !maxFileSize || !compressionLevel || !expirationDate) {
            alert("Bitte füllen Sie alle Felder aus.");
            return;
        }

        const customerId = customerDiv.getAttribute("data-customer-id");

        fetch("http://localhost:3000/customer_links", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                customer_id: customerId,
                project_name: projectName,
                file_format: fileFormat,
                max_file_size: maxFileSize,
                compression_level: compressionLevel,
                expiration_date: expirationDate,
            }),
        })
            .then((response) => response.json())
            .then((link) => {
                addLinkToCustomer(customerDiv, link);
                closeProjectForm(event.target);
            })
            .catch((error) => console.error("Error:", error));
    }
});

// Add the newly created link dynamically to the UI
function addLinkToCustomer(customerDiv, link) {
    const customerLinks = customerDiv.querySelector(".customer-links .card");
    const projectDiv = document.createElement("div");
    projectDiv.classList.add("project");

    projectDiv.innerHTML = `
        <h3>${link.project_name}</h3>
        <div class="project-link">
            <a href="/">https:/shrinkify.de/${link.project_name}/...</a>
            <span class="icon">delete</span>
        </div>
    `;

    customerLinks.appendChild(projectDiv);
}