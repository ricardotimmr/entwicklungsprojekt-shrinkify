const emailForm = document.getElementById('emailForm');
const emailInput = document.getElementById('emailInput');

emailForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = emailInput.value;

    try {
        const response = await fetch('http://localhost:3000/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
        } else {
            alert(result.message || 'Fehler beim Versenden der E-Mail.');
        }
    } catch (error) {
        console.error('Fehler beim Senden:', error);
        alert('Ein Fehler ist aufgetreten.');
    }
});