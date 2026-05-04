// Script para testear la decodificación del token JWT
// Ejecutar en la consola del navegador cuando esté logueado

console.log('=== TEST DE AUTENTICACIÓN ===');

// Obtener el token del localStorage
const token = localStorage.getItem('authToken');
console.log('Token existe:', !!token);

if (token) {
    console.log('Token completo:', token);
    
    // Decodificar manualmente el payload
    try {
        const parts = token.split('.');
        console.log('Partes del token:', parts.length);
        
        if (parts.length === 3) {
            const payload = parts[1];
            const decodedPayload = atob(payload);
            const parsedPayload = JSON.parse(decodedPayload);
            
            console.log('Payload decodificado:', parsedPayload);
            console.log('Campos disponibles:');
            Object.keys(parsedPayload).forEach(key => {
                console.log(`  - ${key}:`, parsedPayload[key], `(${typeof parsedPayload[key]})`);
            });
            
            // Buscar posibles campos de ID
            const possibleIdFields = ['id', 'userId', 'idUsuario', 'user_id', 'sub'];
            console.log('\nBúsqueda de campos de ID:');
            possibleIdFields.forEach(field => {
                if (parsedPayload[field] !== undefined) {
                    console.log(`✅ ${field}:`, parsedPayload[field], `(${typeof parsedPayload[field]})`);
                } else {
                    console.log(`❌ ${field}: no encontrado`);
                }
            });
        }
    } catch (error) {
        console.error('Error al decodificar token:', error);
    }
} else {
    console.log('❌ No hay token en localStorage');
}

console.log('=== FIN TEST ===');