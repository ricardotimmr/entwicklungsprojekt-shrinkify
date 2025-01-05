import 'dotenv/config';
import express from 'express';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

app.post('/send-email', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Bitte geben Sie eine gültige E-Mail-Adresse an.' });
    }

    try {
        const info = await transporter.sendMail({
            from: `"Shrinkify" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Download-Link für Ihre Dateien',
            text: '',
            html: '<p>Hallo,</p><p>hier ist Ihr angefragter <b>Download-Link</b>.</p><p>Viel Spaß wünscht Ihnen das Shrinkify Team!</p>',
        });

        res.status(200).json({ message: 'E-Mail erfolgreich gesendet.', info });
    } catch (error) {
        console.error('Fehler beim Senden der E-Mail:', error);
        res.status(500).json({ message: 'Fehler beim Senden der E-Mail.', error });
    }
});

// Server starten
app.listen(port, () => {
    console.log(`Server läuft unter http://localhost:${port}`);
});
