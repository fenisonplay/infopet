// ================= CONFIGURACIÓN =================
const APP_CONFIG = {
  MAX_IMAGE_SIZE: 4000, // 4KB máximo para NFC
  IMAGE_QUALITY: 0.7,   // Calidad JPEG (0.7 = 70%)
  IMAGE_WIDTH: 400,     // Ancho imagen
  IMAGE_HEIGHT: 300     // Alto imagen
};

// ================= ESTADO =================
let petData = {
  name: "",
  owner: "",
  phone: "",
  medical: "",
  age: "",
  breed: "",
  cardImage: null
};

let isWriting = false;

// ================= INICIALIZACIÓN =================
document.addEventListener('DOMContentLoaded', function() {
  // Verificar compatibilidad NFC
  if (!('NDEFReader' in window)) {
    showStatus('⚠️ NFC no soportado en este navegador', 'warning');
    document.getElementById('writeNfcBtn').disabled = true;
    return;
  }

  // Eventos
  document.getElementById('generateBtn').addEventListener('click', generatePetCard);
  document.getElementById('writeNfcBtn').addEventListener('click', writeImageToNfc);
});

// ================= FUNCIONES PRINCIPALES =================

// Genera la tarjeta visual
async function generatePetCard() {
  if (!validateForm()) return;

  // Recoger datos del formulario
  petData = {
    name: document.getElementById('petName').value.trim(),
    owner: document.getElementById('ownerName').value.trim(),
    phone: document.getElementById('ownerPhone').value.trim(),
    medical: document.getElementById('medicalInfo').value.trim(),
    age: document.getElementById('petAge').value || '?',
    breed: document.getElementById('petBreed').value || 'Sin raza'
  };

  // Generar imagen
  petData.cardImage = await generateCardImage();
  
  // Mostrar previsualización
  updatePreview();
  document.getElementById('previewSection').style.display = 'block';
  showStatus('📝 Tarjeta generada. Lista para grabar NFC', 'info');
}

// Genera la imagen JPEG
async function generateCardImage() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Configurar tamaño
  canvas.width = APP_CONFIG.IMAGE_WIDTH;
  canvas.height = APP_CONFIG.IMAGE_HEIGHT;
  
  // Diseño de la tarjeta
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Cabecera azul
  ctx.fillStyle = '#4e73df';
  ctx.fillRect(0, 0, canvas.width, 60);
  
  // Texto cabecera
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
  
  // Convertir a JPEG
  return canvas.toDataURL('image/jpeg', APP_CONFIG.IMAGE_QUALITY);
}

// Escribe SOLO la imagen en el tag NFC
async function writeImageToNfc() {
  if (isWriting) return;
  if (!petData.cardImage) {
    showStatus('❌ Primero genera la tarjeta', 'error');
    return;
  }

  isWriting = true;
  disableUI(true);
  
  try {
    showStatus('🔄 Convirtiendo imagen...', 'info');
    
    // 1. Convertir imagen a ArrayBuffer
    const imageBlob = await fetch(petData.cardImage).then(r => r.blob());
    const imageData = await imageBlob.arrayBuffer();
    
    // 2. Verificar tamaño
    if (imageData.byteLength > APP_CONFIG.MAX_IMAGE_SIZE) {
      throw new Error(`Imagen demasiado grande (${imageData.byteLength} bytes)`);
    }
    
    // 3. Escribir en NFC
    showStatus('📱 Acerca el tag NFC ahora...', 'info');
    const ndef = new NDEFReader();
    
    await ndef.write({
      records: [{
        recordType: "mime",
        mediaType: "image/jpeg",
        data: imageData
      }]
    });
    
    showStatus('✅ ¡Imagen grabada con éxito!', 'success');
    
  } catch (error) {
    handleNfcError(error);
  } finally {
    isWriting = false;
    disableUI(false);
  }
}

// ================= FUNCIONES AUXILIARES =================

// Valida el formulario
function validateForm() {
  const requiredFields = ['petName', 'ownerName', 'ownerPhone'];
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
    showStatus('❌ Completa los campos requeridos', 'error');
  }

  return isValid;
}

// Actualiza la previsualización
function updatePreview() {
  document.getElementById('previewName').textContent = petData.name;
  document.getElementById('previewBreedAge').textContent = 
    `${petData.breed} • ${petData.age} años`;
  document.getElementById('previewOwner').textContent = petData.owner;
  document.getElementById('previewPhone').textContent = petData.phone;
  document.getElementById('previewMedical').textContent = petData.medical || 'Ninguna';
  document.getElementById('previewImage').src = petData.cardImage;
}

// Maneja errores NFC
function handleNfcError(error) {
  console.error("Error NFC:", error);
  
  let message = 'Error al grabar: ';
  if (error.message.includes('IO error')) {
    message = '🔌 Error de comunicación. Prueba:\n';
    message += '1. Usa otro tag NFC\n';
    message += '2. Reinicia el teléfono\n';
    message += '3. Menos interferencias';
  } else if (error.message.includes('large')) {
    message = '📏 Imagen demasiado grande para el tag NFC';
  } else {
    message += error.message;
  }
  
  showStatus(`❌ ${message}`, 'error');
}

// Deshabilita/habilita la UI
function disableUI(disabled) {
  document.getElementById('writeNfcBtn').disabled = disabled;
  document.getElementById('generateBtn').disabled = disabled;
}

// Muestra mensajes de estado
function showStatus(message, type) {
  const statusElement = document.getElementById('nfcStatus');
  statusElement.textContent = message;
  statusElement.className = `status-${type}`;

  if (type === 'success') {
    setTimeout(() => statusElement.textContent = '', 5000);
  }
}
