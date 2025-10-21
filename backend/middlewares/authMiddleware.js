import admin from 'firebase-admin';

// Debes importar 'db' desde tu server.js
// La forma más fácil es exportándolo desde server.js:
// Y luego importándolo aquí:
import { db } from '../server.js'; 

// Middleware 1: Verifica el token
export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('No autorizado: Se requiere token.');
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // 1. Verifica que el token sea válido con Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // 2. Busca al usuario en TU base de datos (Firestore)
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return res.status(404).send('Usuario no encontrado en la base de datos');
    }

    // 3. ¡Éxito! Adjunta los datos del usuario (incluyendo el rol) al objeto 'req'
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: userDoc.data().role // <-- ¡AQUÍ ESTÁ EL ROL!
    };

    next(); // El usuario está verificado, puede continuar

  } catch (error) {
    console.error("Error al verificar token:", error);
    return res.status(403).send('No autorizado: Token inválido.');
  }
};

// Middleware 2: Verifica si es Admin
export const isAdmin = (req, res, next) => {
  // Este middleware DEBE correr DESPUÉS de verifyToken
  if (req.user.role !== 'admin') {
    return res.status(403).send('Prohibido: Se requiere rol de Administrador.');
  }
  next(); // Es admin, puede continuar
};