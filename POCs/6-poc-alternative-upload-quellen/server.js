const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");

const app = express();
const port = 3000;

app.use(cors({ origin: "*" }));  // For testing purposes, allow all origins.

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only JPEG and PNG allowed."));
        }
    },
});

app.use(express.static(path.join(__dirname, "public")));

// Upload route
app.post("/upload", upload.single("file"), (req, res) => {
    console.log(req.file);  // Log the uploaded file data for debugging purposes
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
    }
    res.status(200).json({
        message: "File uploaded successfully.",
        file: {
            originalName: req.file.originalname,
            size: req.file.size,
            path: req.file.path,
        },
    });
});

// Error handling for Multer
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({ message: "File too large. Max 100 MB allowed." });
        }
    } else if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});