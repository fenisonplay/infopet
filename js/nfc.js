async function writeToNfc() {
    const nfcStatus = document.getElementById('nfcStatus');
    nfcStatus.textContent = "Preparando para grabar en NFC...";
    nfcStatus.style.color = "blue";
    
    try {
        // Convertir datos a formato que se puede almacenar en NFC
        const dataToWrite = JSON.stringify(petData);
        
        // Convertir el string a ArrayBuffer
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(dataToWrite);
        
        // Verificar si el navegador soporta Web NFC
        if ('NDEFReader' in window) {
            const ndef = new NDEFReader();
            
            try {
                await ndef.write({
                    records: [
                        { 
                            recordType: "mime", 
                            mediaType: "application/json", 
                            data: dataBuffer  // Usamos el ArrayBuffer aquí
                        },
                        { 
                            recordType: "url", 
                            data: "https://fenisonplay.github.io/infopet/reader.html" 
                        }
                    ]
                });
                nfcStatus.textContent = "¡Datos grabados correctamente en el chip NFC!";
                nfcStatus.style.color = "green";
            } catch (error) {
                nfcStatus.textContent = `Error al grabar: ${error.message}`;
                nfcStatus.style.color = "red";
                console.error("Error:", error);
            }
        } else {
            nfcStatus.textContent = "Web NFC no está soportado en este navegador. Prueba con Chrome para Android.";
            nfcStatus.style.color = "red";
        }
    } catch (error) {
        nfcStatus.textContent = `Error: ${error.message}`;
        nfcStatus.style.color = "red";
        console.error("Error:", error);
    }
}
