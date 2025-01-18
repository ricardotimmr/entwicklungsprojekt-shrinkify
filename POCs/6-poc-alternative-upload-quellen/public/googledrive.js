const CLIENT_ID = "448628978608-8taeksfsvhtjhrge7pbge6sc0gj7mb4e.apps.googleusercontent.com";
const PICKER_API_KEY = "AIzaSyCKvK30z0OWcsJdHG41QT8qE3oWVmIgtH8";
const SCOPES = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive";

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
        uploadFromGoogleDrive(fileId);
    } else if (data.action === google.picker.Action.CANCEL) {
        console.log("Picker action canceled.");
        showToast("File selection canceled.");
    }
}

// Function to download the file from Google Drive and upload it to your server
async function uploadFromGoogleDrive(fileId) {
    const accessToken = oauthToken;

    try {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (response.ok) {
            const blob = await response.blob();
            const fileExtension = getFileExtensionFromMimeType(response.headers.get("Content-Type"));

            // Generate the correct filename with extension
            const fileName = `${fileExtension}`;
            
            const formData = new FormData();
            formData.append('file', blob, fileName);

            // Send the file to your server
            const uploadResponse = await fetch('http://localhost:3000/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await uploadResponse.json();
            if (result.message === 'File uploaded successfully.') {
                showToast(`Upload successful: ${result.file.originalName}`);
            } else {
                showToast('Error uploading the file.', 'error');
            }
        } else {
            showToast('Error fetching the file from Google Drive.', 'error');
        }
    } catch (error) {
        showToast('Error during the upload process.', 'error');
    }
}

// Function to determine file extension from MIME type
function getFileExtensionFromMimeType(mimeType) {
    switch (mimeType) {
        case 'image/png': return '.png';
        case 'image/jpg':
        case 'image/jpeg': return '.jpg';
        case 'image/gif': return '.gif';
        case 'application/pdf': return '.pdf';
        case 'text/plain': return '.txt';
        // Add more MIME types as needed
        default: return '';
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