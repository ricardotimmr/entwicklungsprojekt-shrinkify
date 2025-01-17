document.addEventListener("DOMContentLoaded", function () {
    const dropdownBtn = document.querySelector(".dropdown-btn");
    const dropdownContent = document.querySelector(".dropdown-content");
    const fileInput = document.getElementById("fileInput");
    const browseButton = document.getElementById("browseButton");
    const uploadStatus = document.getElementById("uploadStatus");
    const toastContainer = document.getElementById("toastContainer");

    // Dropdown-Menü anzeigen/verbergen
    if (dropdownBtn && dropdownContent) { 
        dropdownBtn.addEventListener("click", function () {
            dropdownContent.classList.toggle("show");
        });

        document.addEventListener("click", function (event) {
            if (!dropdownBtn.contains(event.target) && !dropdownContent.contains(event.target)) {
                dropdownContent.classList.remove("show");
            }
        });
    } else {
        console.error("Dropdown-Elemente wurden nicht gefunden!");
    }

    // 📤 Datei-Auswahl per Klick öffnen
    browseButton.addEventListener("click", function () {
        fileInput.click();
    });

    // 🎯 Starte Upload automatisch nach Auswahl der Dateien
    fileInput.addEventListener("change", async function () {
        const files = fileInput.files;
        if (!files.length) {
            showToast("Bitte eine oder mehrere Dateien auswählen.", "error");
            return;
        }

        uploadStatus.innerHTML = ""; // Reset Statusanzeige

        for (const file of files) {
            if (file.size > 50 * 1024 * 1024) {
                showToast(`Die Datei ${file.name} ist zu groß. Maximal 50 MB erlaubt.`, "error");
                return;
            }

            // Fortschrittsanzeige erstellen
            const progressContainer = document.createElement("div");
            progressContainer.className = "file-progress";
            progressContainer.innerHTML = `
                <div class="file-name">${file.name}</div>
                <div class="progress-container">
                    <div class="progress-bar"></div>
                </div>
            `;
            uploadStatus.appendChild(progressContainer);

            const progressBar = progressContainer.querySelector(".progress-bar");

            // Datei hochladen mit Fortschrittsanzeige
            try {
                await uploadFile(file, progressBar);
                showToast(`Upload erfolgreich: ${file.name}`);
            } catch (error) {
                showToast(`Fehler beim Upload der Datei: ${file.name}`, "error");
                console.error("Fehler beim Upload:", error);
            }
        }
    });

    // 📤 Datei-Upload-Funktion mit Fortschrittsanzeige
    function uploadFile(file, progressBar) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "http://localhost:3000/upload");

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    progressBar.style.width = `${percentComplete}%`;
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    resolve();
                } else {
                    console.error('Server-Antwort: ', xhr.responseText);
                    reject(new Error(`Fehler beim Upload: ${xhr.statusText}`));
                }
            };

            xhr.onerror = () => {
                reject(new Error("Netzwerkfehler beim Hochladen der Datei"));
            };

            const formData = new FormData();
            formData.append("file", file);
            xhr.send(formData);
        });
    }

    // 🔔 Toast-Benachrichtigungen anzeigen
    function showToast(message, type = "success") {
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 2000); // 2 Sekunden
    }
});
