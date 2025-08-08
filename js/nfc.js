async function saveToNfc() {
    // Validar campos obligatorios
    const requiredFields = ['petName', 'ownerName', 'ownerPhone', 'ownerAddress'];
    for (const field of requiredFields) {
        if (!document.getElementById(field).value) {
            alert(`Por favor completa el campo obligatorio: ${field.replace('owner', '').replace('pet', '')}`);
            return;
        }
    }

    // Recoger datos principales
    const petData = {
        name: document.getElementById('petName').value,
        breed: document.getElementById('petBreed').value || 'No especificado',
        owner: {
            name: document.getElementById('ownerName').value,
            phone: document.getElementById('ownerPhone').value,
            phone2: document.getElementById('ownerPhone2').value || '',
            address: document.getElementById('ownerAddress').value
        },
        contacts: []
    };

    // Recoger contactos adicionales
    document.querySelectorAll('.contact-entry').forEach(entry => {
        petData.contacts.push({
            name: entry.querySelector('.contact-name').value,
            phone: entry.querySelector('.contact-phone').value,
            relation: entry.querySelector('.contact-relation').value
        });
    });

    try {
        if (!('NDEFReader' in window)) {
            throw new Error("Usa Chrome en Android con NFC activado.");
        }

        const nfc = new NDEFReader();
        await nfc.write({
            records: [{
                recordType: "text",
                data: JSON.stringify(petData) // Guardamos todos los datos como JSON
            }]
        });

        alert("¡Datos guardados en el NFC correctamente!");
    } catch (error) {
        alert(`Error: ${error.message}`);
        console.error(error);
    }
}
