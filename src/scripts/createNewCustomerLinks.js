document.addEventListener("DOMContentLoaded", () => {
  // Initialisiert und setzt Event-Listener nach dem Laden des DOMs
  const alertContainer = document.getElementById("credit-alerts");

  alertContainer.innerHTML = `<div class="alert-icon">⚠️</div>`;

  alertContainer.addEventListener("click", (e) => {
    alertContainer.classList.toggle("expanded");
    e.stopPropagation();
  });

  document.addEventListener("click", (e) => {
    if (
      !alertContainer.contains(e.target) &&
      alertContainer.classList.contains("expanded")
    ) {
      alertContainer.classList.remove("expanded");
    }
  });

  // Lädt alle offenen Guthabenanfragen vom Server
  fetch("/credit-requests")
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        data.requests.forEach((request) => {
          const alertDiv = document.createElement("div");
          alertDiv.className = "credit-alert";
          alertDiv.innerHTML = `<span>${request.link_name}</span> von <strong>${request.customer_name}</strong> hat mehr Guthaben angefragt.`;
          alertContainer.appendChild(alertDiv);
        });
      }
    })
    .catch((err) =>
      console.error("Fehler beim Laden der Guthabenanfragen:", err)
    );

  // Lädt Karten für alle bestehenden Kunden
  const customers = document.querySelectorAll(".customer");
  customers.forEach((customer) => {
    const customerId = customer.dataset.id;
    if (customerId) {
      loadCustomerCards(customerId);
    }
  });

  // Event-Listener für das Erstellen eines neuen Links
  document.getElementById("submit-link").addEventListener("click", function () {
    const projectName = document.getElementById("project-name").value;
    const customerId =
      document.getElementById("new-link-form").dataset.customerId;

    if (!projectName) {
      alert("Bitte Projektname eingeben!");
      return;
    }

    // Erstellt ein Ablaufdatum 30 Tage in der Zukunft
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);
    const formattedExpirationDate = expirationDate.toISOString().split("T")[0];

    // Sendet eine POST-Anfrage an den Server, um eine neue Karte zu erstellen
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

// Schaltet die Sichtbarkeit der Kundenkarten um
function toggleCard(button) {
  const card = button.closest(".customer").querySelector(".customer-links");
  if (card) {
    card.style.display =
      card.style.display === "none" || card.style.display === ""
        ? "block"
        : "none";
  }
}

// Öffnet das Formular zum Erstellen eines neuen Links
function openNewLinkForm(customerId) {
  const form = document.getElementById("new-link-form");
  form.style.display = "block";
  form.dataset.customerId = customerId;
}

// Schließt das Formular zum Erstellen eines neuen Links
function closeNewLinkForm() {
  const form = document.getElementById("new-link-form");
  form.style.display = "none";
  form.dataset.customerId = "";
}

// Lädt die Karten für einen bestimmten Kunden
function loadCustomerCards(customerId) {
  console.log(`Lade Karten für Kunde ${customerId}`);

  fetch(`/customers/${customerId}/cards?timestamp=${Date.now()}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP-Fehler! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Erhaltene Karten:", data);

      const customerElement = document.querySelector(
        `.customer[data-id='${customerId}']`
      );

      if (!customerElement) {
        console.warn(`Kein Kunden-Element für ID ${customerId} gefunden.`);
        return;
      }

      const customerLinks = customerElement.querySelector(".customer-links");
      if (!customerLinks) {
        console.warn(`Kein ".customer-links"-Element für Kunde ${customerId} gefunden.`);
        return;
      }

      customerLinks.innerHTML = "";
      data.cards.forEach((card) => addCardToCustomer(card, customerId));
    })
    .catch((err) => console.error("Fehler beim Laden der Karten:", err));
}

// Aktualisiert die Einstellungen einer Karte
function updateCardSettings(input) {
  const cardId = input.dataset.cardId;
  let fieldName = input.name;
  let value = input.value;

  const fieldMapping = {
    fformat: "file_format",
    fsize: "max_file_size",
    dcompression: "compression_level",
    edate: "expiration_date",
  };

  if (fieldMapping[fieldName]) {
    fieldName = fieldMapping[fieldName];
  }

  if (fieldName === "compression_level" && !value.includes("%")) {
    value += "%";
  } else if (fieldName === "max_file_size" && !value.toLowerCase().includes("mb")) {
    value += " MB";
  }

  console.log(`Updating ${fieldName} for card ${cardId} with value: ${value}`);

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
    .catch((error) => console.error("Fehler beim Aktualisieren der Karte:", error));
}

// Löscht eine Karte nach Bestätigung
function deleteCard(cardId) {
  if (!confirm("Möchtest du diese Karte wirklich löschen?")) return;

  fetch(`/cards/${cardId}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        document.querySelector(`.card[data-id='${cardId}']`).remove();
      } else {
        alert("Fehler beim Löschen der Karte: " + data.message);
      }
    })
    .catch((err) => console.error("Fehler beim Löschen der Karte:", err));
}

document.addEventListener("DOMContentLoaded", () => {
  // Lädt Karten für alle vorhandenen Kunden beim Start
  const customers = document.querySelectorAll(".customer");
  customers.forEach((customer) => {
    const customerId = customer.dataset.id;
    if (customerId) {
      loadCustomerCards(customerId);
    }
  });

  // Globaler Event-Listener für Änderungen an allen Eingabefeldern
  document.addEventListener("change", (event) => {
    const target = event.target;

    if (target.matches(".edate")) {
      const expirationDate = new Date(target.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (expirationDate < today) {
        target.classList.add("expired");
      } else {
        target.classList.remove("expired");
      }
    }

    if (target.matches(".fformat, .fsize, .dcompression, .edate")) {
      updateCardSettings(target);
    }

    if (target.matches(".credits")) {
      const cardId = target.dataset.cardId;
      const credits = parseInt(target.value);

      if (!cardId) {
        console.error("Keine cardId gefunden. Abbruch des Updates.");
        alert("Fehler: Keine Karten-ID gefunden.");
        return;
      }

      if (isNaN(credits) || credits < 0) {
        alert("Bitte geben Sie eine gültige Anzahl von Credits ein.");
        return;
      }

      console.log("Sende PATCH-Request an /cards/" + cardId, { credits });

      // Sendet PATCH-Request zur Aktualisierung der Credits
      fetch(`/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            console.log("Credits erfolgreich aktualisiert.");
          } else {
            console.error("Fehler beim Aktualisieren der Credits:", data.message);
            alert("Fehler beim Aktualisieren der Credits.");
          }
        })
        .catch((err) => console.error("Fehler:", err));
    }
  });
});

// Fügt eine neue Karte dynamisch zur Benutzeroberfläche hinzu
function addCardToCustomer(card, customerId) {
  const customer = document.querySelector(`.customer[data-id='${customerId}']`);
  const customerLinks = customer.querySelector(".customer-links");

  const expirationDate = new Date(card.expiration_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Vergleich nur auf Datumsebene
  const isExpired = expirationDate < today;

  const truncateText = (text, maxLength = 25) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Erstellt das HTML-Template für die Karte
  const cardHTML = `
    <div class="card" data-id="${card.id}">
      <div class="project">
        <h3>${card.name}</h3>
        <div class="project-link">
          <a href="${card.url || "#"}" target="_blank" rel="noopener noreferrer">
            ${truncateText(card.url || "Keine URL angegeben")}
          </a>
          <span class="icon delete-card" data-card-id="${card.id}">delete</span> 
        </div>
      </div>
      <div class="settings">
        <form class="setting-1">
          <label for="fformat">Dateiformat</label>
          <select class="fformat" name="fformat" data-card-id="${card.id}">
            <option value=".jpg" ${card.file_format === ".jpg" ? "selected" : ""}>.jpg</option>
            <option value=".png" ${card.file_format === ".png" ? "selected" : ""}>.png</option>
          </select>
          <label for="fsize">Dateigröße (max.)</label>
          <input type="text" placeholder="50 MB" value="${card.max_file_size || ""}" class="fsize" name="fsize" data-card-id="${card.id}">
        </form>
        <form class="setting-2">
          <label for="dcompression">Komprimierungsgrad</label>
          <input type="text" placeholder="80%" value="${card.compression_level || ""}" class="dcompression" name="dcompression" data-card-id="${card.id}">
        </form>
        <form class="setting-3">
          <label for="edate">Ablaufdatum des Links</label>
          <input type="date" value="${card.expiration_date || ""}" class="edate ${isExpired ? "expired" : ""}" name="edate" data-card-id="${card.id}">
          <label for="credits">Guthaben Anzeige</label>
          <input type="text" placeholder="0 Credits" class="credits" name="credits" data-card-id="${card.id}" value="${card.credits || 0}">
        </form>
      </div>
    </div>
  `;

  // Fügt die generierte Karte in das DOM ein
  customerLinks.insertAdjacentHTML("beforeend", cardHTML);

  // Markiert das Ablaufdatum-Feld als abgelaufen, falls zutreffend
  const inputField = customerLinks.querySelector(`.edate[data-card-id="${card.id}"]`);
  if (isExpired) {
    inputField.classList.add("expired");
  } else {
    inputField.classList.remove("expired");
  }

  // Fügt Event-Listener für den Lösch-Button hinzu
  const deleteButton = customerLinks.querySelector(`.delete-card[data-card-id='${card.id}']`);
  deleteButton.addEventListener("click", () => deleteCard(card.id));
}

// Öffnet das Formular für einen neuen Link, setzt das Eingabefeld zurück und fügt einen Hintergrund-Blur hinzu
function openNewLinkForm(customerId) {
  const form = document.getElementById("new-link-form");
  const body = document.body;

  form.querySelector("#project-name").value = "";

  form.style.display = "block";
  body.classList.add("blur-active");
  form.dataset.customerId = customerId;

  setTimeout(() => {
    document.addEventListener("click", handleOutsideClick);
  }, 0);
}

// Schließt das Formular für den neuen Link und entfernt den Hintergrund-Blur
function closeNewLinkForm() {
  const form = document.getElementById("new-link-form");
  const body = document.body;

  form.style.display = "none";
  form.dataset.customerId = "";
  body.classList.remove("blur-active");

  document.removeEventListener("click", handleOutsideClick);
}

// Erkennt Klicks außerhalb des Formulars und schließt es gegebenenfalls
function handleOutsideClick(event) {
  const form = document.getElementById("new-link-form");

  if (!form.contains(event.target)) {
    closeNewLinkForm();
  }
}

// Verhindert das Schließen des Formulars, wenn innerhalb des Formulars geklickt wird
document.getElementById("new-link-form").addEventListener("click", (event) => {
  event.stopPropagation();
});