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
  if (!('NDEFReader' in window)) {
    showStatus('⚠️ NFC no soportado', 'warning');
    document.getElementById('writeNfcBtn').disabled = true;
    return;
  }

  document.getElementById('generateBtn').addEventListener('click', generatePetCard);
  document.getElementById('writeNfcBtn').addEventListener('click', writeImageToNfc);
});

// Genera tarjeta ultra ligera
async function generatePetCard() {
  if (!validateForm()) return;

  petData = {
    name: truncateText(document.getElementById('petName').value, 8),
    owner: truncateText(document.getElementById('ownerName').value, 8),
    phone: document.getElementById('ownerPhone').value.substring(0, 12),
    medical: truncateText(document.getElementById('medicalInfo').value, 16)
  };

  // Generar imagen optimizada
  let imageData;
  let quality = IMAGE_CONFIG.quality;
  
  do {
    petData.cardImage = await generateTinyCard(quality);
    imageData = await getImageBinary(petData.cardImage);
    quality -= 0.1;
  } while (imageData.byteLength > IMAGE_CONFIG.maxSize && quality > 0.2);

  if (imageData.byteLength > IMAGE_CONFIG.maxSize) {
    showStatus('❌ No se puede comprimir más', 'error');
    return;
  }

  updatePreview();
  document.getElementById('previewSection').style.display = 'block';
  showStatus(`🖼️ Imagen lista (${imageData.byteLength} bytes)`, 'success');
}

// Genera imagen JPEG ultra pequeña
async function generateTinyCard(quality) {
  const canvas = document.createElement('canvas');
  canvas.width = IMAGE_CONFIG.width;
  canvas.height = IMAGE_CONFIG.height;
  const ctx = canvas.getContext('2d');

  // Fondo blanco
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Texto minimalista
  ctx.fillStyle = '#000';
  ctx.font = '8px Arial';
  ctx.fillText('INFOPET', 2, 8);
  ctx.fillText(`M:${petData.name}`, 2, 20);
  ctx.fillText(`D:${petData.owner}`, 2, 32);
  ctx.fillText(`T:${petData.phone}`, 2, 44);
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

    showStatus('📱 Acerca tag NFC...', 'info');
    const ndef = new NDEFReader();
    await ndef.write({
      records: [{
        recordType: "mime",
        mediaType: "image/jpeg",
        data: imageData
      }]
    });
    
    showStatus('✅ Grabado!', 'success');
  } catch (error) {
    handleNfcError(error);
  } finally {
    isWriting = false;
    disableUI(false);
  }
}

// ===== Funciones Auxiliares =====
async function getImageBinary(dataUrl) {
  const blob = await fetch(dataUrl).then(r => r.blob());
  return await blob.arrayBuffer();
}

function truncateText(text, maxLength) {
  return text.substring(0, maxLength).trim();
}

function validateForm() {
  // ... (igual que en la versión anterior)
}

function updatePreview() {
  // ... (igual que en la versión anterior)
}

function handleNfcError(error) {
  // ... (igual que en la versión anterior)
}

function disableUI(disabled) {
  // ... (igual que en la versión anterior)
}

function showStatus(message, type) {
  // ... (igual que en la versión anterior)
}
