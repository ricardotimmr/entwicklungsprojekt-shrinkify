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

function addPercentageSymbol(input) {
    if (input.value && !input.value.trim().endsWith('%')) {
        input.value = input.value.trim() + '%';
    }
}

function addMB(input) {
    if (input.value && !input.value.trim().endsWith('MB') && !input.value.trim().endsWith('mb')) {
        input.value = input.value.trim() + 'MB';
    }
}

function addCredits(input) {
    if (input.value && !input.value.trim().endsWith('Credits')) {
        input.value = input.value.trim() + 'Credits';
    }
}