const CLIENT_ID = "448628978608-8taeksfsvhtjhrge7pbge6sc0gj7mb4e.apps.googleusercontent.com"; // Replace with your Google Client ID
const PICKER_API_KEY = "AIzaSyCKvK30z0OWcsJdHG41QT8qE3oWVmIgtH8"; // Replace with your Google API Key
const SCOPES = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive";

let pickerApiLoaded = false;
let oauthToken;
let tokenClient;

gapi.load("picker", () => {
    console.log("Google Picker API loaded successfully.");
    pickerApiLoaded = true;
});

window.onload = () => {
    console.log("Initializing Token Client...");
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
            console.log("OAuth Token received:", tokenResponse);
            oauthToken = tokenResponse.access_token;
            createPicker();
        },
    });
};

document.getElementById("selectFromGoogleDrive").addEventListener("click", () => {
    console.log("Select button clicked. Requesting access token...");
    tokenClient.requestAccessToken();
});

function createPicker() {
    if (pickerApiLoaded && oauthToken) {
        console.log("Creating Google Picker with OAuth Token...");
        
        const picker = new google.picker.PickerBuilder()
            .addView(google.picker.ViewId.DOCS)
            .setOAuthToken(oauthToken)
            .setDeveloperKey(PICKER_API_KEY)
            .setOrigin(window.location.origin)
            .setCallback(pickerCallback)
            .build();
        picker.setVisible(true);
    } else {
        console.error("Google Picker API is not ready.");
        showToast("Google Picker API is not ready.", "error");
    }
}

function pickerCallback(data) {
    console.log("Picker Callback triggered. Data received:", data);
    if (data.action === google.picker.Action.PICKED) {
        const fileId = data.docs[0].id;
        const fileName = data.docs[0].name;
        console.log(`File selected. ID: ${fileId}, Name: ${fileName}`);
        showToast(`Selected file: ${fileName}`);
        downloadFile(fileId, fileName);
    } else if (data.action === google.picker.Action.CANCEL) {
        console.log("Picker action canceled.");
        showToast("File selection canceled.");
    }
}

async function downloadFile(fileId, fileName) {
    // Remove any trailing period from the file ID
    const cleanFileId = fileId.replace(/\.$/, '');

    const url = `https://www.googleapis.com/drive/v3/files/${cleanFileId}?alt=media&key=${PICKER_API_KEY}`;
    const headers = new Headers({ Authorization: `Bearer ${oauthToken}` });

    console.log(`Initiating download for file: ${fileName} $fileId: ${cleanFileId}`);
    console.log("Download URL:", url);
    console.log("Request Headers:", headers);

    try {
        const response = await fetch(url, { headers });
        console.log("Download API Response:", response);

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        console.log("File downloaded successfully.");

        const blob = await response.blob();
        console.log("Downloaded Blob:", blob);

        // Upload the file to your backend
        const formData = new FormData();
        console.log(new File([blob], fileName));  // Check the file object before appending to FormData
        formData.append("file", new File([blob], fileName));
        console.log("Prepared FormData for upload:", formData);

        await uploadFileToServer(formData, fileName);
    } catch (error) {
        console.error("Error downloading file:", error);
        showToast("Error downloading file.", "error");
    }
}


async function uploadFileToServer(formData, fileName) {
    console.log(`Starting upload for file: ${fileName}`);
    console.log("Upload URL: http://localhost:3000/upload");
    console.log("FormData Content:", formData);

    try {
        const response = await fetch("http://localhost:3000/upload", {
            method: "POST",
            body: formData,
        });
        console.log("Upload API Response:", response);

        if (response.ok) {
            console.log(`File uploaded successfully: ${fileName}`);
            showToast(`Upload successful: ${fileName}`);
        } else {
            console.error(`Error uploading file: ${response.statusText}`);
            showToast(`Error uploading ${fileName}`, "error");
        }
    } catch (error) {
        console.error(`Error uploading file: ${error}`);
        showToast(`Error uploading ${fileName}`, "error");
    }
}

function showToast(message, type = "success") {
    console.log(`Toast Notification: ${message}, Type: ${type}`);
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}