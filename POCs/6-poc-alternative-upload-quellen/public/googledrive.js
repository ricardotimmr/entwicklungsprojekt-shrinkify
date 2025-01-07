const CLIENT_ID = "448628978608-8taeksfsvhtjhrge7pbge6sc0gj7mb4e.apps.googleusercontent.com"; // Replace with your Google Client ID
const API_KEY = "AIzaSyCKvK30z0OWcsJdHG41QT8qE3oWVmIgtH8"; // Replace with your Google API Key
const SCOPES = "https://www.googleapis.com/auth/drive.readonly";
let pickerApiLoaded = false;
let oauthToken;
let tokenClient;

gapi.load("picker", () => {
    console.log("Google Picker API loaded.");
    pickerApiLoaded = true;
});

window.onload = () => {
    console.log("Initializing Token Client...");
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
            console.log("Token received:", tokenResponse);
            oauthToken = tokenResponse.access_token;
            createPicker(); // Proceed to Google Picker once authenticated
        },
    });
};

document.getElementById("selectFromGoogleDrive").addEventListener("click", () => {
    console.log("Select button clicked. Requesting access token...");
    tokenClient.requestAccessToken();
});

// Create the Google Picker
function createPicker() {
    if (pickerApiLoaded && oauthToken) {
        console.log("Creating Google Picker...");
        const picker = new google.picker.PickerBuilder()
            .addView(google.picker.ViewId.DOCS)
            .setOAuthToken(oauthToken)
            .setDeveloperKey(API_KEY)
            .setCallback(pickerCallback)
            .build();
        picker.setVisible(true);
    } else {
        console.error("Google Picker is not ready yet.");
        showToast("Google Picker is not ready yet.", "error");
    }
}

// Handle file selection
function pickerCallback(data) {
    console.log("Picker callback data:", data);
    if (data.action === google.picker.Action.PICKED) {
        const fileId = data.docs[0].id;
        const fileName = data.docs[0].name;
        console.log(`File selected: ID=${fileId}, Name=${fileName}`);
        showToast(`Selected file: ${fileName}`);
        downloadFile(fileId, fileName);
    } else if (data.action === google.picker.Action.CANCEL) {
        console.log("File selection canceled.");
        showToast("File selection canceled.");
    }
}

// Download file from Google Drive
async function downloadFile(fileId, fileName) {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const headers = new Headers({ Authorization: `Bearer ${oauthToken}` });

    console.log(`Downloading file: ${fileName} from URL: ${url}`);
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        console.log("File downloaded successfully.");

        const blob = await response.blob();

        // Upload the file to your backend
        const formData = new FormData();
        formData.append("file", new File([blob], fileName));
        console.log("Uploading file to the server...");
        await uploadFileToServer(formData, fileName);
    } catch (error) {
        console.error("Error downloading file:", error);
        showToast("Error downloading file.", "error");
    }
}

// Upload the file to your backend
async function uploadFileToServer(formData, fileName) {
    try {
        const response = await fetch("http://localhost:3000/upload", {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            console.log(`File uploaded successfully: ${fileName}`);
            showToast(`Upload successful: ${fileName}`);
        } else {
            console.error(`Error uploading ${fileName}:`, response.statusText);
            showToast(`Error uploading ${fileName}`, "error");
        }
    } catch (error) {
        console.error(`Error uploading ${fileName}:`, error);
        showToast(`Error uploading ${fileName}`, "error");
    }
}

// Show toast notifications
function showToast(message, type = "success") {
    console.log(`Toast message: ${message}, Type: ${type}`);
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}