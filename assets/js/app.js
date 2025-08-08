// Configuración
const IMAGE_CONFIG = {
  width: 400,
  height: 300,
  quality: 0.7
};

// Estado
let petData = {};
let isWriting = false;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  // Verificar compatibilidad NFC
  if (!('NDEFReader' in window)) {
    showStatus('NFC no está soportado en este navegador', 'error');
    document.getElementById('writeNfcBtn').disabled = true;
  }

  // Event listeners
  document.getElementById('generateBtn').addEventListener('click', generatePetCard);
  document.getElementById('writeNfcBtn').addEventListener('click', writeNfcTag);
});

// Función principal para generar la tarjeta
function generatePetCard() {
  // Validar formulario
  if (!validateForm()) {
    return;
  }

  // Recoger datos del formulario
  petData = {
    name: document.getElementById('petName').value,
    type: document.getElementById('petType').value,
    breed: document.getElementById('petBreed').value,
    age: document.getElementById('petAge').value,
    owner: document.getElementById('ownerName').value,
    phone: document.getElementById('ownerPhone').value,
    medical: document.getElementById('medicalInfo').value
  };

  // Generar y mostrar previsualización
  generateCardImage();
  document.getElementById('nfcPreview').style.display = 'block';
  document.getElementById('writeNfcBtn').disabled = false;
  showStatus('Tarjeta generada correctamente', 'success');
}

// Función para validar el formulario
function validateForm() {
  let isValid = true;
  const requiredFields = ['petName', 'petType', 'ownerName', 'ownerPhone'];

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
    showStatus('Por favor complete todos los campos requeridos', 'error');
  }

  return isValid;
}

// Generar imagen de la tarjeta
function generateCardImage() {
  const canvas = document.getElementById('cardCanvas');
  const ctx = canvas.getContext('2d');
  
  // Configurar tamaño
  canvas.width = IMAGE_CONFIG.width;
  canvas.height = IMAGE_CONFIG.height;
  
  // Dibujar tarjeta
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Cabecera
  ctx.fillStyle = '#4e73df';
  ctx.fillRect(0, 0, canvas.width, 60);
  
  // Texto
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('InfoPet', 20, 40);
  
  // Contenido
  ctx.fillStyle = '#000000';
  ctx.font = '18px Arial';
  ctx.fillText(`Nombre: ${petData.name}`, 20, 100);
  ctx.fillText(`Dueño: ${petData.owner}`, 20, 130);
  ctx.fillText(`Contacto: ${petData.phone}`, 20, 160);
  ctx.fillText(`Info Médica: ${petData.medical || 'Ninguna'}`, 20, 190);

  // Actualizar previsualización
  updatePreview();
}

// Actualizar la vista previa
function updatePreview() {
  document.getElementById('previewName').textContent = petData.name;
  document.getElementById('previewBreed').textContent = petData.breed || 'No especificada';
  document.getElementById('previewAge').textContent = petData.age || '?';
  document.getElementById('previewOwner').textContent = petData.owner;
  document.getElementById('previewPhone').textContent = petData.phone;
  document.getElementById('previewMedical').textContent = petData.medical || 'Ninguna';
}

// Escribir en NFC
async function writeNfcTag() {
  if (isWriting || !petData) return;

  isWriting = true;
  document.getElementById('writeNfcBtn').disabled = true;
  showStatus('Preparando para grabar...', 'info');

  try {
    // Convertir canvas a blob
    const canvas = document.getElementById('cardCanvas');
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', IMAGE_CONFIG.quality));
    const arrayBuffer = await blob.arrayBuffer();

    // Escribir en NFC
    const ndef = new NDEFReader();
    await ndef.write({
      records: [{
        recordType: "mime",
        mediaType: "image/jpeg",
        data: arrayBuffer
      }]
    });

    showStatus('¡Tarjeta grabada con éxito!', 'success');
  } catch (error) {
    console.error("Error al grabar NFC:", error);
    showStatus(`Error: ${error.message}`, 'error');
  } finally {
    isWriting = false;
    document.getElementById('writeNfcBtn').disabled = false;
  }
}

// Mostrar mensajes de estado
function showStatus(message, type) {
  const statusElement = document.getElementById('nfcStatus');
  statusElement.textContent = message;
  statusElement.className = `status-message status-${type}`;
}
