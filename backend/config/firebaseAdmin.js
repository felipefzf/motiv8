// backend/src/config/firebaseAdmin.js

const admin = require('firebase-admin');
// La ruta a tu archivo de clave de servicio que descargaste
// Asegúrate de que esta ruta sea correcta y que el archivo esté protegido.
const serviceAccount = require('./motiv8-b965b-firebase-adminsdk-fbsvc-4489c9f191.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Si vas a usar Realtime Database, Cloud Storage o Cloud Messaging,
  // también puedes especificar la URL de tu base de datos o el bucket de almacenamiento aquí.
  // databaseURL: "https://<DATABASE_NAME>.firebaseio.com"
});

module.exports = admin;
