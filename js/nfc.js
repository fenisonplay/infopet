// Escritura NFC (para dueños)
async function saveToNfc() {
    const petName = document.getElementById('petName').value;
    const ownerPhone = document.getElementById('ownerPhone').value;

    if (!petName || !ownerPhone) {
        alert("¡Completa todos los campos!");
        return;
    }

    try {
        if (!('NDEFReader' in window)) {
            throw new Error("NFC no soportado. Usa Chrome en Android.");
        }

        const nfc = new NDEFReader();
        await nfc.write({
            records: [{ 
                recordType: "text",
                data: `Nombre: ${petName}|Teléfono: ${ownerPhone}`
            }]
        });
        alert("¡Datos guardados en el NFC!");
    } catch (error) {
        alert("Error: " + error.message);
    }
}

// Lectura NFC (para quien encuentre al perro)
async function readFromNfc() {
    try {
        if (!('NDEFReader' in window)) return;

        const nfc = new NDEFReader();
        await nfc.scan();
        nfc.onreading = event => {
            const decoder = new TextDecoder();
            for (const record of event.message.records) {
                const data = decoder.decode(record.data);
                document.getElementById('petInfo').innerText = data;
            }
        };
    } catch (error) {
        console.error("Error NFC:", error);
    }
}
