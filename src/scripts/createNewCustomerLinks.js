document.addEventListener("DOMContentLoaded", () => {
  // Initial load of cards for all customers
  const customers = document.querySelectorAll(".customer");
  customers.forEach((customer) => {
    const customerId = customer.dataset.id;
    if (customerId) {
      loadCustomerCards(customerId);
    }
  });

  // Event listener for submitting a new link
  document.getElementById("submit-link").addEventListener("click", function () {
    const projectName = document.getElementById("project-name").value;
    const customerId =
      document.getElementById("new-link-form").dataset.customerId;

    if (!projectName) {
      alert("Bitte Projektname eingeben!");
      return;
    }

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);
    const formattedExpirationDate = expirationDate.toISOString().split("T")[0];

    // Create the card in the database
    fetch(`/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: customerId,
        name: projectName,
        fileFormat: ".jpeg",
        maxFileSize: "50 MB",
        compressionLevel: "75%",
        expirationDate: formattedExpirationDate,
        credits: 0,
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
  const card = button.closest(".customer").querySelector(".customer-links");

  if (card) {
    card.style.display =
      card.style.display === "none" || card.style.display === ""
        ? "block"
        : "none";
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

  fetch(`/customers/${customerId}/cards?timestamp=${Date.now()}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Received cards:", data); // Debugging

      const customerElement = document.querySelector(
        `.customer[data-id='${customerId}']`
      );
      if (!customerElement) {
        console.warn(
          `Kein Kunden-Element für ID ${customerId} gefunden. Überspringe.`
        );
        return; // Fehler abfangen, aber Script nicht crashen lassen
      }

      const customerLinks = customerElement.querySelector(".customer-links");
      if (!customerLinks) {
        console.warn(
          `Kein ".customer-links"-Element für Kunde ${customerId} gefunden.`
        );
        return;
      }

      customerLinks.innerHTML = ""; // Vorherige Karten entfernen
      data.cards.forEach((card) => addCardToCustomer(card, customerId));
    })
    .catch((err) => console.error("Fehler beim Laden der Karten:", err));
}

document.addEventListener("DOMContentLoaded", () => {
  // Initial load of cards for all customers
  const customers = document.querySelectorAll(".customer");
  customers.forEach((customer) => {
    const customerId = customer.dataset.id;
    if (customerId) {
      loadCustomerCards(customerId);
    }
  });

  // Event-Listener für alle Eingabefelder hinzufügen
  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.matches(".fformat, .fsize, .dcompression, .edate")) {
      updateCardSettings(target);
    }
  });
});

// Funktion zum Aktualisieren der Karten-Einstellungen
function updateCardSettings(input) {
  const cardId = input.dataset.cardId;
  let fieldName = input.name;
  let value = input.value;

  // Mappe die HTML-Namen auf die Datenbank-Felder
  const fieldMapping = {
    fformat: "file_format",
    fsize: "max_file_size",
    dcompression: "compression_level",
    edate: "expiration_date",
  };

  // Falls das Feld im Mapping ist, ersetze es
  if (fieldMapping[fieldName]) {
    fieldName = fieldMapping[fieldName];
  }

  // Konvertiere spezielle Werte
  if (fieldName === "compression_level" && !value.includes("%")) {
    value += "%";
  } else if (
    fieldName === "max_file_size" &&
    !value.toLowerCase().includes("mb")
  ) {
    value += " MB";
  }

  console.log(`Updating ${fieldName} for card ${cardId} with value: ${value}`); // Debugging

  fetch(`/cards/${cardId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [fieldName]: value }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (!data.success) {
        console.error("Fehler beim Speichern der Änderungen:", data.message);
        alert("Fehler beim Speichern der Änderungen.");
      }
    })
    .catch((error) =>
      console.error("Fehler beim Aktualisieren der Karte:", error)
    );
}

//Card löschen
function deleteCard(cardId) {
  if (!confirm("Möchtest du diese Karte wirklich löschen?")) return;

  fetch(`/cards/${cardId}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Entferne die Karte aus dem DOM
        document.querySelector(`.card[data-id='${cardId}']`).remove();
      } else {
        alert("Fehler beim Löschen der Karte: " + data.message);
      }
    })
    .catch((err) => console.error("Fehler beim Löschen der Karte:", err));
}

document.addEventListener("change", (event) => {
  const target = event.target;

  // Prüfe, ob das geänderte Feld ein Ablaufdatum ist
  if (target.matches(".edate")) {
    const expirationDate = new Date(target.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Stelle sicher, dass nur das Datum verglichen wird

    if (expirationDate < today) {
      target.classList.add("expired");
    } else {
      target.classList.remove("expired");
    }
  }

  if (target.matches(".fformat, .fsize, .dcompression, .edate")) {
    updateCardSettings(target);
  }
});

// Add a new card to the UI dynamically
function addCardToCustomer(card, customerId) {
  const customer = document.querySelector(`.customer[data-id='${customerId}']`);
  const customerLinks = customer.querySelector(".customer-links");

  // Ablaufdatum als Date-Objekt erstellen
  const expirationDate = new Date(card.expiration_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Stelle sicher, dass nur das Datum verglichen wird

  const isExpired = expirationDate < today;

  const truncateText = (text, maxLength = 25) => {
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const cardHTML = `
        <div class="card" data-id="${card.id}">
            <div class="project">
                <h3>${card.name}</h3>
                <div class="project-link">
                    <a href="${
                      card.url || "#"
                    }" target="_blank" rel="noopener noreferrer">${truncateText(
    card.url || "Keine URL angegeben"
  )}</a>
                    <span class="icon delete-card" data-card-id="${
                      card.id
                    }">delete</span> 
                </div>
            </div>
            <div class="settings">
                <form class="setting-1">
                    <label for="fformat">Dateiformat</label>
                    <select class="fformat" name="fformat" data-card-id="${
                      card.id
                    }">
                        <option value=".jpg" ${
                          card.file_format === ".jpg" ? "selected" : ""
                        }>.jpg</option>
                        <option value=".png" ${
                          card.file_format === ".png" ? "selected" : ""
                        }>.png</option>
                    </select>
                    <label for="fsize">Dateigröße (max.)</label>
                    <input type="text" placeholder="50 MB" value="${
                      card.max_file_size || ""
                    }" class="fsize" name="fsize" data-card-id="${card.id}">
                 </form>
                 <form class="setting-2">
                    <label for="dcompression">Komprimierungsgrad</label>
                    <input type="text" placeholder="80%" value="${
                      card.compression_level || ""
                    }" class="dcompression" name="dcompression" data-card-id="${
    card.id
  }">
                 </form>
                 <form class="setting-3">
                    <label for="edate">Ablaufdatum des Links</label>
                    <input type="date" value="${
                      card.expiration_date || ""
                    }" class="edate ${
    isExpired ? "expired" : ""
  }" name="edate" data-card-id="${card.id}">
                    <label for="credits">Guthaben Anzeige</label>
                    <input type="text" placeholder="6 Credits" class="credits" name="credits">
                </form>
            </div>
        </div>
    `;

  customerLinks.insertAdjacentHTML("beforeend", cardHTML);

  // Ablaufdatum-Feld nachträglich mit Klasse "expired" versehen
  const inputField = customerLinks.querySelector(
    `.edate[data-card-id="${card.id}"]`
  );
  if (isExpired) {
    inputField.classList.add("expired");
  } else {
    inputField.classList.remove("expired");
  }

  // Event-Listener zum Löschen der Karte hinzufügen
  const deleteButton = customerLinks.querySelector(
    `.delete-card[data-card-id='${card.id}']`
  );
  deleteButton.addEventListener("click", () => deleteCard(card.id));
}
