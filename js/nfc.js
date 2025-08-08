async function writeToNfc() {
  try {
    // 1. Verificar soporte NFC
    if (!('NDEFReader' in window)) {
      throw new Error("Tu navegador no soporta Web NFC. Usa Chrome en Android.");
    }

    // 2. Datos mínimos de prueba (personalízalos)
    const petData = "Nombre: Max|Teléfono: +123456789";
    
    // 3. Escribir en el NFC
    const nfc = new NDEFReader();
    await nfc.write({
      records: [{ recordType: "text", data: petData }]
    });
    
    // 4. Feedback al usuario
    alert("¡Datos guardados correctamente!");
    console.log("Escritura exitosa:", petData);

  } catch (error) {
    alert("Error: " + error.message);
    console.error("Fallo en NFC:", error);
  }
}
