// ======================
// 1. ESCRITURA NFC (para dueños)
// ======================
async function saveToNfc(petData) {
    try {
        // Verificar soporte NFC
        if (!('NDEFReader' in window)) {
            throw new Error("NFC no soportado en este navegador");
        }

        const nfc = new NDEFReader();
        
        // Formatear datos como texto plano (optimizado para espacio)
        const nfcData = [
            petData.name,
            petData.owner,
            petData.phone,
            petData.medical || "Sin alergias"
        ].join('|'); // Usamos "|" como separador

        // Escribir en el NFC
        await nfc.write({
            records: [{ 
                recordType: "text",
                data: nfcData 
            }]
        });

        return { success: true, message: "✅ Datos guardados en el NFC!" };
        
    } catch (error) {
        return { 
            success: false, 
            message: `❌ Error: ${error.message}` 
        };
    }
}

// ======================
// 2. LECTURA NFC (para quien encuentre al perro)
// ======================
async function readFromNfc() {
    try {
        if (!('NDEFReader' in window)) {
            throw new Error("NFC no soportado");
        }

        const nfc = new NDEFReader();
        let nfcData = null;

        // Escanear NFC
        await nfc.scan();
        nfc.onreading = event => {
            const decoder = new TextDecoder();
            for (const record of event.message.records) {
                if (record.recordType === "text") {
                    // Convertir datos (ej: "Max|Juan|+123456|Alergia a X")
                    const dataParts = decoder.decode(record.data).split('|');
                    nfcData = {
                        name: dataParts[0],
                        owner: dataParts[1],
                        phone: dataParts[2],
                        medical: dataParts[3] || "Sin info médica"
                    };
                }
            }
        };

        return { success: true, data: nfcData };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ======================
// 3. Funciones para mostrar resultados
// ======================
function showNfcStatus(message, isSuccess) {
    const statusDiv = document.getElementById('nfc-status');
    statusDiv.textContent = message;
    statusDiv.className = isSuccess ? 'status success' : 'status error';
    statusDiv.style.display = 'block';
}