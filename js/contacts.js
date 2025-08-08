// Manejo de contactos adicionales
document.addEventListener('DOMContentLoaded', () => {
    const maxContacts = 5;
    let contactCount = 1;

    document.getElementById('addContact').addEventListener('click', () => {
        if (contactCount >= maxContacts) {
            alert(`Máximo ${maxContacts} contactos permitidos`);
            return;
        }

        const contactEntry = document.createElement('div');
        contactEntry.className = 'contact-entry';
        contactEntry.innerHTML = `
            <div class="form-group">
                <label>Nombre completo</label>
                <input type="text" class="contact-name">
            </div>
            <div class="form-group">
                <label>Teléfono</label>
                <input type="tel" class="contact-phone">
            </div>
            <div class="form-group">
                <label>Parentesco</label>
                <select class="contact-relation">
                    <option value="familiar">Familiar</option>
                    <option value="amigo">Amigo</option>
                    <option value="otros">Otros</option>
                </select>
            </div>
            <button type="button" class="remove-contact">Eliminar</button>
        `;

        document.getElementById('additionalContacts').appendChild(contactEntry);
        contactCount++;

        // Agregar evento al nuevo botón de eliminar
        contactEntry.querySelector('.remove-contact').addEventListener('click', () => {
            contactEntry.remove();
            contactCount--;
        });
    });
});
