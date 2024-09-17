const axios = require('axios');

// URL de la API de AWX
const awxApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/hosts/'; 

// Credenciales de autenticación
const username = 'segmayer';
const password = 'APACHE03.';  // La contraseña decodificada

// Función para probar la conexión
async function testApiConnection() {
  try {
    const response = await axios.get(awxApiUrl, {
      auth: {
        username: username,
        password: password
      }
    });
    
    console.log('Datos de la API de AWX:', response.data);
  } catch (error) {
    console.error('Error al conectar con la API de AWX:', error.message);
  }
}

// Ejecuta la función de prueba
testApiConnection();
