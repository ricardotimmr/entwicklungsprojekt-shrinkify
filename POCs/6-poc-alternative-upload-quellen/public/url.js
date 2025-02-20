document.getElementById("selectFromURL").addEventListener("click", () => {
    document.getElementById("urlUploadContainer").style.display = "block";
});

document.getElementById("uploadFromUrl").addEventListener("click", async () => {
    const fileUrl = document.getElementById("fileUrlInput").value.trim();
    if (!fileUrl) {
        showToast("Bitte eine gültige URL eingeben.", "error");
        return;
    }

    try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
            throw new Error("Datei konnte nicht heruntergeladen werden.");
        }

        const blob = await response.blob();
        const fileName = fileUrl.split("/").pop().split("?")[0] || "uploaded_file";
        const file = new File([blob], fileName, { type: blob.type });

        // Show progress indicator
        const progressContainer = document.createElement("div");
        progressContainer.className = "file-progress";
        progressContainer.innerHTML = `
            <div class="file-name">${file.name}</div>
            <div class="progress-container">
                <div class="progress-bar"></div>
            </div>
        `;
        uploadStatus.appendChild(progressContainer);
        const progressBar = progressContainer.querySelector(".progress-bar");

        await uploadFile(file, progressBar);
        showToast(`Upload erfolgreich: ${file.name}`);
    } catch (error) {
        showToast(`Fehler beim Hochladen: ${error.message}`, "error");
    }
});