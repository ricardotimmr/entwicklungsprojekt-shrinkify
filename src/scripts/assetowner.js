document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("fileInput");
  const browseButton = document.getElementById("browseButton");
  const toastContainer = document.getElementById("toastContainer");
  const fileListToday = document.getElementById("file-list-today");
  const fileListOld = document.getElementById("file-list-old");
  const startUploadButton = document.getElementById("start-upload");

  let filesToUpload = [];
  let cardId = null;

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  if (!token) {
    alert("Ungültiger Zugriff. Kein Token gefunden.");
    return;
  }

  // Token an den Server zur Validierung senden
  fetch(`/validate-token?token=${token}`)
    .then((response) => response.json())
    .then((data) => {
      if (!data.valid) {
        alert("Ungültiger oder abgelaufener Link.");
        window.location.href = "/";
      } else {
        console.log("Token ist gültig. Daten:", data);
        cardId = data.data.cardId;
        console.log("Extrahierte Karten-ID:", cardId);
        loadImages(cardId);
      }
    })
    .catch((err) => {
      console.error("Fehler bei der Token-Validierung:", err);
      alert("Fehler bei der Token-Überprüfung.");
    });

  // Lade Bilder aus der Datenbank und zeige sie in der Liste an
  function loadImages(cardId) {
    fetch(`http://localhost:3000/images/${cardId}`)
      .then((response) => response.json())
      .then((images) => {
        fileListToday.innerHTML = "";

        images.forEach((image) => {
          const fileName = image.file_path.split("/").pop();
          console.log("File name:", fileName);

          const timestamp = new Date(image.uploaded_at);
          const day = timestamp.getDate().toString().padStart(2, "0");
          const month = (timestamp.getMonth() + 1).toString().padStart(2, "0"); // Fix month offset
          const year = timestamp.getFullYear();
          const formattedTime = `${day}.${month}.${year}`;

          const listItem = document.createElement("li");
          listItem.className = "file-item";
          listItem.innerHTML = `
            <div class="file-info">
              <img class="prev-pic" src="${image.file_path}" alt="preview">
              <p class="filename">${fileName}</p>
            </div>
            <p class="timestamp">${formattedTime}</p>
            <div class="file-actions">
              <span class="icon close hidden">close</span>
              <span class="icon delete">delete</span>
              <span class="icon download">download</span>
            </div>
            <div class="file-progress hidden">
              <div class="progress-container">
                <div class="progress-bar"></div>
              </div>
            </div>
          `;
          fileListOld.appendChild(listItem);

          // Delete button
          const deleteIcon = listItem.querySelector(".icon.delete");
          if (deleteIcon) {
            deleteIcon.addEventListener("click", async () => {
              try {
                const response = await fetch("http://localhost:3000/delete", {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    filename: image.file_path.replace("/compressed/", ""),
                  }),
                });

                if (response.ok) {
                  listItem.remove();
                  console.log(
                    "Datei aus der Liste und der Datenbank gelöscht."
                  );
                } else {
                  console.error("Fehler beim Löschen der Datei.");
                }
              } catch (error) {
                console.error("Fehler beim Löschen der Datei:", error);
              }
            });
          }

          // Download button
          const downloadIcon = listItem.querySelector(".icon.download");
          if (downloadIcon) {
            downloadIcon.addEventListener("click", () => {
              console.log("Download angefordert für:", image.file_path);
              const a = document.createElement("a");
              a.href = image.file_path;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            });
          }
        });
      })
      .catch((error) =>
        console.error("Fehler beim Abrufen der Bilder:", error)
      );
  }

  browseButton.addEventListener("click", function () {
    fileInput.click();
  });

  // Starte Upload automatisch nach Auswahl der Dateien
  fileInput.addEventListener("change", async function () {
    const files = fileInput.files;
    if (!files.length) {
      console.error("Bitte eine oder mehrere Dateien auswählen.");
      return;
    }

    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        console.error(
          `Die Datei ${file.name} ist zu groß. Maximal 50 MB erlaubt.`
        );
        return;
      }

      filesToUpload.push(file);

      const progressContainer = document.createElement("li");
      progressContainer.className = "file-item";
      progressContainer.innerHTML = `
        <div class="file-info">
          <img class="prev-pic" alt="preview">
          <p class="filename">${file.name}</p>
        </div>
        <p class="timestamp">Ausstehend</p>
        <div class="file-actions">
          <span class="icon close">close</span>
          <span class="icon delete inactive">delete</span>
          <span class="icon download inactive">download</span>
        </div>
        <div class="file-progress">
          <div class="progress-container">
            <div class="progress-bar"></div>
          </div>
        </div>
      `;

      fileListToday.appendChild(progressContainer);

      // Close icon functionality
      const closeIcon = progressContainer.querySelector(".icon.close");
      if (closeIcon) {
        closeIcon.addEventListener("click", () => {
          filesToUpload = filesToUpload.filter((f) => f !== file);
          progressContainer.remove();
          console.log(`Die Datei ${file.name} wurde entfernt.`);
        });
      }
    }
  });

  startUploadButton.addEventListener("click", async () => {
    if (!cardId) {
      console.error("Keine cardId gefunden. Upload abgebrochen.");
      return;
    }

    for (const file of filesToUpload) {
      const progressContainer = Array.from(
        document.querySelectorAll(".file-item")
      ).find(
        (item) => item.querySelector(".filename").textContent === file.name
      );

      if (!progressContainer) {
        console.error(`No progressContainer found for file ${file.name}`);
        continue;
      }

      const progressBar = progressContainer.querySelector(".progress-bar");

      try {
        await uploadFile(file, cardId, progressBar, progressContainer);
        updateFileStatus(file.name, "Upload erfolgreich");
      } catch (error) {
        updateFileStatus(file.name, "Upload fehlgeschlagen", true);
      }
    }
  });

  // Download-Button für die geladenen Bilder aktivieren
  const downloadAllButton = document.querySelector(".download-all");
  if (!downloadAllButton) {
    console.error("Element mit der Klasse .download-all nicht gefunden");
  } else {
    downloadAllButton.addEventListener("click", () => {
      console.log("Download für aktuelle Bilder angefordert");

      // Konvertiere FileList in ein Array
      const filesArray = Array.from(fileInput.files);

      if (!filesArray || filesArray.length === 0) {
        console.error("Keine Dateien zum Herunterladen gefunden");
        return;
      }

      filesArray.forEach((file) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(file);
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    });
  }

  // Datei hochladen mit Fortschrittsanzeige
  function uploadFile(file, cardId, progressBar, progressContainer) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "http://localhost:3000/upload");

      // Progress Event Listener
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          progressContainer.querySelector(".timestamp").textContent =
            "Datei wird geladen...";
          const percentComplete = (event.loaded / event.total) * 100;
          progressBar.style.width = `${percentComplete}%`;

          if (percentComplete === 100) {
            setTimeout(() => {
              const timestamp = new Date();
              const hours = timestamp.getHours().toString().padStart(2, "0");
              const minutes = timestamp
                .getMinutes()
                .toString()
                .padStart(2, "0");
              const formattedTime = `${hours}:${minutes}`;

              progressContainer.querySelector(".timestamp").textContent =
                formattedTime;
              progressContainer.querySelector(
                ".progress-container"
              ).style.display = "none";

              const closeIcon = progressContainer.querySelector(".icon.close");
              if (closeIcon) closeIcon.style.display = "none";

              const deleteIcon =
                progressContainer.querySelector(".icon.delete");
              const downloadIcon =
                progressContainer.querySelector(".icon.download");
              if (deleteIcon && downloadIcon) {
                deleteIcon.classList.remove("inactive");
                downloadIcon.classList.remove("inactive");
              }
            }, 500);
          }
        }
      };

      // Upload Completed
      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          console.log("Serverantwort erhalten:", response);

          if (!response.compressed || !response.compressed.path) {
            console.error(
              "Fehler: Der komprimierte Pfad fehlt in der Serverantwort!"
            );
            return;
          }

          console.log("Erhaltener Bildpfad:", response.compressed.path);

          // Set Image Preview
          const previewImg = progressContainer.querySelector(".prev-pic");
          previewImg.src = response.compressed.path;
          console.log("Vorschau-Bild gesetzt auf:", previewImg.src);

          // Download Icon Functionality
          const downloadIcon =
            progressContainer.querySelector(".icon.download");
          if (downloadIcon) {
            downloadIcon.addEventListener("click", () => {
              const a = document.createElement("a");
              a.href = response.compressed.path;
              a.download = file.name.replace(/\.[^/.]+$/, ".jpeg");
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            });
          }

          // Delete Icon Functionality
          const deleteIcon = progressContainer.querySelector(".icon.delete");
          if (deleteIcon) {
            deleteIcon.addEventListener("click", async () => {
              try {
                // Use the compressed.path and strip '/compressed/'
                const filePath = response.compressed.path.replace(
                  "/compressed/",
                  ""
                );

                console.log("Attempting to delete:", filePath); // Debugging path

                const deleteResponse = await fetch(
                  "http://localhost:3000/delete",
                  {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ filename: filePath }),
                  }
                );

                const result = await deleteResponse.json();

                if (deleteResponse.ok) {
                  console.log("✅ Datei erfolgreich gelöscht:", file.name);
                  progressContainer.remove();
                } else {
                  console.error("❌ Fehler beim Löschen:", result.message);
                }
              } catch (error) {
                console.error(
                  "❌ Fehler beim Serveraufruf während Löschvorgang:",
                  error
                );
              }
            });
          }

          resolve();
        } else {
          console.error("Fehler in der Server-Antwort:", xhr.responseText);
          reject(new Error(`Fehler beim Upload: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        console.error("Netzwerkfehler beim Hochladen der Datei");
        reject(new Error("Netzwerkfehler beim Hochladen der Datei"));
      };

      // Prepare FormData with file and cardId
      const formData = new FormData();
      formData.append("file", file);
      formData.append("cardId", cardId);

      // Start the upload
      xhr.send(formData);
    });
  }

  // Update-Status für die Datei (zeigen, ob sie erfolgreich hochgeladen wurde oder nicht)
  function updateFileStatus(fileName, status, isError = false) {
    // Datei aus der "Heute"-Liste aktualisieren
    const items = document.querySelectorAll(".file-item");
    items.forEach((item) => {
      const fileNameElement = item.querySelector(".filename");
      if (fileNameElement && fileNameElement.textContent === fileName) {
        const timestamp = item.querySelector(".timestamp");
        timestamp.textContent = status;
        const progressBar = item.querySelector(".progress-bar");
        if (isError) {
          progressBar.style.backgroundColor = "#f8d7da"; // rot für Fehler
        }
      }
    });
  }

  // Toast-Benachrichtigungen anzeigen
  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 2000); // 2 Sekunden
  }
});
