document.getElementById("selectFromDropBox").addEventListener("click", () => {
    Dropbox.choose({
        success: async function (files) {
            if (!files.length) {
                showToast("Keine Datei ausgewählt.", "error");
                return;
            }

            const fileUrl = files[0].link;
            showToast(`Dropbox-Datei ausgewählt: ${files[0].name}`);

            try {
                // Fetch and upload the file using the existing upload-url API
                const response = await fetch("http://myapp.local:3000/upload-url", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ fileUrl }),
                });

                const result = await response.json();
                if (response.ok) {
                    showToast(`Upload erfolgreich: ${files[0].name}`);
                } else {
                    showToast(`Fehler: ${result.message}`, "error");
                }
            } catch (error) {
                showToast(`Fehler beim Upload der Datei.`, "error");
            }
        },
        cancel: function () {
            showToast("Auswahl abgebrochen.", "error");
        },
        linkType: "direct",
        multiselect: false,
        extensions: [".png", ".jpg", ".jpeg"],
    });
});