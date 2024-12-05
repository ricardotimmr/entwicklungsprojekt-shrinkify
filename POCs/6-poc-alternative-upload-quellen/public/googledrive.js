const googleClientId = "448628978608-8taeksfsvhtjhrge7pbge6sc0gj7mb4e.apps.googleusercontent.com"; // Deine Google Client-ID
const googleScopes = "https://www.googleapis.com/auth/drive.readonly";

let gapiInitialized = false; // Um sicherzustellen, dass gapi nur einmal initialisiert wird

// Google API-Client initialisieren
function initializeGoogleAPI() {
    if (gapiInitialized) {
        console.log("gapi bereits initialisiert.");
        return;
    }
    
    console.log("Lade Google API...");
    gapi.load('client:auth2', initClient);
    gapiInitialized = true;
}

// Google API-Client initialisieren
function initClient() {
    console.log("Google API Client wird initialisiert...");
    gapi.auth2.init({
        client_id: googleClientId,
    }).then(() => {
        console.log("Google API Client initialisiert.");
        document.getElementById("selectFromGoogleDrive").addEventListener("click", openPicker);
    }).catch(error => {
        console.error("Fehler bei der Initialisierung des Google API Clients:", error);
    });
}

// Picker öffnen
function openPicker() {
    console.log("Versuche, den Google Picker zu öffnen...");
    
    const authInstance = gapi.auth2.getAuthInstance();
    const token = authInstance.currentUser.get().getAuthResponse().access_token;
    
    if (!token) {
        console.error("Kein Token vorhanden. Bitte melden Sie sich an.");
        showToast("Bitte melden Sie sich an, um auf Google Drive zuzugreifen.", "error");
        return;
    }

    console.log("Token gefunden. Öffne den Picker...");
    const picker = new google.picker.PickerBuilder()
        .addView(new google.picker.View(google.picker.ViewId.DOCS))
        .setOAuthToken(token)
        .setDeveloperKey("DEIN_GOOGLE_API_KEY") // Dein Google API Key hier
        .setCallback(pickerCallback)
        .build();
    picker.setVisible(true);
}

// Callback, wenn eine Datei ausgewählt wurde
function pickerCallback(data) {
    console.log("Picker Callback aufgerufen...");
    
    if (data.action === google.picker.Action.PICKED) {
        const fileId = data.docs[0].id;
        console.log(`Datei ausgewählt: ${fileId}`);
        downloadFile(fileId);
    } else {
        console.log("Keine Datei ausgewählt.");
    }
}

// Datei von Google Drive herunterladen
function downloadFile(fileId) {
    console.log(`Lade Datei mit ID ${fileId} herunter...`);
    
    const authInstance = gapi.auth2.getAuthInstance();
    const token = authInstance.currentUser.get().getAuthResponse().access_token;

    if (!token) {
        console.error("Kein Token vorhanden. Bitte anmelden.");
        showToast("Kein Token gefunden. Bitte anmelden.", "error");
        return;
    }

    fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Fehler beim Herunterladen der Datei.");
            }
            return response.blob();
        })
        .then((blob) => {
            console.log("Datei erfolgreich heruntergeladen.");
            showToast("Datei erfolgreich heruntergeladen.");
            uploadFile(blob, "google-drive-file"); // Zeigt ein Beispiel, wie man die Datei weiterverarbeitet
        })
        .catch((error) => {
            console.error("Fehler beim Herunterladen der Datei:", error);
            showToast("Fehler beim Herunterladen der Datei.", "error");
        });
}

// Datei an den Server hochladen
function uploadFile(file, fileName) {
    console.log(`Hochladen der Datei: ${fileName}`);
    
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:3000/upload");

    xhr.onload = () => {
        if (xhr.status === 200) {
            console.log(`Upload erfolgreich: ${fileName}`);
            showToast(`Upload erfolgreich: ${fileName}`);
        } else {
            console.error(`Fehler beim Upload der Datei: ${fileName}`);
            showToast(`Fehler beim Upload der Datei: ${fileName}`, "error");
        }
    };

    xhr.onerror = () => {
        console.error(`Fehler beim Upload der Datei: ${fileName}`);
        showToast(`Fehler beim Upload der Datei: ${fileName}`, "error");
    };

    const formData = new FormData();
    formData.append("file", file, fileName);
    xhr.send(formData);
}

// Funktion für Toast-Benachrichtigungen
function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    const toastContainer = document.getElementById("toastContainer");
    toastContainer.appendChild(toast);

    // Toast automatisch entfernen
    setTimeout(() => {
        toast.remove();
    }, 2000); // 2 Sekunden
}

// Initialisierung der Google API
initializeGoogleAPI();