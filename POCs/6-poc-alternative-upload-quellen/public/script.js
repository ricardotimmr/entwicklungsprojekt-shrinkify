const form = document.querySelector("form");
const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");
const uploadStatus = document.getElementById("uploadStatus");
const toastContainer = document.getElementById("toastContainer");
const redirectUri = "http://localhost:3000"; // Muss mit registrierten Redirect-URIs übereinstimmen

// Funktion für Toast-Benachrichtigungen
function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Toast automatisch entfernen
    setTimeout(() => {
        toast.remove();
    }, 2000); // 2 Sekunden
}

// Zeigt die ausgewählten Dateien in der Liste an
function updateFileList() {
    const files = fileInput.files;
    fileList.innerHTML = ""; // Reset der Liste

    Array.from(files).forEach((file, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="remove-btn" data-index="${index}">X</span>
        `;
        fileList.appendChild(li);

        // Event-Listener für das Entfernen der Datei
        li.querySelector(".remove-btn").addEventListener("click", () => removeFile(index));
    });
}

// Entfernt eine Datei aus der Liste
function removeFile(index) {
    const dt = new DataTransfer();
    const files = fileInput.files;

    Array.from(files).forEach((file, i) => {
        if (i !== index) {
            dt.items.add(file);
        }
    });

    fileInput.files = dt.files;
    updateFileList();
}

fileInput.addEventListener("change", updateFileList);

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const files = fileInput.files;
    if (!files.length) {
        showToast("Bitte eine oder mehrere Dateien auswählen.", "error");
        return;
    }

    fileList.style.display = "none";
    uploadStatus.innerHTML = "";

    for (const file of files) {
        if (file.size > 50 * 1024 * 1024) {
            showToast(`Die Datei ${file.name} ist zu groß. Maximal 50 MB erlaubt.`, "error");
            fileList.style.display = "block";
            return;
        }

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

        try {
            await uploadFile(file, progressBar);
            showToast(`Upload erfolgreich: ${file.name}`);
        } catch {
            showToast(`Fehler beim Upload der Datei: ${file.name}`, "error");
        }
    }

    fileList.style.display = "block";
    fileInput.value = "";
    updateFileList();
});

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
                reject();
            }
        };

        xhr.onerror = () => {
            reject();
        };

        const formData = new FormData();
        formData.append("file", file);
        xhr.send(formData);
    });
}