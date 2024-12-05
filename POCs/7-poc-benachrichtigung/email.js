const sendEmail = async (recipientEmail) => {
    try {
        const response = await fetch("http://localhost:3000/api/email/send-email", { 
            method: "POST",
            headers: {
                Authorization: "mlsn.5cba995f71cb74d3522de17b0f9d0c79abcacaelec9b92d041be1470b71f1aff",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: { email: "trial-351ndgw0v8q4zqx8.mlsender.net", name: "Uploader" },
                to: [{ email: recipientEmail, name: "Nutzer" }],
                subject: "Ihr Download-Link",
                text: "Hier ist Ihr Download-Link: https://example.com/download",
            }),
        });

        if (response.ok) {
            console.log("E-Mail erfolgreich gesendet!");
        } else {
            const error = await response.json();
            console.error(`Fehler beim Senden: ${error.message}`);
        }
    } catch (error) {
        console.error("Es ist ein Fehler aufgetreten:", error);
    }
};

export default sendEmail;