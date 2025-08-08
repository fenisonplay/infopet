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
});

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
        alert('Por favor complete todos los campos requeridos (*)');
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

    // Generar imagen de la tarjeta
    petData.cardImage = await generateCardImage();
    
    // Mostrar previsualización
    document.getElementById('previewName').textContent = petData.name;
    document.getElementById('previewBreedAge').textContent = 
        `${petData.breed || 'Sin raza'} • ${petData.age || '?'} años`;
    document.getElementById('previewOwner').textContent = petData.owner;
    document.getElementById('previewPhone').textContent = petData.phone;
    document.getElementById('previewMedical').textContent = petData.medical || 'Ninguna';
    document.getElementById('previewImage').src = petData.cardImage;

    // Mostrar sección de previsualización
    document.getElementById('previewSection').style.display = 'block';
    window.scrollTo({
        top: document.getElementById('previewSection').offsetTop - 20,
        behavior: 'smooth'
    });
}

// Generar imagen de la tarjeta (JPG)
async function generateCardImage() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Tamaño de la tarjeta (ajustable)
    canvas.width = 300;
    canvas.height = 400;
    
    // Diseño de la tarjeta
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Encabezado
    ctx.fillStyle = '#4e73df';
    ctx.fillRect(0, 0, canvas.width, 80);
    
    // Logo
    ctx.font = '30px FontAwesome';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('', 20, 50); // Icono de paw
    
    // Título
    ctx.font = 'bold 20px Poppins';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('InfoPet', 60, 50);
    
    // Foto de la mascota
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
    
    // Datos de la mascota
    ctx.font = 'bold 18px Poppins';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.fillText(petData.name, 150, 230);
    
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
    
    // Convertir canvas a JPG (80% calidad)
    return canvas.toDataURL('image/jpeg', 0.8);
}

// Función para grabar en el tag NFC
async function writeNfcTag() {
    if (!petData || Object.keys(petData).length === 0) {
        showStatus('Primero debes generar los datos de la mascota', 'error');
        return;
    }

    try {
        showStatus('Acerca el teléfono al chip NFC...', 'info');
        
        // Verificar soporte de Web NFC
        if (!('NDEFReader' in window)) {
            throw new Error('Web NFC no soportado. Usa Chrome para Android.');
        }

        // Convertir imagen a ArrayBuffer
        const imageBlob = await fetch(petData.cardImage).then(r => r.blob());
        const imageArrayBuffer = await new Response(imageBlob).arrayBuffer();
        
        // Convertir datos a JSON
        const encoder = new TextEncoder();
        const jsonData = encoder.encode(JSON.stringify(petData));
        
        // Escribir en NFC (imagen + datos)
        const ndef = new NDEFReader();
        await ndef.write({
            records: [
                { 
                    recordType: "mime",
                    mediaType: "image/jpeg",
                    data: imageArrayBuffer
                },
                {
                    recordType: "mime",
                    mediaType: "application/json",
                    data: jsonData
                }
            ]
        });
        
        showStatus('¡Tarjeta grabada con éxito!', 'success');
    } catch (error) {
        console.error('Error NFC:', error);
        showStatus(`Error: ${error.message}`, 'error');
    }
}

// Mostrar mensajes de estado
function showStatus(message, type) {
    const statusElement = document.getElementById('nfcStatus');
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
}
