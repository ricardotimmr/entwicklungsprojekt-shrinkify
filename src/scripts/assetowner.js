document.addEventListener("DOMContentLoaded", function () {
    const dropdownBtn = document.querySelector(".dropdown-btn");
    const dropdownContent = document.querySelector(".dropdown-content");
    const fileInput = document.getElementById("fileInput");
    const browseButton = document.getElementById("browseButton");
    const toastContainer = document.getElementById("toastContainer");
    const fileListToday = document.getElementById("file-list-today");
    const waitingList = document.getElementById("waiting-list");

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
    }

    // Datei-Auswahl per Klick öffnen
    browseButton.addEventListener("click", function () {
        fileInput.click();
    });

    // Starte Upload automatisch nach Auswahl der Dateien
    fileInput.addEventListener("change", async function () {
        const files = fileInput.files;
        if (!files.length) {
            showToast("Bitte eine oder mehrere Dateien auswählen.", "error");
            return;
        }

        // Für jede Datei, die hochgeladen wird
        for (const file of files) {
            if (file.size > 50 * 1024 * 1024) {
                showToast(`Die Datei ${file.name} ist zu groß. Maximal 50 MB erlaubt.`, "error");
                return;
            }

            // Warteschlangen-Datei hinzufügen
            addFileToQueue(file);

            // Datei in "Heute"-Liste hinzufügen
            const progressContainer = document.createElement("li");
            progressContainer.className = "file-item";
            progressContainer.innerHTML = `
                <div class="file-info">
                    <img class="prev-pic" src="../assets/preview.jpg" alt="preview">
                    <p class="filename">${file.name}</p>
                </div>
                <p class="timestamp">Datei wird hochgeladen...</p>
                <div class="file-actions">
                    <span class="icon close">close</span>
                    <span class="icon">delete</span>
                    <span class="icon">download</span>
                </div>
                <div class="file-progress">
                    <div class="progress-container">
                        <div class="progress-bar"></div>
                    </div>
                </div>
            `;
            fileListToday.appendChild(progressContainer);

            const progressBar = progressContainer.querySelector(".progress-bar");

            // Datei hochladen mit Fortschrittsanzeige
            try {
                await uploadFile(file, progressBar, progressContainer);
                updateFileStatus(file.name, "Erfolgreich hochgeladen");
            } catch (error) {
                updateFileStatus(file.name, "Fehler beim Upload", true);
            }
        }
    });

    // Funktion zum Hinzufügen von Dateien zur Warteschlange
    function addFileToQueue(file) {
        const listItem = document.createElement("li");
        listItem.classList.add("dropdown-content");
        listItem.textContent = file.name;
        waitingList.appendChild(listItem);
    }

    // Datei hochladen mit Fortschrittsanzeige
    function uploadFile(file, progressBar, progressContainer) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "http://localhost:3000/upload");
    
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    progressBar.style.width = `${percentComplete}%`;
    
                    // Wenn der Upload abgeschlossen ist (100%), entfernen wir die Statusanzeige
                    if (percentComplete === 100) {
                        setTimeout(() => {
                            // Zeitpunkt des Uploads nur mit Stunden und Minuten anzeigen
                            const timestamp = new Date();
                            const hours = timestamp.getHours().toString().padStart(2, '0'); // Stunden mit führender Null
                            const minutes = timestamp.getMinutes().toString().padStart(2, '0'); // Minuten mit führender Null
    
                            // Formatierter Zeitstempel (HH:mm)
                            const formattedTime = `${hours}:${minutes}`;
    
                            // Zeitstempel setzen
                            progressContainer.querySelector(".timestamp").textContent = formattedTime;
                            progressContainer.querySelector(".progress-container").style.display = 'none'; // Fortschrittsanzeige ausblenden
                        }, 500); // Warten Sie, bis die Fortschrittsanzeige auf 100% steht
                    }
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

    // Update-Status für die Datei (zeigen, ob sie erfolgreich hochgeladen wurde oder nicht)
    function updateFileStatus(fileName, status, isError = false) {
        // Datei aus der "Warteschlange" entfernen
        const waitingItems = document.querySelectorAll(".dropdown-content");
        waitingItems.forEach(item => {
            if (item.textContent === fileName) {
                item.remove();
            }
        });

        // Datei aus der "Heute"-Liste aktualisieren
        const items = document.querySelectorAll(".file-item");
        items.forEach(item => {
            const fileNameElement = item.querySelector(".filename");
            if (fileNameElement && fileNameElement.textContent === fileName) {
                const timestamp = item.querySelector(".timestamp");
                timestamp.textContent = status;
                const progressBar = item.querySelector(".progress-bar");
                if (isError) {
                    progressBar.style.backgroundColor = "#f8d7da"; // rot für Fehler
                }
            }
        });
    }

    // Toast-Benachrichtigungen anzeigen
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
