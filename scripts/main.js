// Function to format number with commas
function formatNumberWithCommas(value) {
    // Remove non-numeric characters except decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    // If empty or just a decimal point, return empty string
    if (cleanValue === '' || cleanValue === '.') {
        return '';
    }
    // Split into integer and decimal parts
    const parts = cleanValue.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts[1] : '';
    // Only format if integerPart is a valid number
    if (integerPart && !isNaN(parseInt(integerPart))) {
        return parseInt(integerPart).toLocaleString('en-US') + decimalPart;
    }
    return cleanValue; // Return as-is if invalid
}

function toggleUnits() {
    const units = document.getElementById('units').value;
    const spanUnit = document.getElementById('spanUnit');
    const fyUnit = document.getElementById('fyUnit');
    const fyInput = document.getElementById('fy');

    if (units === 'imperial') {
        spanUnit.innerText = 'feet';
        fyUnit.innerText = 'psi';
        fyInput.value = (60000).toLocaleString('en-US'); // Format with commas
    } else {
        spanUnit.innerText = 'meters';
        fyUnit.innerText = 'MPa';
        fyInput.value = (420).toLocaleString('en-US'); // Format with commas
    }

    calculateMinDepth();
}

function calculateMinDepth() {
    const span = parseFloat(document.getElementById('span').value);
    const condition = document.getElementById('condition').value;
    let fy = parseFloat(document.getElementById('fy').value.replace(/,/g, '')); // Remove commas for parsing
    const units = document.getElementById('units').value;
    let minDepth = 0;
    let formula = '';
    let suggestion = '';

    if (isNaN(span) || span <= 0 || isNaN(fy) || fy <= 0) {
        document.getElementById('minDepth').innerText = '--';
        document.getElementById('details').innerText = 'Please enter valid span and fy.';
        return;
    }

    const conversionFactor = units === 'imperial' ? 12 : 1000;
    const fyFactor = units === 'imperial' ? (0.4 + fy / 100000) : (0.4 + fy / 700);

    let ratio = 1;
    switch (condition) {
        case 'simplySupported': ratio = 20; break;
        case 'oneEndContinuous': ratio = 24; break;
        case 'bothEndsContinuous': ratio = 28; break;
        case 'cantilever': ratio = 10; break;
    }

    minDepth = (span * conversionFactor / ratio) * fyFactor;

    // Format numbers with commas
    const formattedMinDepth = minDepth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formattedSpan = span.toLocaleString('en-US');
    const formattedFy = fy.toLocaleString('en-US');
    const formattedConversionFactor = conversionFactor.toLocaleString('en-US');

    if (units === 'imperial' && minDepth < 12) {
        suggestion = `<b>Note:</b> Use a minimum depth of <b>4 inches.</b><br><br>`;
    } else if (units === 'si' && minDepth < 100) {
        suggestion = `<b>Note:</b> Use a minimum depth of <b>100 mm.</b><br><br>`;
    }

    formula = `<b>Calculation details:</b><br><br>` +
             `\\[ \\text{Ratio from table:} \\ \\frac{l}{${ratio}} \\]` +
             `\\[ \\text{Adjustment factor for } f_y: \\ (0.4 + \\frac{f_y}{${units === 'imperial' ? '100,000' : '700'}}) \\]` +
             `\\[ \\text{Adjustment factor for } f_y: \\ = (0.4 + \\frac{${formattedFy}}{${units === 'imperial' ? '100,000' : '700'}}) \\]` +
             `\\[ = ${fyFactor.toFixed(2)} \\]` +
             `\\[ h = \\frac{\\text{Span} \\times ${formattedConversionFactor}}{${ratio}} \\times ${fyFactor.toFixed(2)} \\]` +
             `\\[ h = \\frac{(${formattedSpan} \\times ${formattedConversionFactor})}{${ratio}} \\times ${fyFactor.toFixed(2)} \\]` +
             `<b>h = ${formattedMinDepth} ${units === 'imperial' ? 'inches' : 'mm'}</b>`;

    document.getElementById('minDepth').innerHTML = `${formattedMinDepth} ${units === 'imperial' ? 'inches' : 'mm'}`;
    document.getElementById('details').innerHTML = suggestion + formula;

    MathJax.typeset();
}

// Add input event listener for fy to format with commas
document.getElementById('fy').addEventListener('input', function(e) {
    const cursorPosition = e.target.selectionStart;
    const value = e.target.value;
    // Allow empty input or valid number (digits, optional decimal)
    if (value === '' || /^\d*\.?\d*$/.test(value.replace(/,/g, ''))) {
        const formattedValue = formatNumberWithCommas(value);
        e.target.value = formattedValue;
        // Restore cursor position (adjust for added/removed commas)
        const newPosition = cursorPosition + (formattedValue.length - value.length);
        e.target.setSelectionRange(newPosition, newPosition);
    }
    calculateMinDepth();
});

document.getElementById('span').addEventListener('input', calculateMinDepth);
document.getElementById('condition').addEventListener('change', calculateMinDepth);
document.getElementById('units').addEventListener('change', toggleUnits);

// Initialize with formatted value
document.getElementById('fy').value = (60000).toLocaleString('en-US');
calculateMinDepth();