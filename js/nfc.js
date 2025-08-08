// Vibración (solo móviles)
function vibrate(pattern = 200) {
    if ("vibrate" in navigator) {
        navigator.vibrate(pattern);
    }
}

// Validación del formulario
function validateForm() {
    const petName = document.getElementById('petName').value;
    const ownerPhone = document.getElementById('ownerPhone').value;
    
    if (!petName || !ownerPhone) {
        alert("¡Completa los campos obligatorios!");
        return false;
    }
    return true;
}

// Guardar en NFC
async function saveToNfc() {
    if (!validateForm()) return;

    const overlay = document.getElementById('nfcOverlay');
    const step1 = document.getElementById('nfcStep1');
    const step2 = document.getElementById('nfcStep2');
    const step3 = document.getElementById('nfcStep3');

    // Mostrar overlay
    overlay.style.display = 'flex';
    step1.style.display = 'block';
    vibrate(100); // Vibración al iniciar

    try {
        if (!('NDEFReader' in window)) {
            throw new Error("Usa Chrome en Android con NFC activado.");
        }

        const nfc = new NDEFReader();
        
        // Paso 1: Detectar NFC
        nfc.onreading = () => {
            vibrate(100); // Vibración al detectar
            step1.style.display = 'none';
            step2.style.display = 'block';

            // Countdown
            let seconds = 3;
            const timer = setInterval(() => {
                document.querySelector('.countdown').textContent = seconds;
                document.querySelector('.progress').style.width = `${(4-seconds)*33.33}%`;
                
                if (seconds-- <= 0) {
                    clearInterval(timer);
                    vibrate([100, 50, 100]); // Vibración de éxito
                    step2.style.display = 'none';
                    step3.style.display = 'block';
                    
                    // Auto-redirección después de 2 segundos
                    setTimeout(() => {
                        window.location.href = "info.html";
                    }, 2000);
                }
            }, 1000);
        };

        // Paso 2: Escribir datos
        await nfc.write({
            records: [{
                recordType: "text",
                data: JSON.stringify({
                    name: document.getElementById('petName').value,
                    phone: document.getElementById('ownerPhone').value
                })
            }]
        });

    } catch (error) {
        overlay.style.display = 'none';
        alert(`Error: ${error.message}`);
        console.error(error);
        vibrate(300); // Vibración larga para error
    }
}

// Asignar evento al botón
document.getElementById('saveBtn').addEventListener('click', saveToNfc);
