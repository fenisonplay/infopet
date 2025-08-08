/**
 * Función para escribir datos en un tag NFC
 * @param {Object} petData - Datos de la mascota a escribir
 * @returns {Promise<boolean>} - True si se escribió correctamente
 */
async function writeToNfc(petData) {
    // Verificar soporte de Web NFC
    if (!('NDEFReader' in window)) {
        throw new Error('Web NFC no está soportado en este navegador. Usa Chrome para Android.');
    }

    try {
        // Convertir los datos a JSON y luego a ArrayBuffer
        const jsonData = JSON.stringify(petData);
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(jsonData);

        // Crear instancia del lector NFC
        const ndef = new NDEFReader();

        // Mostrar diálogo de escritura NFC
        await ndef.write({
            records: [
                {
                    recordType: "mime",
                    mediaType: "application/json",
                    data: dataBuffer
                },
                {
                    recordType: "url",
                    data: "https://infopet.example.com/nfc-info"
                }
            ]
        });

        return true;
    } catch (error) {
        console.error("Error al escribir en NFC:", error);
        
        // Manejar errores específicos
        if (error.name === 'NotAllowedError') {
            throw new Error('Permiso denegado para acceder al NFC.');
        } else if (error.name === 'NotSupportedError') {
            throw new Error('El dispositivo no soporta NFC.');
        } else if (error.message.includes('write')) {
            throw new Error('Error al escribir en el tag NFC. Asegúrate de que el tag es compatible y está cerca del dispositivo.');
        } else {
            throw new Error('Error desconocido al acceder al NFC: ' + error.message);
        }
    }
}
