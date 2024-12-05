// Dropbox Integration
const dropboxAppKey = "";  // App Key
const dropboxAccessToken = "";  // Access Token nach OAuth Flow

document.getElementById("selectFromDropbox").addEventListener("click", () => {
    const dropboxAuthUrl = `https://www.dropbox.com/oauth2/authorize?response_type=token&client_id=${dropboxAppKey}&redirect_uri=${redirectUri}`;
    window.location.href = dropboxAuthUrl; // Nutzer zur Dropbox-Authentifizierung umleiten
});

async function getDropboxFiles(token) {
    try {
        const response = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                path: "",  // Root-Verzeichnis
            }),
        });

        // Überprüfe, ob die Antwort OK ist
        if (!response.ok) {
            const textResponse = await response.text();  // Erhalte die rohe Antwort
            console.error("Fehler-Antwort:", textResponse);  // Fehler ausgeben
            throw new Error(`Fehler beim Abrufen der Dateien: ${textResponse}`);
        }

        const data = await response.json();
        console.log("Dropbox Dateien:", data.entries);  // Liste der Dateien
    } catch (error) {
        console.error("Dropbox Fehler:", error.message);
    }
}


// Token Extraktion nach Redirect
function extractToken() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    return params.get("access_token");
}

window.onload = () => {
    const token = extractToken();
    if (token) {
        getDropboxFiles(token);
    }
};