async function saveToNfc() {
    const statusDiv = document.getElementById('nfcStatus');
    statusDiv.innerHTML = "Probando NFC...";

    // 1. Verificar soporte
    if (!('NDEFReader' in window)) {
        statusDiv.innerHTML = "❌ Web NFC no está disponible. Usa <b>Chrome Android</b>.";
        return;
    }

    // 2. Simular escritura (solo para pruebas)
    try {
        const nfc = new NDEFReader();
        await nfc.write({
            records: [{ recordType: "text", data: "Prueba NFC exitosa" }]
        });
        statusDiv.innerHTML = "✅ ¡NFC funciona! Ahora prueba con datos reales.";
    } catch (error) {
        statusDiv.innerHTML = `❌ Error NFC: <b>${error.message}</b><br>
                              Asegúrate de:<br>
                              - NFC activado<br>
                              - Tag cerca de la parte superior del móvil<br>
                              - Pantalla desbloqueada`;
    }
}
