/**
 * Comprime una imagen para su almacenamiento en NFC
 * @param {File} file - Archivo de imagen a comprimir
 * @param {number} [maxWidth=200] - Ancho máximo en píxeles
 * @param {number} [quality=0.7] - Calidad de compresión (0-1)
 * @returns {Promise<string>} - Imagen comprimida en base64
 */
function compressImage(file, maxWidth = 200, quality = 0.7) {
    return new Promise((resolve, reject) => {
        // Verificar que sea una imagen
        if (!file.type.match('image.*')) {
            reject(new Error('El archivo no es una imagen'));
            return;
        }

        // Crear un lector de archivos
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const img = new Image();
            
            img.onload = function() {
                // Calcular nuevo tamaño manteniendo aspect ratio
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                // Crear canvas para la compresión
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convertir a formato JPEG comprimido
                try {
                    const compressedData = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedData);
                } catch (error) {
                    reject(new Error('Error al comprimir la imagen'));
                }
            };
            
            img.onerror = function() {
                reject(new Error('Error al cargar la imagen'));
            };
            
            img.src = event.target.result;
        };
        
        reader.onerror = function() {
            reject(new Error('Error al leer el archivo'));
        };
        
        reader.readAsDataURL(file);
    });
}
