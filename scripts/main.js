// Function to format number with commas, respecting unit-specific decimal places
function formatNumberWithCommas(value, units, isSpan = false) {
    const cleanValue = value.replace(/[^0-9.]/g, ''); // Allow digits and decimal point
    if (cleanValue === '' || cleanValue === '.') {
        return '';
    }
    const parts = cleanValue.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts[1] : '';
    const maxDecimals = units === 'si' ? 4 : 2; // 4 decimals for SI, 2 for imperial
    const number = parseFloat(cleanValue);
    if (!isNaN(number)) {
        return number.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: maxDecimals
        });
    }
    return cleanValue;
}

function toggleUnits() {
    const units = document.getElementById('units').value;
    const spanUnit = document.getElementById('spanUnit');
    const fyUnit = document.getElementById('fyUnit');
    const fyInput = document.getElementById('fy');
    const spanInput = document.getElementById('span');
    const currentFy = parseFloat(fyInput.value.replace(/,/g, '')) || 0;
    const currentSpan = parseFloat(spanInput.value.replace(/,/g, '')) || 0;

    // Update unit labels and convert values
    if (units === 'imperial') {
        spanUnit.innerText = 'feet';
        fyUnit.innerText = 'psi';
        if (currentFy) {
            // Convert MPa to psi: 1 MPa = 145.03773773020924409138 psi
            fyInput.value = formatNumberWithCommas((currentFy * 145.03773773020924409138).toString(), units);
        } else {
            fyInput.value = formatNumberWithCommas('60000', units); // Default 60,000 psi
        }
        if (currentSpan) {
            // Convert meters to feet: 1 m = 3.2808398950131233596 ft
            spanInput.value = formatNumberWithCommas((currentSpan * 3.2808398950131233596).toString(), units, true);
        }
    } else {
        spanUnit.innerText = 'meters';
        fyUnit.innerText = 'MPa';
        if (currentFy) {
            // Convert psi to MPa: 1 psi = 0.00689475729316836 MPa
            fyInput.value = formatNumberWithCommas((currentFy * 0.00689475729316836).toString(), units);
        } else {
            fyInput.value = formatNumberWithCommas('414', units); // Default 414 MPa
        }
        if (currentSpan) {
            // Convert feet to meters: 1 ft = 0.3048 m
            spanInput.value = formatNumberWithCommas((currentSpan * 0.3048).toString(), units, true);
        }
    }

    calculateMinDepth();
}

function calculateMinDepth() {
    const span = parseFloat(document.getElementById('span').value);
    const condition = document.getElementById('condition').value;
    let fy = parseFloat(document.getElementById('fy').value.replace(/,/g, ''));
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
    const formattedSpan = span.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: units === 'si' ? 4 : 2 });
    const formattedFy = fy.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: units === 'si' ? 4 : 2 });
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

// Function to manage CTA button in mobile view
function manageCTAButton() {
    const isMobile = window.matchMedia('(max-width: 780px)').matches;
    const form = document.getElementById('beamForm');
    const formContainer = form.parentElement; // Append button outside form
    const existingButton = document.querySelector('.cta-button');

    // Remove existing button if present
    if (existingButton) {
        existingButton.remove();
    }

    // Append button only in mobile view, after the form
    if (isMobile) {
        const button = document.createElement('button');
        button.className = 'cta-button';
        button.setAttribute('type', 'button'); // Prevent form submission
        button.setAttribute('aria-label', 'Primary call to action');
        button.innerHTML = '<p><b>See Calculation Details</b></p>';
        formContainer.appendChild(button); // Append outside form

        // Add smooth scroll to calculation details (0.3s animation)
        button.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent any form submission
            const resultContainer = document.querySelector('.result-container');
            const targetPosition = resultContainer.getBoundingClientRect().top + window.pageYOffset;
            const startPosition = window.pageYOffset;
            const distance = targetPosition - startPosition;
            const duration = 300; // 0.3 seconds
            let startTime = null;

            function animation(currentTime) {
                if (startTime === null) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const progress = Math.min(timeElapsed / duration, 1);
                const ease = progress * (2 - progress); // Ease-in-out
                window.scrollTo(0, startPosition + distance * ease);
                if (timeElapsed < duration) {
                    requestAnimationFrame(animation);
                }
            }

            requestAnimationFrame(animation);
        });
    }
}

// Prevent form submission to avoid clearing fields
document.getElementById('beamForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Stop form from submitting
});

// Input event listener for fy (format with commas)
document.getElementById('fy').addEventListener('input', function(e) {
    const cursorPosition = e.target.selectionStart;
    const value = e.target.value;
    const units = document.getElementById('units').value;
    if (value === '' || /^\d*\.?\d*$/.test(value.replace(/,/g, ''))) {
        const formattedValue = formatNumberWithCommas(value, units);
        e.target.value = formattedValue;
        const newPosition = cursorPosition + (formattedValue.length - value.length);
        e.target.setSelectionRange(newPosition, newPosition);
    }
    calculateMinDepth();
});

// Input event listener for span (format with commas)
document.getElementById('span').addEventListener('input', function(e) {
    const cursorPosition = e.target.selectionStart;
    const value = e.target.value;
    const units = document.getElementById('units').value;
    if (value === '' || /^\d*\.?\d*$/.test(value.replace(/,/g, ''))) {
        const formattedValue = formatNumberWithCommas(value, units, true);
        e.target.value = formattedValue;
        const newPosition = cursorPosition + (formattedValue.length - value.length);
        e.target.setSelectionRange(newPosition, newPosition);
    }
    calculateMinDepth();
});

// Event listeners for inputs
document.getElementById('condition').addEventListener('change', calculateMinDepth);
document.getElementById('units').addEventListener('change', toggleUnits);
window.addEventListener('resize', manageCTAButton);

// Theme Toggle Functionality
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeIcon = document.querySelector('.theme-icon');
    const themeLabel = document.querySelector('.theme-label');
    
    if (themeIcon) {
        themeIcon.src = theme === 'dark' ? 'images/moon-icon.svg' : 'images/sun-icon.svg';
        themeIcon.alt = theme === 'dark' ? 'Dark mode' : 'Light mode';
    }
    if (themeLabel) {
        themeLabel.textContent = theme === 'dark' ? 'Dark' : 'Light';
    }
    // Always store the theme to persist user preference
    localStorage.setItem('theme', theme);
}

function initializeTheme() {
    // Check for stored theme first
    let savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // If no saved theme, use system preference
    if (!savedTheme) {
        savedTheme = prefersDark ? 'dark' : 'light';
    }
    
    setTheme(savedTheme);
    
    const themeToggleButton = document.querySelector('.theme-toggle');
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }
}

// Update theme on system color scheme change
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Only update if no user preference is stored
    if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
    }
});

// Initialize
initializeTheme();
manageCTAButton();
calculateMinDepth();