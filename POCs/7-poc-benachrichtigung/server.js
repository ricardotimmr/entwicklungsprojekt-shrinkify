import express from 'express';
import multer from 'multer';
import path from 'path';
import sendEmail from './email.js';

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Ungültiger Dateityp. Nur JPEG und PNG erlaubt.'));
        }
    },
});

app.use(express.static(path.join(process.cwd(), 'public')));

app.post('/upload', upload.array('file', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Keine Dateien hochgeladen.' });
    }

    res.status(200).json({
        message: `${req.files.length} Datei(en) erfolgreich hochgeladen.`,
        files: req.files.map((file) => ({
            originalName: file.originalname,
            size: file.size,
            path: file.path,
        })),
    });
});

app.post('/api/email/send-email', (req, res) => {
    const { to } = req.body;

    if (!to) {
        return res.status(400).send('Ungültige Anfragedaten.');
    }

    sendEmail(to)
        .then(() => res.status(200).send('E-Mail erfolgreich gesendet.'))
        .catch(error => res.status(500).send(`Fehler beim Senden der E-Mail: ${error.message}`));
});

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ message: 'Eine oder mehrere Dateien sind zu groß. Maximal 50 MB pro Datei erlaubt.' });
        }
    } else if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
});

app.listen(port, () => {
    console.log(`Server läuft unter http://localhost:${port}`);
});