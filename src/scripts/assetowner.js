document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("fileInput");
  const browseButton = document.getElementById("browseButton");
  const toastContainer = document.getElementById("toastContainer");
  const fileListToday = document.getElementById("file-list-today");
  const fileListOld = document.getElementById("file-list-old");
  const startUploadButton = document.getElementById("start-upload");
  const dropArea = document.getElementById("drop-area");

  const emailButton = document.getElementById("openEmailModal");
  const emailModal = document.getElementById("emailModal");
  const modalBackdrop = document.getElementById("modalBackdrop");
  const closeEmailModal = document.getElementById("closeEmailModal");

  const emailForm = document.getElementById("emailForm");
  const emailInput = document.getElementById("emailInput");

  const dropboxButton = document.getElementById("selectFromDropBox");

  let filesToUpload = [];
  let cardId = null;

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  // Überprüfen, ob ein Token vorhanden ist, andernfalls Zugriff verweigern
  if (!token) {
    alert("Ungültiger Zugriff. Kein Token gefunden.");
    return;
  }

  // Token validieren, Karten-ID extrahieren und Bilder sowie Karteneinstellungen laden
  fetch(`/validate-token?token=${token}`)
    .then((response) => response.json())
    .then((data) => {
      if (!data.valid) {
        alert("Ungültiger oder abgelaufener Link.");
        window.location.href = "/";
      } else {
        cardId = parseInt(data.data.cardId, 10); // Sicherstellen, dass cardId eine Zahl ist

        if (isNaN(cardId)) {
          console.error("Fehler: cardId ist keine gültige Zahl.", cardId);
          return;
        }

        const projectName = data.data.projectName || "Projektname";
        const projectTitleElement = document.querySelector(".overview h2");
        if (projectTitleElement) {
          projectTitleElement.textContent = projectName;
        }

        loadImages(cardId);

        fetch(`/customers/${data.data.customerId}/cards`)
          .then((response) => response.json())
          .then((cardsData) => {
            const card = cardsData.cards.find((c) => c.id === cardId);
            if (card) {
              updateSettingsContainer(card);
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

  // Lade Bilder aus der Datenbank und zeige sie in der Liste an (Frühere Uploads)
  function loadImages(cardId) {
    fetch(`http://localhost:3000/images/${cardId}`)
      .then((response) => response.json())
      .then((images) => {
        fileListToday.innerHTML = "";

        images.forEach((image) => {
          const fileName = image.file_path.split("/").pop();

          const timestamp = new Date(image.uploaded_at);
          const day = timestamp.getDate().toString().padStart(2, "0");
          const month = (timestamp.getMonth() + 1).toString().padStart(2, "0"); // Monate sind 0-basiert
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
                } else {
                  console.error("Fehler beim Löschen der Datei.");
                }
              } catch (error) {
                console.error("Fehler beim Löschen der Datei:", error);
              }
            });
          }

          const downloadIcon = listItem.querySelector(".icon.download");
          if (downloadIcon) {
            downloadIcon.addEventListener("click", () => {
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

  // Event-Listener für Dateiauswahl
  browseButton.addEventListener("click", function () {
    fileInput.click();
  });

  //Event-Listener für Drag & Drop Funktionalitäten
  dropArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropArea.classList.add("dragover");
  });

  dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("dragover");
  });

  dropArea.addEventListener("drop", (event) => {
    event.preventDefault();
    dropArea.classList.remove("dragover");
    fileInput.files = event.dataTransfer.files;
    fileInput.dispatchEvent(new Event("change"));
  });

  // Event-Listener für das Ändern der Dateiauswahl
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

      const closeIcon = progressContainer.querySelector(".icon.close");
      if (closeIcon) {
        closeIcon.addEventListener("click", () => {
          filesToUpload = filesToUpload.filter((f) => f !== file);
          progressContainer.remove();
        });
      }
    }
  });

  // Event-Listener für Button zum Starten des Uploads und der Komprimierung
  startUploadButton.addEventListener("click", async () => {
    if (!cardId || isNaN(cardId)) {
      console.error("Fehler: cardId ist ungültig. Upload abgebrochen.");
      return;
    }

    cardId = Number(cardId);
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
      let actualFile = file;

      if (file.isDropbox) {
        try {
          const dropboxResponse = await fetch(file.fileUrl);
          const blob = await dropboxResponse.blob();
          actualFile = new File([blob], file.fileName, { type: blob.type });
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
        actualFile = file.fileBlob;
      }

      if (actualFile.size > maxFileSizeBytes) {
        alert(
          `Die Datei ${actualFile.name} überschreitet die maximale Dateigröße von ${max_file_size}.`
        );
        continue;
      }

      const progressContainer = Array.from(
        document.querySelectorAll(".file-item")
      ).find((item) => {
        const filenameElement = item.querySelector(".filename");
        return (
          filenameElement &&
          filenameElement.textContent.trim() === (file.name || file.fileName)
        );
      });

      if (!progressContainer) {
        console.error(
          "Kein passender progressContainer für Datei gefunden:",
          file.name
        );
        return;
      }

      if (!progressContainer) {
        console.error(`Kein progressContainer für Datei ${file.name} gefunden`);
        continue;
      }

      const fileProgress = progressContainer.querySelector(".file-progress");
      const progressBar = progressContainer.querySelector(".progress-bar");

      if (fileProgress && progressBar) {
        fileProgress.classList.remove("hidden");
        progressBar.style.width = "0%";
      }

      try {
        let fileToUpload = actualFile || file;

        if (file.isDropbox && file.fileUrl) {
          try {
            const dropboxResponse = await fetch(file.fileUrl);
            const blob = await dropboxResponse.blob();
            fileToUpload = new File([blob], file.fileName, { type: blob.type });
          } catch (dropboxError) {
            console.error(
              `Fehler beim Laden der Dropbox-Datei ${file.fileName}:`,
              dropboxError
            );
            alert(`Fehler beim Laden der Dropbox-Datei ${file.fileName}`);
            return;
          }
        }

        const uploadResponse = await uploadFile(
          fileToUpload,
          cardId,
          progressBar,
          progressContainer,
          {
            compressionPercent,
            fileFormat,
          }
        );

        if (uploadResponse && uploadResponse.remainingCredits !== undefined) {
          document.querySelector(
            ".settings-container .settings ul li:nth-child(5) p"
          ).textContent = `${uploadResponse.remainingCredits} Credits`;
        }
      } catch (error) {
        updateFileStatus(file.name, "Fehler beim Upload", true);
        console.error(`Fehler beim Upload der Datei ${file.name}:`, error);
      }

      filesToUpload = [];
    }
  });

  // Download-Button für die geladenen Bilder aktivieren
  const downloadAllButton = document.querySelector(".download-all");
  if (!downloadAllButton) {
    console.error("Element mit der Klasse .download-all nicht gefunden");
  } else {
    downloadAllButton.addEventListener("click", () => {
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

  // Datei hochladen mit Fortschrittsanzeige (Heute Liste dynamisch aktualisieren)
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

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);

          if (!response.compressed || !response.compressed.path) {
            console.error(
              "Fehler: Der komprimierte Pfad fehlt in der Serverantwort!"
            );
            return;
          }

          const previewImg = progressContainer.querySelector(".prev-pic");
          previewImg.src = response.compressed.path;

          const downloadIcon =
            progressContainer.querySelector(".icon.download");
          if (downloadIcon) {
            downloadIcon.addEventListener("click", () => {
              const a = document.createElement("a");
              a.href = response.compressed.path;

              const originalName =
                file?.name || file?.fileName || "download.jpeg";
              const safeFileName = originalName.replace(/\.[^/.]+$/, ".jpeg");

              a.download = safeFileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            });
          }

          const deleteIcon = progressContainer.querySelector(".icon.delete");
          if (deleteIcon) {
            deleteIcon.addEventListener("click", async () => {
              try {
                const filePath = response.compressed.path.replace(
                  "/compressed/",
                  ""
                );

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
                  progressContainer.remove();
                } else {
                  console.error("Fehler beim Löschen:", result.message);
                }
              } catch (error) {
                console.error(
                  "Fehler beim Serveraufruf während Löschvorgang:",
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

      const formData = new FormData();
      const actualFile = file.fileBlob || file;
      formData.append("file", actualFile, actualFile.name);
      formData.append("cardId", String(cardId)); 

      xhr.send(formData);
    });
  }

  // Status einer Datei in der Liste aktualisieren
  function updateFileStatus(fileName, status, isError = false) {
    const items = document.querySelectorAll(".file-item");
    items.forEach((item) => {
      const fileNameElement = item.querySelector(".filename");
      if (fileNameElement && fileNameElement.textContent === fileName) {
        const timestamp = item.querySelector(".timestamp");
        timestamp.textContent = status;
        const progressBar = item.querySelector(".progress-bar");
        if (isError) {
          progressBar.style.backgroundColor = "#f8d7da";
        }
      }
    });
  }

  // Anzeige der Einstellung auf aktuelle Content Manager Vorgaben stellen
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

  // EventListener für Dropbox-Button 
  dropboxButton.addEventListener("click", () => {

    Dropbox.choose({
      success: function (files) {
        if (!files.length) {
          console.error("Keine Datei ausgewählt.");
          return;
        }

        const fileUrl = files[0].link;
        const fileName = files[0].name;

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

        filesToUpload.push({ fileUrl, fileName, isDropbox: true });

        const closeIcon = listItem.querySelector(".icon.close");
        if (closeIcon) {
          closeIcon.addEventListener("click", () => {
            filesToUpload = filesToUpload.filter((f) => f.fileUrl !== fileUrl);
            listItem.remove();
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

  // Google Picker API initialisieren
  gapi.load("picker", () => {
    pickerApiLoaded = true;
  });

  window.onload = () => {
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

  // Event-Listener für Google Drive Button
  document
    .getElementById("selectFromGoogleDrive")
    .addEventListener("click", () => {
      tokenClient.requestAccessToken();
    });

  function createPicker() {
    if (pickerApiLoaded && oauthToken) {

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

  // Callback-Funktion für die Google Picker API zur Handhabung der Dateiauswahl
  function pickerCallback(data) {
    console.log("Picker Callback triggered. Data received:", data);
    if (data.action === google.picker.Action.PICKED) {
      const fileId = data.docs[0].id;
      const fileName = data.docs[0].name;
      fetchGoogleDriveFile(fileId, fileName);
    } else if (data.action === google.picker.Action.CANCEL) {
      console.log("Google Drive file selection canceled.");
    }
  }

  // Funktion zum Abrufen der Datei von Google Drive
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

        const googleDriveFile = new File([blob], fullFileName, {
          type: mimeType,
        });

        addGoogleDriveFileToList(googleDriveFile, fullFileName);

        filesToUpload.push({
          fileBlob: googleDriveFile,
          fileName: fullFileName,
          isGoogleDrive: true,
        });
      } else {
        console.error("Error fetching the file from Google Drive.");
      }
    } catch (error) {
      console.error("Error during fetching the file:", error);
    }
  }

  // Dateiendung aus MIME-Typ extrahieren
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

  // GoogleDrive Datei zur Liste Upload Liste hinzufügen
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

    const closeIcon = listItem.querySelector(".icon.close");
    if (closeIcon) {
      closeIcon.addEventListener("click", () => {
        filesToUpload = filesToUpload.filter((f) => f.fileName !== fileName);
        listItem.remove();
      });
    }
  }

  selectFromURL.addEventListener("click", () => {
    urlUploadModal.classList.add("visible");
    modalBackdrop.classList.add("visible");
    imageUrlInput.value = ""; 
  });

  // URL Upload Modal
  modalBackdrop.addEventListener("click", closeModal);
  closeUrlModal.addEventListener("click", closeModal);

  function closeModal() {
    urlUploadModal.classList.remove("visible");
    modalBackdrop.classList.remove("visible");
  }

  // URL Upload Button Event Listener
  submitImageUrl.addEventListener("click", async () => {
    const imageUrl = imageUrlInput.value.trim();
    if (!imageUrl) {
      alert("Bitte eine gültige Bild-URL eingeben.");
      return;
    }

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Bild konnte nicht geladen werden.");

      const blob = await response.blob();
      const mimeType = blob.type || "image/jpeg"; 
      const fileName = imageUrl.split("/").pop().split("?")[0] || "image.jpg";

      const file = new File([blob], fileName, { type: mimeType });

      addURLFileToList(file, imageUrl);

      filesToUpload.push({
        fileBlob: file, // The actual File object
        fileName: file.name, // Name for reference
        isURL: true, // Flag indicating URL source
        mimeType: mimeType, // Include MIME type
      });

      closeModal();
      console.log(`URL-Datei ${fileName} erfolgreich hinzugefügt.`);
    } catch (error) {
      alert(`Fehler beim Laden des Bildes: ${error.message}`);
      console.error("Fehler beim Laden der Bild-URL:", error);
    }
  });

  // URL-Datei zur Upload-Liste hinzufügen
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

    const closeIcon = listItem.querySelector(".icon.close");
    closeIcon.addEventListener("click", () => {
      filesToUpload = filesToUpload.filter((f) => f.fileName !== file.name);
      listItem.remove();
    });
  }

  // Modal öffnen
  emailButton.addEventListener("click", () => {
    emailModal.classList.add("visible");
    modalBackdrop.classList.add("visible");
  });

  // Modal schließen
  closeEmailModal.addEventListener("click", () => {
    emailModal.classList.remove("visible");
    modalBackdrop.classList.remove("visible");
  });

  // Modal schließen bei Klick auf Hintergrund
  modalBackdrop.addEventListener("click", () => {
    emailModal.classList.remove("visible");
    modalBackdrop.classList.remove("visible");
  });

  // E-Mail senden, wenn Mail Button geklickt wird
  emailForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value;

    try {
      const response = await fetch("http://localhost:3000/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, cardId }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("E-Mail erfolgreich gesendet!");
        emailModal.classList.remove("visible");
        modalBackdrop.classList.remove("visible");
      } else {
        alert(
          "Fehler: " + (result.message || "E-Mail konnte nicht gesendet werden.")
        );
      }
    } catch (error) {
      console.error("Fehler beim Senden:", error);
      alert("Ein Fehler ist aufgetreten.");
    }
  });

  // Event-Listener für Anfrage von zusätzlichen Credits
  document
    .getElementById("request-credits-btn")
    .addEventListener("click", () => {
      if (!cardId) {
        alert("Fehler: Keine Karten-ID gefunden.");
        return;
      }

      fetch("/request-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
          } else {
            alert("Fehler beim Senden der Anfrage.");
          }
        })
        .catch((err) => {
          console.error("Fehler beim Senden der Anfrage:", err);
          alert("Ein Fehler ist aufgetreten.");
        });
    });
});
