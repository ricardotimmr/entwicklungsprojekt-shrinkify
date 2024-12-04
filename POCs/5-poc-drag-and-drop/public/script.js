const form = document.querySelector("form");
const fileInput = document.getElementById("fileInput");
const dropArea = document.getElementById("drop-area");
const dropFileListElement = document.getElementById("drop-file-list"); // Bereich für die Anzeige der Drag-and-Drop-Dateien
const manualFileListElement = document.getElementById("manual-file-list"); // Bereich für die Anzeige der manuellen Dateien

let dropFiles = []; // Array für die Drag-and-Drop-Dateien
let manualFiles = []; // Array für die manuell ausgewählten Dateien

// Zeige die ausgewählten Dateien aus der Drag-and-Drop-Liste an
function updateFileList(files, listElement) {
    listElement.innerHTML = ""; // Leere die Liste

    // Für jede Datei in der Liste, erstelle ein Listenelement
    for (const file of files) {
        const listItem = document.createElement("li");
        listItem.textContent = `${file.name} (${(file.size / 1024).toFixed(2)} KB)`;

        // Füge einen "Entfernen"-Button hinzu
        const removeButton = document.createElement("button");
        removeButton.textContent = "Entfernen";
        removeButton.classList.add("remove-btn");

        // Event-Listener für den Entfernen-Button
        removeButton.addEventListener("click", () => {
            // Entferne die Datei aus der jeweiligen Liste
            removeFile(file, files);
            // Entferne das Listenelement
            listItem.remove();
        });

        listItem.appendChild(removeButton);
        listElement.appendChild(listItem);
    }
}

// Entferne die Datei aus der jeweiligen Liste
function removeFile(file, fileArray) {
    const index = fileArray.indexOf(file);
    if (index !== -1) {
        fileArray.splice(index, 1);
    }
}

// Verhindere das Standardverhalten beim Ziehen und Ablegen
dropArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropArea.classList.add("dragging");
});

// Entferne das visuelle Feedback beim Verlassen des Drag-and-Drop-Bereichs
dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("dragging");
});

// Wenn Dateien abgelegt werden, füge sie der Drop-Dateiliste hinzu
dropArea.addEventListener("drop", (event) => {
    event.preventDefault();
    dropArea.classList.remove("dragging");
    const files = event.dataTransfer.files;
    addFilesToDropList(files); // Füge die Dateien zur Drag-and-Drop-Liste hinzu
    updateFileList(dropFiles, dropFileListElement); // Zeige die Drag-and-Drop-Dateien an
});

// Event-Listener für das Formular
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const allFiles = [...dropFiles, ...manualFiles]; // Kombiniere beide Dateilisten
    if (allFiles.length === 0) {
        alert("Bitte eine oder mehrere Dateien auswählen.");
        return;
    }

    for (const file of allFiles) {
        // Prüfe Dateigröße
        if (file.size > 50 * 1024 * 1024) {
            alert(`Die Datei ${file.name} ist zu groß. Maximal 50 MB erlaubt.`);
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("http://localhost:3000/upload", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Upload erfolgreich: ${file.name}`);
            } else {
                const error = await response.json();
                alert(`Fehler beim Upload der Datei ${file.name}: ${error.message}`);
            }
        } catch (error) {
            console.error(`Upload-Fehler bei der Datei ${file.name}:`, error);
            alert(`Ein Fehler ist aufgetreten beim Upload der Datei ${file.name}.`);
        }
    }

    // Nach dem Upload werden beide Listen zurückgesetzt
    dropFiles = [];
    manualFiles = [];
    updateFileList(dropFiles, dropFileListElement); // Leere die Drag-and-Drop-Dateiliste
    updateFileList(manualFiles, manualFileListElement); // Leere die manuelle Dateiliste
});

// Funktion, um neue Dateien zur Drag-and-Drop-Liste hinzuzufügen
function addFilesToDropList(newFiles) {
    dropFiles = [...dropFiles, ...Array.from(newFiles)];
}

// Funktion, um neue Dateien zur manuellen Auswahl hinzuzufügen
fileInput.addEventListener("change", () => {
    const files = fileInput.files;
    manualFiles = [...manualFiles, ...Array.from(files)];
    updateFileList(manualFiles, manualFileListElement); // Zeige die manuellen Dateien an
});

// Stelle sicher, dass das Klicken auf den Drop-Bereich das Datei-Auswahlfeld öffnet
dropArea.addEventListener("click", () => {
    fileInput.click(); // Öffnet das Dateiauswahlfeld
});
