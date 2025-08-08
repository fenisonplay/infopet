// Objeto para almacenar los datos de la mascota
let petData = {};

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // 1. Manejo de la selección de imagen
    document.getElementById('petPhoto').addEventListener('change', function(e) {
        const file = e.target.files[0];
        const fileNameElement = document.getElementById('fileName');
        const imagePreview = document.getElementById('imagePreview');
        
        if (file) {
            fileNameElement.textContent = file.name;
            
            // Mostrar previsualización
            const reader = new FileReader();
            reader.onload = function(event) {
                imagePreview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        } else {
            fileNameElement.textContent = 'No se ha seleccionado ninguna imagen';
            imagePreview.innerHTML = '';
        }
    });

    // 2. Generar tarjeta NFC
    document.getElementById('generateBtn').addEventListener('click', async function() {
        // Validar campos requeridos
        if (!validateForm()) return;

        // Obtener la imagen en base64 si existe
        const photoInput = document.getElementById('petPhoto');
        let imageBase64 = '';
        
        if (photoInput.files[0]) {
            imageBase64 = await readFileAsDataURL(photoInput.files[0]);
        }

        // Generar los datos y la tarjeta visual
        await generatePetCard(imageBase64);
    });

    // 3. Grabar en NFC
    document.getElementById('writeNfcBtn').addEventListener('click', writeNfcTag);

    // 4. Ayuda NFC
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

// Leer archivo como Data URL
function readFileAsDataURL(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
    });
}

// Generar la tarjeta visual y los datos
async function generatePetCard(imageBase64) {
    // Recoger datos del formulario
    petData = {
        name: document.getElementById('petName').value.trim(),
        type: document.getElementById('petType').value,
        breed: document.getElementById('petBreed').value.trim(),
        age: document.getElementById('petAge').value,
        owner: document.getElementById('ownerName').value.trim(),
        phone: document.getElementById('ownerPhone').value.trim(),
        medical: document.getElementById('medicalInfo').value.trim(),
        image: imageBase64,
        timestamp: new Date().toISOString()
    };

    // Generar imagen de la tarjeta (calidad inicial 0.8)
    petData.cardImage = await generateCardImage(0.8);
    
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

// Generar imagen de la tarjeta (JPG) con calidad ajustable
async function generateCardImage(quality = 0.7) {
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
    
    // Foto de la mascota (si existe)
    if (petData.image) {
        const img = new Image();
        await new Promise((resolve) => {
            img.onload = resolve;
            img.src = petData.image;
        });
        
        // Dibujar imagen redondeada
        ctx.beginPath();
        ctx.arc(150, 160, 50, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, 100, 110, 100, 100);
        ctx.restore();
    }
    
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
    
    // Convertir canvas a JPG con calidad especificada
    return canvas.toDataURL('image/jpeg', quality);
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

        // 2. Optimizar datos para NFC
        showStatus('Optimizando datos para NFC...', 'info');
        const { imageArrayBuffer, jsonData } = await prepareNfcData();

        // 3. Intentar escritura con timeout
        showStatus('Acerca el tag NFC al dispositivo...', 'info');
        await writeWithTimeout(imageArrayBuffer, jsonData);
        
        showStatus('✅ ¡Tarjeta grabada con éxito!', 'success');
    } catch (error) {
        handleNfcError(error);
    }
}

// Preparar datos optimizados para NFC
async function prepareNfcData() {
    let quality = 0.7; // Calidad inicial
    let imageArrayBuffer;
    let attempts = 0;
    const maxAttempts = 3;
    
    // Intentar reducir tamaño si es necesario
    while (attempts < maxAttempts) {
        try {
            // Generar imagen con calidad actual
            const imageDataUrl = await generateCardImage(quality);
            const imageBlob = await fetch(imageDataUrl).then(r => r.blob());
            imageArrayBuffer = await new Response(imageBlob).arrayBuffer();
            
            // Verificar tamaño (max 4KB para seguridad)
            if (imageArrayBuffer.byteLength > 4000) {
                throw new Error(`Imagen demasiado grande (${imageArrayBuffer.byteLength} bytes)`);
            }
            
            break; // Tamaño aceptable
        } catch (error) {
            attempts++;
            quality -= 0.15; // Reducir calidad
            console.warn(`Intento ${attempts}: Reduciendo calidad a ${quality.toFixed(2)}`);
            
            if (attempts >= maxAttempts) {
                throw new Error('No se pudo optimizar la imagen para el tag NFC');
            }
        }
    }

    // Datos JSON minimizados
    const minimalData = {
        n: petData.name,       // Nombre corto
        o: petData.owner,      // Owner
        p: petData.phone,      // Phone
        m: petData.medical     // Medical
    };
    
    const encoder = new TextEncoder();
    const jsonData = encoder.encode(JSON.stringify(minimalData));

    return { imageArrayBuffer, jsonData };
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
        userMessage = 'Datos demasiado grandes. Intenta con una imagen más pequeña.';
    } else if (error.message.includes('No se pudo optimizar')) {
        userMessage = 'La imagen es muy grande. Reduce la calidad o el tamaño.';
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
