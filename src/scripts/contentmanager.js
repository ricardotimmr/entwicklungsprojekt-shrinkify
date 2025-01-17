// Function to toggle the customer card
function toggleCard(button) {
    var card = button.closest('.customer').querySelector('.customer-links');

    if (card) {
        if (card.style.display === "none" || card.style.display === "") {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    }
}

// Function to add percentage symbol
function addPercentageSymbol(input) {
    if (input.value && !input.value.trim().endsWith('%')) {
        input.value = input.value.trim() + '%';
    }
}

// Function to add MB
function addMB(input) {
    if (input.value && !input.value.trim().endsWith('MB') && !input.value.trim().endsWith('mb')) {
        input.value = input.value.trim() + 'MB';
    }
}

// Function to add credits
function addCredits(input) {
    if (input.value && !input.value.trim().endsWith('Credits')) {
        input.value = input.value.trim() + 'Credits';
    }
}