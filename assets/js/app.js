// Configuración
const IMAGE_CONFIG = {
  width: 96,          // Ancho mínimo viable
  height: 64,         // Alto mínimo
  quality: 0.5,       // Calidad JPEG (0.5 = 50%)
  maxSize: 250        // 250 bytes máximo
};

// Estado
let petData = {};
let isWriting = false;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  // Verificar compatibilidad NFC
  if (!('NDEFReader' in window)) {
    showStatus('⚠️ NFC no soportado en este navegador', 'warning');
    document.getElementById('writeNfcBtn').disabled = true;
  }

  // Eventos
  document.getElementById('generateBtn').addEventListener('click', generatePetCard);
  document.getElementById('writeNfcBtn').addEventListener('click', writeImageToNfc);
});

// Función para generar la tarjeta
async function generatePetCard() {
  // Validar formulario
  if (!validateForm()) {
    showStatus('❌ Completa los campos requeridos', 'error');
    return;
  }

  // Recoger datos del formulario
  petData = {
    name: document.getElementById('petName').value.trim().substring(0, 8),
    owner: document.getElementById('ownerName').value.trim().substring(0, 8),
    phone: document.getElementById('ownerPhone').value.trim().substring(0, 12),
    medical: document.getElementById('medicalInfo').value.trim().substring(0, 16)
  };

  // Generar imagen optimizada
  let imageData;
  let quality = IMAGE_CONFIG.quality;
  let attempts = 0;
  
  do {
    attempts++;
    petData.cardImage = await generateTinyCard(quality);
    imageData = await getImageBinary(petData.cardImage);
    quality -= 0.1;
    
    if (attempts > 3) break; // Máximo 3 intentos
  } while (imageData.byteLength > IMAGE_CONFIG.maxSize && quality > 0.2);

  if (imageData.byteLength > IMAGE_CONFIG.maxSize) {
    showStatus('❌ No se puede comprimir más. Reduce el texto.', 'error');
    return;
  }

  // Mostrar resultados
  updatePreview();
  document.getElementById('previewSection').style.display = 'block';
  document.getElementById('writeNfcBtn').disabled = false;
  showStatus(`🖼️ Imagen lista (${imageData.byteLength} bytes)`, 'success');
}

// Genera imagen JPEG ultra pequeña
async function generateTinyCard(quality) {
  const canvas = document.createElement('canvas');
  canvas.width = IMAGE_CONFIG.width;
  canvas.height = IMAGE_CONFIG.height;
  const ctx = canvas.getContext('2d');

  // Fondo blanco
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Texto minimalista
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 8px Arial';
  
  // Encabezado
  ctx.fillText('INFOPET', 2, 8);
  
  // Datos
  ctx.fillText(`M:${petData.name || '-'}`, 2, 20);
  ctx.fillText(`D:${petData.owner || '-'}`, 2, 32);
  ctx.fillText(`T:${petData.phone || '-'}`, 2, 44);
  ctx.fillText(`S:${petData.medical || '-'}`, 2, 56);

  return canvas.toDataURL('image/jpeg', quality);
}

// Escribe solo la imagen en NFC
async function writeImageToNfc() {
  if (isWriting || !petData.cardImage) return;

  isWriting = true;
  disableUI(true);

  try {
    const imageData = await getImageBinary(petData.cardImage);
    
    if (imageData.byteLength > IMAGE_CONFIG.maxSize) {
      throw new Error(`Imagen muy grande (${imageData.byteLength} bytes)`);
    }

    showStatus('📱 Acerca el tag NFC al dispositivo...', 'info');
    
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

// ===== FUNCIONES AUXILIARES =====

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

  return isValid;
}

// Actualiza la previsualización
function updatePreview() {
  const previewImg = document.getElementById('previewImage');
  previewImg.src = petData.cardImage;
}

// Convierte imagen a ArrayBuffer
async function getImageBinary(dataUrl) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return await blob.arrayBuffer();
}

// Maneja errores NFC
function handleNfcError(error) {
  console.error("Error NFC:", error);
  
  let message = 'Error al grabar: ';
  if (error.message.includes('IO error')) {
    message = '🔌 Error de comunicación con el tag NFC. Prueba:';
    message += '\n1. Usar otro tag NFC';
    message += '\n2. Reiniciar el teléfono';
    message += '\n3. Menos interferencias';
  } else if (error.message.includes('large')) {
    message = '📏 La imagen es demasiado grande para el tag NFC';
  } else {
    message += error.message;
  }
  
  showStatus(`❌ ${message}`, 'error');
}

// Deshabilita/habilita la UI
function disableUI(disabled) {
  document.getElementById('generateBtn').disabled = disabled;
  document.getElementById('writeNfcBtn').disabled = disabled;
}

// Muestra mensajes de estado
function showStatus(message, type) {
  const statusElement = document.getElementById('nfcStatus');
  statusElement.textContent = message;
  statusElement.className = `status-message status-${type}`;
}
