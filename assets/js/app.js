// Objeto para almacenar los datos de la mascota
let petData = {};

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // 1. Generar tarjeta NFC
    document.getElementById('generateBtn').addEventListener('click', async function() {
        // Validar campos requeridos
        if (!validateForm()) return;

        // Generar los datos
        await generatePetCard();
    });

    // 2. Grabar en NFC
    document.getElementById('writeNfcBtn').addEventListener('click', writeNfcTag);

    // 3. Ayuda NFC
    document.getElementById('nfcHelpBtn')?.addEventListener('click', showNfcHelp);
});

// Función para mostrar ayuda NFC
function showNfcHelp() {
    alert(`🆘 Ayuda para grabar en NFC:\n\n1. Usa tags NFC NTAG213 o NTAG216\n2. Mantén el tag estable durante la escritura\n3. Acerca el tag a la parte superior del teléfono\n4. Asegúrate de tener NFC activado\n5. Prueba en un ambiente sin interferencias`);
}

// Función para validar el formulario
function validateForm() {
    const requiredFields = ['petName', 'petType', 'ownerName', 'ownerPhone'];
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            field.classList.add('error-field');
            isValid = false;
        } else {
            field.classList.remove('error-field');
        }
    });

    if (!isValid) {
        showStatus('Por favor complete todos los campos requeridos (*)', 'error');
        return false;
    }
    return true;
}

// Generar la tarjeta visual y los datos (sin imágenes)
async function generatePetCard() {
    // Recoger datos del formulario
    petData = {
        name: document.getElementById('petName').value.trim(),
        type: document.getElementById('petType').value,
        breed: document.getElementById('petBreed').value.trim(),
        age: document.getElementById('petAge').value,
        owner: document.getElementById('ownerName').value.trim(),
        phone: document.getElementById('ownerPhone').value.trim(),
        medical: document.getElementById('medicalInfo').value.trim(),
        timestamp: new Date().toISOString()
    };

    // Generar imagen de la tarjeta (sin foto de mascota)
    petData.cardImage = await generateCardImage();
    
    // Mostrar previsualización
    updatePreview();
    
    // Mostrar sección de previsualización
    document.getElementById('previewSection').style.display = 'block';
    window.scrollTo({
        top: document.getElementById('previewSection').offsetTop - 20,
        behavior: 'smooth'
    });
}

// Actualizar la vista previa
function updatePreview() {
    document.getElementById('previewName').textContent = petData.name;
    document.getElementById('previewBreedAge').textContent = 
        `${petData.breed || 'Sin raza'} • ${petData.age || '?'} años`;
    document.getElementById('previewOwner').textContent = petData.owner;
    document.getElementById('previewPhone').textContent = petData.phone;
    document.getElementById('previewMedical').textContent = petData.medical || 'Ninguna';
    document.getElementById('previewImage').src = petData.cardImage;
}

// Generar imagen de la tarjeta (versión sin foto de mascota)
async function generateCardImage() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Tamaño de la tarjeta (300x400px)
    canvas.width = 300;
    canvas.height = 400;
    
    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Encabezado azul
    ctx.fillStyle = '#4e73df';
    ctx.fillRect(0, 0, canvas.width, 80);
    
    // Logo (icono de huella)
    ctx.font = '30px FontAwesome';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('', 20, 50);
    
    // Título
    ctx.font = 'bold 20px Poppins';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('InfoPet', 60, 50);
    
    // Icono de mascota predeterminado (en lugar de foto)
    ctx.font = '50px FontAwesome';
    ctx.fillStyle = '#dddddd';
    ctx.textAlign = 'center';
    ctx.fillText('', 150, 180);
    
    // Nombre de la mascota
    ctx.font = 'bold 18px Poppins';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.fillText(petData.name, 150, 230);
    
    // Raza y edad
    ctx.font = '14px Poppins';
    ctx.fillStyle = '#666666';
    ctx.fillText(`${petData.breed || 'Sin raza'} • ${petData.age || '?'} años`, 150, 260);
    
    // Información del dueño
    ctx.font = '14px Poppins';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'left';
    ctx.fillText(`Dueño: ${petData.owner}`, 30, 300);
    ctx.fillText(`Contacto: ${petData.phone}`, 30, 320);
    ctx.fillText(`Info Médica: ${petData.medical || 'Ninguna'}`, 30, 340);
    
    // Convertir canvas a JPG
    return canvas.toDataURL('image/jpeg', 0.8);
}

// Función principal para grabar en NFC
async function writeNfcTag() {
    if (!petData || Object.keys(petData).length === 0) {
        showStatus('Primero debes generar los datos de la mascota', 'error');
        return;
    }

    try {
        showStatus('Preparando para grabar...', 'info');
        
        // 1. Verificar soporte NFC
        if (!('NDEFReader' in window)) {
            throw new Error('NFC no soportado. Usa Chrome para Android (versión 89+).');
        }

        // 2. Preparar datos para NFC
        showStatus('Preparando datos para NFC...', 'info');
        
        // Generar imagen de tarjeta
        const imageDataUrl = await generateCardImage();
        const imageBlob = await fetch(imageDataUrl).then(r => r.blob());
        const imageArrayBuffer = await new Response(imageBlob).arrayBuffer();
        
        // Datos JSON minimizados
        const minimalData = {
            n: petData.name,    // Nombre
            o: petData.owner,   // Dueño
            p: petData.phone,   // Teléfono
            m: petData.medical  // Info médica
        };
        
        const encoder = new TextEncoder();
        const jsonData = encoder.encode(JSON.stringify(minimalData));

        // 3. Intentar escritura con timeout
        showStatus('Acerca el tag NFC al dispositivo...', 'info');
        await writeWithTimeout(imageArrayBuffer, jsonData);
        
        showStatus('✅ ¡Tarjeta grabada con éxito!', 'success');
    } catch (error) {
        handleNfcError(error);
    }
}

// Escritura con timeout
async function writeWithTimeout(imageData, jsonData) {
    const ndef = new NDEFReader();
    const abortController = new AbortController();
    
    // Timeout de 20 segundos
    const timeoutId = setTimeout(() => {
        abortController.abort();
        throw new Error('Tiempo agotado. Mantén el tag cerca del dispositivo.');
    }, 20000);

    try {
        await ndef.write({
            records: [
                { 
                    recordType: "mime",
                    mediaType: "image/jpeg",
                    data: imageData
                },
                {
                    recordType: "mime",
                    mediaType: "application/json",
                    data: jsonData
                }
            ]
        }, { signal: abortController.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

// Manejo de errores detallado
function handleNfcError(error) {
    console.error('Error NFC:', error);
    
    let userMessage = 'Error desconocido al grabar NFC';
    
    if (error.message.includes('IO error') || error.message.includes('null')) {
        userMessage = 'Error de comunicación. Prueba:\n1. Con otro tag NFC\n2. Reiniciar el teléfono\n3. Menos interferencias';
    } else if (error.message.includes('NotAllowedError')) {
        userMessage = 'Permiso denegado. Asegúrate de permitir el uso de NFC en tu navegador.';
    } else if (error.message.includes('NotSupportedError')) {
        userMessage = 'Tu dispositivo o navegador no soporta Web NFC. Prueba con Chrome para Android.';
    } else if (error.message.includes('Tiempo agotado')) {
        userMessage = error.message;
    } else if (error.message.includes('demasiado grande') || error.message.includes('overflows')) {
        userMessage = 'Los datos son demasiado grandes. Intenta con menos información.';
    }

    showStatus(`❌ ${userMessage}`, 'error');
}

// Mostrar mensajes de estado
function showStatus(message, type) {
    const statusElement = document.getElementById('nfcStatus');
    const icons = {
        info: '⏳',
        success: '✅',
        error: '❌'
    };
    
    statusElement.innerHTML = `${icons[type] || ''} ${message}`;
    statusElement.className = `status-message ${type}`;
    
    // Auto-ocultar mensajes de éxito después de 5 segundos
    if (type === 'success') {
        setTimeout(() => {
            if (statusElement.textContent.includes(message)) {
                statusElement.textContent = '';
                statusElement.className = 'status-message';
            }
        }, 5000);
    }
}
