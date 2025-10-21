// backend/src/routes/users.js
const express = require('express');
const router = express.Router();
const admin = require('../config/firebaseAdmin'); // Importa el SDK de Admin inicializado

const db = admin.firestore();
const auth = admin.auth();

// Ruta POST para registrar un nuevo usuario
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
  }

  try {
    // Crea el usuario en Firebase Authentication
    const userRecord = await auth.createUser({
      email: email,
      password: password,
    });

    // Guarda información adicional del usuario en Cloud Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      createdAt: admin.firestore.FieldValue.serverTimestamp() // Timestamp del servidor
    });

    res.status(201).json({ message: 'Usuario registrado con éxito', uid: userRecord.uid });

  } catch (error) {
    // Manejo de errores específicos de Firebase Auth
    if (error.code === 'auth/email-already-in-use') {
      return res.status(409).json({ error: 'El email ya está en uso.' });
    }
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

module.exports = router;
