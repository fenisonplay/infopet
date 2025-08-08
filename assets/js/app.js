// =============================================
// CONFIGURACIÓN INICIAL
// =============================================
const NFC_CONFIG = {
  MAX_RETRIES: 3,                // Intentos máximos
  TIMEOUT: 25000,                // 25 segundos timeout
  MAX_DATA_SIZE: 4000            // 4KB máximo
};

let appState = {
  isWriting: false,
  retryCount: 0,
  lastError: null
};

let petData = {}; // Almacena datos de la mascota

// =============================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// =============================================
document.addEventListener('DOMContentLoaded', function() {
  // Verificar compatibilidad NFC
  if (!isNFCSupported()) {
    showStatus('⚠️ NFC no disponible en este dispositivo', 'warning');
    document.getElementById('writeNfcBtn').disabled = true;
    return;
  }

  // Eventos
  document.getElementById('generateBtn').addEventListener('click', generatePetCard);
  document.getElementById('writeNfcBtn').addEventListener('click', handleWriteNfc);
  document.getElementById('nfcHelpBtn').addEventListener('click', showNfcHelp);
});

// =============================================
// FUNCIONES PRINCIPALES
// =============================================

/**
 * Genera la tarjeta visual y prepara los datos
 */
async function generatePetCard() {
  if (!validateForm()) return;

  // Recoger datos del formulario
  petData = {
    name: sanitizeInput(document.getElementById('petName').value),
    owner: sanitizeInput(document.getElementById('ownerName').value),
    phone: sanitizeInput(document.getElementById('ownerPhone').value),
    medical: sanitizeInput(document.getElementById('medicalInfo').value),
    age: document.getElementById('petAge').value || '?',
    breed: document.getElementById('petBreed').value || 'Sin raza'
  };

  // Mostrar previsualización
  updatePreview();
  document.getElementById('previewSection').style.display = 'block';
  showStatus('📝 Tarjeta generada. Lista para grabar NFC', 'info');
}

/**
 * Maneja el proceso completo de escritura NFC
 */
async function handleWriteNfc() {
  if (appState.isWriting) return;
  if (!validatePetData()) {
    showStatus('❌ Completa los campos requeridos', 'error');
    return;
  }

  // Configurar estado
  appState.isWriting = true;
  appState.retryCount = 0;
  appState.lastError = null;
  disableUI(true);

  try {
    await writeWithRetry();
  } catch (error) {
    handleNfcError(error);
  } finally {
    disableUI(false);
    appState.isWriting = false;
  }
}

// =============================================
// FUNCIONES NFC (CORE)
// =============================================

/**
 * Intenta escribir con reintentos automáticos
 */
async function writeWithRetry() {
  while (appState.retryCount < NFC_CONFIG.MAX_RETRIES) {
    appState.retryCount++;
    showStatus(`🔄 Intento ${appState.retryCount} de ${NFC_CONFIG.MAX_RETRIES}`, 'info');

    try {
      await attemptNfcWrite();
      showStatus('✅ ¡Grabación exitosa!', 'success');
      return;
    } catch (error) {
      appState.lastError = error;
      console.error(`Intento ${appState.retryCount} fallido:`, error);
      
      if (appState.retryCount < NFC_CONFIG.MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1s
      }
    }
  }
  throw appState.lastError;
}

/**
 * Intento único de escritura NFC
 */
async function attemptNfcWrite() {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), NFC_CONFIG.TIMEOUT);

  try {
    const ndef = new NDEFReader();
    const records = [
      createTextRecord(),  // Datos en formato texto simple
      createUrlRecord()   // URL de respaldo
    ];

    showStatus('📱 Acerca el tag NFC ahora...', 'info');
    await ndef.write({ records }, { signal: abortController.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Crea un registro de texto optimizado
 */
function createTextRecord() {
  const textData = `INFOPET|${petData.name}|${petData.owner}|${petData.phone}|${petData.medical || 'Sin info'}`;
  return {
    recordType: "text",
    data: textData,
    lang: "es"
  };
}

/**
 * Crea un registro URL de respaldo
 */
function createUrlRecord() {
  return {
    recordType: "url",
    data: "https://infopet.example.com/nfc"
  };
}

// =============================================
// FUNCIONES AUXILIARES
// =============================================

function isNFCSupported() {
  return 'NDEFReader' in window && 
         navigator.userAgent.match(/Android.*Chrome\//i);
}

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

function validatePetData() {
  return petData?.name && petData?.owner && petData?.phone;
}

function sanitizeInput(text) {
  return text.trim().substring(0, 50); // Limita longitud
}

function updatePreview() {
  document.getElementById('previewName').textContent = petData.name;
  document.getElementById('previewBreedAge').textContent = `${petData.breed} • ${petData.age} años`;
  document.getElementById('previewOwner').textContent = petData.owner;
  document.getElementById('previewPhone').textContent = petData.phone;
  document.getElementById('previewMedical').textContent = petData.medical || 'Ninguna';
}

function disableUI(disabled) {
  document.getElementById('writeNfcBtn').disabled = disabled;
  document.getElementById('generateBtn').disabled = disabled;
}

function showNfcHelp() {
  alert(`🆘 AYUDA NFC:\n\n1. Usa tags NTAG213/216\n2. Mantén el tag estable\n3. Acércalo a la parte superior del teléfono\n4. Sin objetos metálicos cerca\n5. Intenta en otro dispositivo si persiste`);
}

// =============================================
// MANEJO DE ERRORES (MEJORADO)
// =============================================

function handleNfcError(error) {
  let message = 'Error desconocido';
  let details = '';

  if (error.message.includes('IO error') || error.message.includes('null')) {
    message = 'Error de comunicación NFC';
    details = '1. Prueba otro tag\n2. Reinicia el teléfono\n3. Menos interferencias';
  } else if (error.name === 'AbortError') {
    message = 'Tiempo agotado (25s)';
    details = 'Mantén el tag cerca más tiempo';
  } else if (error.message.includes('NotAllowedError')) {
    message = 'Permiso denegado';
    details = 'Acepta los permisos NFC en Chrome';
  }

  showStatus(`❌ ${message}\n${details}`, 'error');
}

function showStatus(message, type) {
  const statusElement = document.getElementById('nfcStatus');
  statusElement.innerHTML = message.replace(/\n/g, '<br>');
  statusElement.className = `status-${type}`;

  if (type === 'success') {
    setTimeout(() => statusElement.textContent = '', 5000);
  }
}
