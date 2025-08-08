// Objeto para almacenar los datos de la mascota
let petData = {};

// Inicialización del formulario
document.addEventListener('DOMContentLoaded', function() {
    // Manejo de la selección de imagen
    document.getElementById('petPhoto').addEventListener('change', function(e) {
        const file = e.target.files[0];
        const fileNameElement = document.getElementById('fileName');
        const imagePreview = document.getElementById('imagePreview');
        
        if (file) {
            fileNameElement.textContent = file.name;
            
            // Mostrar previsualización de la imagen
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

    // Generar tarjeta NFC
    document.getElementById('generateBtn').addEventListener('click', function() {
        // Validar campos requeridos
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
            return;
        }

        // Obtener la imagen en base64 si existe
        const photoInput = document.getElementById('petPhoto');
        let imageBase64 = '';
        
        if (photoInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imageBase64 = e.target.result;
                generatePetCard(imageBase64);
            };
            reader.readAsDataURL(photoInput.files[0]);
        } else {
            generatePetCard('');
        }
    });

    // Grabar en NFC
    document.getElementById('writeNfcBtn').addEventListener('click', async function() {
        if (!petData || Object.keys(petData).length === 0) {
            showStatus('Primero debes generar los datos de la mascota', 'error');
            return;
        }

        try {
            showStatus('Preparando para grabar en NFC...', 'info');
            
            // Verificar soporte de Web NFC
            if (!('NDEFReader' in window)) {
                throw new Error('Web NFC no está soportado en este navegador. Usa Chrome para Android.');
            }

            // Convertir datos a formato NFC
            const encoder = new TextEncoder();
            const jsonData = JSON.stringify(petData);
            const dataBuffer = encoder.encode(jsonData);

            // Escribir en NFC
            const ndef = new NDEFReader();
            await ndef.write({
                records: [
                    { 
                        recordType: "mime", 
                        mediaType: "application/json", 
                        data: dataBuffer 
                    },
                    { 
                        recordType: "url", 
                        data: "https://infopet.example.com" 
                    }
                ]
            });
            
            showStatus('¡Tarjeta grabada con éxito!', 'success');
        } catch (error) {
            console.error('Error al grabar NFC:', error);
            showStatus(`Error: ${error.message}`, 'error');
        }
    });
});

// Función para generar la tarjeta visual
function generatePetCard(imageBase64) {
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

    // Actualizar previsualización
    document.getElementById('previewName').textContent = petData.name;
    
    const breedAgeText = `${petData.breed || 'Sin raza especificada'} • ${petData.age || '?'} años`;
    document.getElementById('previewBreedAge').textContent = breedAgeText;
    
    document.getElementById('previewOwner').textContent = petData.owner;
    document.getElementById('previewPhone').textContent = petData.phone;
    document.getElementById('previewMedical').textContent = petData.medical || 'Ninguna';

    // Mostrar imagen si existe
    const cardImage = document.getElementById('cardImage');
    if (petData.image) {
        cardImage.innerHTML = `<img src="${petData.image}" alt="${petData.name}">`;
    } else {
        cardImage.innerHTML = '<i class="fas fa-paw placeholder-icon"></i>';
    }

    // Mostrar sección de previsualización
    document.getElementById('previewSection').style.display = 'block';
    window.scrollTo({
        top: document.getElementById('previewSection').offsetTop - 20,
        behavior: 'smooth'
    });
}

// Función para mostrar mensajes de estado
function showStatus(message, type) {
    const statusElement = document.getElementById('nfcStatus');
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
}