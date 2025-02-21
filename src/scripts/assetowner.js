document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("fileInput");
  const browseButton = document.getElementById("browseButton");
  const toastContainer = document.getElementById("toastContainer");
  const fileListToday = document.getElementById("file-list-today");
  const fileListOld = document.getElementById("file-list-old");
  const startUploadButton = document.getElementById("start-upload");
  const dropArea = document.getElementById("drop-area");

  const dropboxButton = document.getElementById("selectFromDropBox");

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

        const projectName = data.data.projectName || "Projektname";
        const projectTitleElement = document.querySelector(".overview h2");
        if (projectTitleElement) {
          projectTitleElement.textContent = projectName;
        }

        loadImages(cardId);

        // Fetch card details and update settings container
        fetch(`/customers/${data.data.customerId}/cards`)
          .then((response) => response.json())
          .then((cardsData) => {
            const card = cardsData.cards.find((c) => c.id === cardId);
            if (card) {
              updateSettingsContainer(card); // <--- Call here
            }
          })
          .catch((err) =>
            console.error("Fehler beim Abrufen der Kartendaten:", err)
          );
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

  //Event-Listener für Drag & Drop Funktionalität
  dropArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropArea.classList.add("dragover"); // Optische Hervorhebung
  });

  dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("dragover"); // Hervorhebung entfernen
  });

  dropArea.addEventListener("drop", (event) => {
    event.preventDefault();
    dropArea.classList.remove("dragover");

  // Dateien aus Drag & Drop in fileInput setzen
  fileInput.files = event.dataTransfer.files;

  // Manuell das `change`-Event für fileInput auslösen
  fileInput.dispatchEvent(new Event("change"));
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

    // Fetch card settings before starting upload
    const response = await fetch(`/cards/${cardId}`);
    const cardData = await response.json();

    if (!cardData.success) {
      console.error("Fehler beim Abrufen der Karteneinstellungen.");
      return;
    }

    const {
      max_file_size,
      compression_level,
      file_format,
      expiration_date,
      credits,
    } = cardData.card;

    // Convert settings to usable formats
    const maxFileSizeBytes = parseInt(max_file_size) * 1024 * 1024;
    const compressionPercent = parseInt(compression_level);
    const fileFormat = file_format.replace(".", "");

    const today = new Date();
    const expDate = new Date(expiration_date);

    if (today > expDate) {
      alert("Der Link ist abgelaufen und kann nicht verwendet werden.");
      return;
    }

    if (credits <= 0) {
      alert(
        "Keine Credits mehr verfügbar. Bitte wenden Sie sich an den Content Manager."
      );
      return;
    }

    for (const file of filesToUpload) {
      let actualFile = file; // To handle Dropbox files

      if (file.isDropbox) {
        // Handle Dropbox file
        try {
          const dropboxResponse = await fetch(file.fileUrl);
          const blob = await dropboxResponse.blob();
          actualFile = new File([blob], file.fileName, { type: blob.type });

          console.log(`Dropbox-Datei geladen: ${file.fileName}`);
        } catch (error) {
          console.error(
            `Fehler beim Laden der Dropbox-Datei ${file.fileName}:`,
            error
          );
          alert(`Fehler beim Laden der Dropbox-Datei ${file.fileName}`);
          continue;
        }
      }

      if (file.isGoogleDrive) {
        actualFile = file.fileBlob; // Use the File object created from Google Drive blob
        console.log(`Google Drive file loaded: ${file.fileName}`);
      }

      if (actualFile.size > maxFileSizeBytes) {
        alert(
          `Die Datei ${actualFile.name} überschreitet die maximale Dateigröße von ${max_file_size}.`
        );
        continue; // Skip file
      }

      const progressContainer = Array.from(
        document.querySelectorAll(".file-item")
      ).find(
        (item) =>
          item.querySelector(".filename").textContent === file.fileName ||
          file.name
      );

      if (!progressContainer) {
        console.error(
          `No progressContainer found for file ${file.fileName || file.name}`
        );
        continue;
      }

      const progressBar = progressContainer.querySelector(".progress-bar");

      try {
        const uploadResponse = await uploadFile(
          actualFile,
          cardId,
          progressBar,
          progressContainer,
          {
            compressionPercent,
            fileFormat,
          }
        );

        updateFileStatus(actualFile.name, "Upload erfolgreich");

        // Safely check for remainingCredits
        if (uploadResponse && uploadResponse.remainingCredits !== undefined) {
          document.querySelector(
            ".settings-container .settings ul li:nth-child(5) p"
          ).textContent = `${uploadResponse.remainingCredits} Credits`;
          console.log(`Credits updated: ${uploadResponse.remainingCredits}`);
        } else {
          console.warn("Upload response missing 'remainingCredits'.");
        }

        console.log(`Upload abgeschlossen für: ${actualFile.name}`);
      } catch (error) {
        updateFileStatus(actualFile.name, "Upload fehlgeschlagen", true);
        console.error(
          `Fehler beim Upload der Datei ${actualFile.name}:`,
          error
        );
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
      const actualFile = file.fileBlob || file;
      formData.append("file", actualFile, actualFile.name);
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

  function updateSettingsContainer(card) {
    const settingsContainer = document.querySelector(
      ".settings-container .settings ul"
    );

    settingsContainer.innerHTML = `
        <li>
            <p class="settings-category">Dateiformate</p>
            <p>${card.file_format || ".jpeg"}</p>
        </li>
        <li>
            <p class="settings-category">Dateigröße (max.)</p>
            <p>${card.max_file_size || "50 MB"}</p>
        </li>
        <li>
            <p class="settings-category">Komprimierungsgrad</p>
            <p>${card.compression_level || "75%"}</p>
        </li>
        <li>
            <p class="settings-category">Ablaufdatum des Links</p>
            <p>${new Date(card.expiration_date).toLocaleDateString()}</p>
        </li>
        <li>
            <p class="settings-category">Guthaben Anzeige</p>
            <p>${card.credits || 0} Credits</p>
        </li>
    `;
  }

  dropboxButton.addEventListener("click", () => {
    console.log("Dropbox button clicked, opening chooser...");

    Dropbox.choose({
      success: function (files) {
        console.log("Dropbox chooser success callback triggered.");
        if (!files.length) {
          console.error("Keine Datei ausgewählt.");
          return;
        }

        const fileUrl = files[0].link;
        const fileName = files[0].name;
        console.log(`Dropbox file selected: ${fileName}, URL: ${fileUrl}`);

        // Add Dropbox file to the UI list
        const listItem = document.createElement("li");
        listItem.className = "file-item";
        listItem.dataset.fileUrl = fileUrl;
        listItem.innerHTML = `
          <div class="file-info">
            <img class="prev-pic" src="${fileUrl}" alt="preview">
            <p class="filename">${fileName}</p>
          </div>
          <p class="timestamp">Ausstehend</p>
          <div class="file-actions">
            <span class="icon close">close</span>
            <span class="icon delete inactive">delete</span>
            <span class="icon download inactive">download</span>
          </div>
          <div class="file-progress hidden">
            <div class="progress-container">
              <div class="progress-bar"></div>
            </div>
          </div>
        `;

        fileListToday.appendChild(listItem);

        // Store Dropbox file info
        filesToUpload.push({ fileUrl, fileName, isDropbox: true });
        console.log(`File ${fileName} added to upload queue.`);

        // Enable remove option
        const closeIcon = listItem.querySelector(".icon.close");
        if (closeIcon) {
          closeIcon.addEventListener("click", () => {
            filesToUpload = filesToUpload.filter((f) => f.fileUrl !== fileUrl);
            listItem.remove();
            console.log(`Datei entfernt: ${fileName}`);
          });
        }
      },
      cancel: function () {
        console.log("Dropbox chooser was canceled.");
      },
      linkType: "direct",
      multiselect: false,
      extensions: [".png", ".jpg", ".jpeg"],
    });
  });

  const CLIENT_ID =
    "448628978608-8taeksfsvhtjhrge7pbge6sc0gj7mb4e.apps.googleusercontent.com";
  const PICKER_API_KEY = "AIzaSyCKvK30z0OWcsJdHG41QT8qE3oWVmIgtH8";
  const SCOPES =
    "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive";

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

  document
    .getElementById("selectFromGoogleDrive")
    .addEventListener("click", () => {
      console.log("Google Drive selection clicked. Requesting access token...");
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
    }
  }

  function pickerCallback(data) {
    console.log("Picker Callback triggered. Data received:", data);
    if (data.action === google.picker.Action.PICKED) {
      const fileId = data.docs[0].id;
      const fileName = data.docs[0].name;
      console.log(`File selected. ID: ${fileId}, Name: ${fileName}`);
      fetchGoogleDriveFile(fileId, fileName);
    } else if (data.action === google.picker.Action.CANCEL) {
      console.log("Google Drive file selection canceled.");
    }
  }

  // Fetch file from Google Drive and add to list (without uploading yet)
  async function fetchGoogleDriveFile(fileId, fileName) {
    const accessToken = oauthToken;

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const mimeType = response.headers.get("Content-Type");
        const fileExtension = getFileExtensionFromMimeType(mimeType);
        const fullFileName = fileName.includes(".")
          ? fileName
          : `${fileName}${fileExtension}`;

        // Convert blob to File object
        const googleDriveFile = new File([blob], fullFileName, {
          type: mimeType,
        });

        // Add file to UI list
        addGoogleDriveFileToList(googleDriveFile, fullFileName);

        // Store in filesToUpload array for later upload
        filesToUpload.push({
          fileBlob: googleDriveFile,
          fileName: fullFileName,
          isGoogleDrive: true,
        });
        console.log(`File ${fullFileName} added to upload queue.`);
      } else {
        console.error("Error fetching the file from Google Drive.");
      }
    } catch (error) {
      console.error("Error during fetching the file:", error);
    }
  }

  // Function to determine file extension from MIME type
  function getFileExtensionFromMimeType(mimeType) {
    switch (mimeType) {
      case "image/png":
        return ".png";
      case "image/jpg":
      case "image/jpeg":
        return ".jpg";
      case "image/gif":
        return ".gif";
      case "application/pdf":
        return ".pdf";
      case "text/plain":
        return ".txt";
      default:
        return "";
    }
  }

  // Add the Google Drive file to the UI list
  function addGoogleDriveFileToList(blob, fileName) {
    const fileListToday = document.getElementById("file-list-today");
    const fileUrl = URL.createObjectURL(blob);

    const listItem = document.createElement("li");
    listItem.className = "file-item";
    listItem.dataset.fileName = fileName;
    listItem.innerHTML = `
        <div class="file-info">
            <img class="prev-pic" src="${fileUrl}" alt="preview">
            <p class="filename">${fileName}</p>
        </div>
        <p class="timestamp">Ausstehend</p>
        <div class="file-actions">
            <span class="icon close">close</span>
            <span class="icon delete inactive">delete</span>
            <span class="icon download inactive">download</span>
        </div>
        <div class="file-progress hidden">
            <div class="progress-container">
                <div class="progress-bar"></div>
            </div>
        </div>
    `;

    fileListToday.appendChild(listItem);

    // Close button to remove the file before upload
    const closeIcon = listItem.querySelector(".icon.close");
    if (closeIcon) {
      closeIcon.addEventListener("click", () => {
        filesToUpload = filesToUpload.filter((f) => f.fileName !== fileName);
        listItem.remove();
        console.log(`File removed: ${fileName}`);
      });
    }
  }

  selectFromURL.addEventListener("click", () => {
    urlUploadModal.classList.add("visible");
    modalBackdrop.classList.add("visible");
    imageUrlInput.value = ""; // Reset input
  });

  // Close Modal on backdrop or close button
  modalBackdrop.addEventListener("click", closeModal);
  closeUrlModal.addEventListener("click", closeModal);

  function closeModal() {
    urlUploadModal.classList.remove("visible");
    modalBackdrop.classList.remove("visible");
  }

  // Handle URL Submission
  submitImageUrl.addEventListener("click", async () => {
    const imageUrl = imageUrlInput.value.trim();
    if (!imageUrl) {
      alert("Bitte eine gültige Bild-URL eingeben.");
      return;
    }
  
    try {
      // Fetch the image
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Bild konnte nicht geladen werden.");
  
      const blob = await response.blob();
      const mimeType = blob.type || "image/jpeg"; // Fallback if type is undefined
      const fileName = imageUrl.split("/").pop().split("?")[0] || "image.jpg";
  
      // Convert blob to File object with proper MIME type
      const file = new File([blob], fileName, { type: mimeType });
  
      // Add to UI list
      addURLFileToList(file, imageUrl);
  
      // Store in filesToUpload with correct structure
      filesToUpload.push({
        fileBlob: file,      // The actual File object
        fileName: file.name, // Name for reference
        isURL: true,         // Flag indicating URL source
        mimeType: mimeType   // Include MIME type
      });
  
      closeModal();
      console.log(`URL-Datei ${fileName} erfolgreich hinzugefügt.`);
    } catch (error) {
      alert(`Fehler beim Laden des Bildes: ${error.message}`);
      console.error("Fehler beim Laden der Bild-URL:", error);
    }
  });

  // Add URL Image to UI List
  function addURLFileToList(file, imageUrl) {
    const listItem = document.createElement("li");
    listItem.className = "file-item";
    listItem.innerHTML = `
    <div class="file-info">
      <img class="prev-pic" src="${imageUrl}" alt="preview">
      <p class="filename">${file.name}</p>
    </div>
    <p class="timestamp">Ausstehend</p>
    <div class="file-actions">
      <span class="icon close">close</span>
      <span class="icon delete inactive">delete</span>
      <span class="icon download inactive">download</span>
    </div>
    <div class="file-progress hidden">
      <div class="progress-container">
        <div class="progress-bar"></div>
      </div>
    </div>
  `;

    fileListToday.appendChild(listItem);

    // Close button to remove file
    const closeIcon = listItem.querySelector(".icon.close");
    closeIcon.addEventListener("click", () => {
      filesToUpload = filesToUpload.filter((f) => f.fileName !== file.name);
      listItem.remove();
      console.log(`Datei entfernt: ${file.name}`);
    });
  }
});
