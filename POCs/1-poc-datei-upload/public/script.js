// Element-Referenzen
const form = document.querySelector("form");
const fileInput = document.getElementById("fileInput");

// Event-Listener für das Formular
form.addEventListener("submit", async (event) => {
    event.preventDefault(); // Verhindert das Neuladen der Seite
    
    const file = fileInput.files[0];
    if (!file) {
        alert("Bitte eine Datei auswählen.");
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
            alert("Upload erfolgreich: " + result.message);
        } else {
            alert("Fehler beim Upload.");
        }
    } catch (error) {
        console.error("Upload-Fehler:", error);
        alert("Ein Fehler ist aufgetreten.");
    }
});
