// Element-Referenzen
const form = document.querySelector("form");
const fileInput = document.getElementById("fileInput");
const formatSelect = document.getElementById("format");
const resultsContainer = document.getElementById("results");

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    resultsContainer.innerHTML = ""; // Vorherige Ergebnisse leeren

    const files = fileInput.files;
    if (!files.length) {
        alert("Bitte eine oder mehrere Dateien auswählen.");
        return;
    }

    const format = formatSelect.value; // Das gewünschte Ausgabeformat
    const formData = new FormData();

    // Dateien prüfen und zum FormData hinzufügen
    for (const file of files) {
        if (file.size > 50 * 1024 * 1024) {
            alert(`Die Datei ${file.name} ist zu groß. Maximal 50 MB erlaubt.`);
            return;
        }
        formData.append("file", file);
    }

    try {
        const response = await fetch(
            `http://localhost:3000/upload?format=${format}`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (response.ok) {
            const result = await response.json();
            console.log("Server-Antwort:", result); // Debugging

            // Nur ein komprimiertes Objekt, also kein Array erwartet
            const file = result.compressed;

            if (file && file.name) {
                const link = document.createElement("a");
                link.href = `http://localhost:3000${file.path}`; // Korrekte URL zum komprimierten Bild
                link.download = file.name; // Dateiname beibehalten

                // Vorschau-Bild erstellen
                const img = document.createElement("img");
                img.src = `http://localhost:3000${file.path}`; // Bildquelle mit korrektem Pfad
                img.alt = file.name;
                img.style.maxWidth = "200px";
                img.style.margin = "10px";

                link.appendChild(img);
                resultsContainer.appendChild(link);
            } else {
                alert("Keine komprimierte Datei erhalten.");
            }
        } else {
            const error = await response.json();
            console.error("Fehler-Antwort vom Server:", error);
            alert(`Fehler beim Upload: ${error.message}`);
        }
    } catch (error) {
        console.error("Fehler beim Upload:", error);
        alert("Ein unerwarteter Fehler ist aufgetreten.");
    }
});
