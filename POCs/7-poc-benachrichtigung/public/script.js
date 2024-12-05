document.addEventListener("DOMContentLoaded", () => {
    // Datei-Upload-Formular handling
    const uploadForm = document.getElementById("upload-form");
    const fileInput = document.getElementById("fileInput");
    
    uploadForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const files = fileInput.files;
        if (!files.length) {
            alert("Bitte eine oder mehrere Dateien auswählen.");
            return;
        }

        for (const file of files) {
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
                    alert(`Upload erfolgreich: ${file.name}`);
                } else {
                    const error = await response.json();
                    alert(`Fehler beim Upload: ${error.message}`);
                }
            } catch (error) {
                alert("Ein Fehler ist aufgetreten.");
            }
        }
    });

    // E-Mail Icon Click
    const emailIcon = document.getElementById("email-icon");
    const emailHover = document.getElementById("email-hover");

    emailIcon.addEventListener("click", () => {
        if (emailHover.classList.contains("hidden")) {
            emailHover.classList.remove("hidden");
            emailHover.classList.add("visible");
        } else {
            emailHover.classList.remove("visible");
            emailHover.classList.add("hidden");
        }
    });

    // E-Mail Formular Handling
    const emailForm = document.getElementById("email-form");

    if (emailForm) {
        emailForm.addEventListener("submit", async (event) => {
            event.preventDefault();
    
            const email = document.getElementById("email").value;
    
            if (!email) {
                alert("Bitte eine gültige E-Mail-Adresse eingeben.");
                return;
            }
    
            try {
                const response = await fetch("http://localhost:3000/api/email/send-email", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        from: { email: "trial-351ndgw0v8q4zqx8.mlsender.net", name: "Uploader" },
                        to: [{ email: email, name: "Nutzer" }],
                        subject: "Ihr Download-Link",
                        text: "Hier ist Ihr Download-Link: https://example.com/download",
                    }),
                });
    
                if (response.ok) {
                    alert("E-Mail erfolgreich gesendet!");
                } else {
                    const error = await response.json();
                    alert(`Fehler beim Senden: ${error.message}`);
                }
            } catch (error) {
                alert("Es ist ein Fehler aufgetreten.");
            }
        });
    } else {
        console.error("Das Element mit der ID 'email-form' wurde nicht gefunden.");
    }
});