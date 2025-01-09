// Element-Referenzen
const form = document.querySelector("form");
const fileInput = document.getElementById("fileInput");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const files = fileInput.files;
    if (!files.length) {
        alert("Bitte eine oder mehrere Dateien auswählen.");
        return;
    }

    for (const file of files) {
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
});
