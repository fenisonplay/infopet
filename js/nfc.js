async function saveToNfc() {
    const petName = document.getElementById('petName').value;
    const ownerPhone = document.getElementById('ownerPhone').value;

    if (!petName || !ownerPhone) {
        alert("¡Completa nombre y teléfono!");
        return;
    }

    try {
        if (!('NDEFReader' in window)) {
            throw new Error("Usa Chrome en Android con NFC activado.");
        }

        // Mensaje de estado
        const statusDiv = document.getElementById('nfcStatus');
        statusDiv.textContent = "Acerca el tag NFC y NO LO MUEVAS...";
        statusDiv.style.color = "blue";

        // Intento de escritura con timeout
        const nfc = new NDEFReader();
        await Promise.race([
            nfc.write({
                records: [{ 
                    recordType: "text",
                    data: `Nombre:${petName}|Teléfono:${ownerPhone}`
                }]
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Tiempo agotado. Mantén el tag cerca por 3 segundos.")), 3000)
            )
        ]);

        statusDiv.textContent = "¡Datos guardados! ✔️";
        statusDiv.style.color = "green";

    } catch (error) {
        const errorMsg = `Error: ${error.message}. Asegúrate de:
            - NFC activado
            - Tag cerca y quieto
            - Chrome actualizado`;
        alert(errorMsg);
        console.error(error);
    }
}
