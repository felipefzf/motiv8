import express from "express";
import cors from "cors";
import axios from "axios";
// import testRoutes from "./routes/test.js";
import admin from 'firebase-admin';
import { createRequire } from 'module'; // Importa createRequire

const require = createRequire(import.meta.url);
const serviceAccount = require('./config/motiv8-b965b-firebase-adminsdk-fbsvc-4489c9f191.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Ahora puedes obtener las instancias de Firestore y Auth aquí o en tus rutas
const db = admin.firestore();
const auth = admin.auth();

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // ¡IMPORTANTE! Asegúrate de que este sea el puerto donde corre tu frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const PORT = 5000
const STRAVA_CLIENT_ID = 179868;
const STRAVA_CLIENT_SECRET = '093af90ac7d9f9c8bb34f06c32e9041a7f0f0593';

app.post('/exchange_token', async (req, res) => {
  const { code } = req.body;

  try {
    const response = await axios.post('https://www.strava.com/oauth/token', null, {
      params: {
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      },
    });

    const { access_token, refresh_token } = response.data;
    res.json({ access_token, refresh_token });
  } catch (error) {
    console.error('Error exchanging token:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
  }

  try {
    const userRecord = await auth.createUser({
      email: email,
      password: password,
    });

    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({ message: 'Usuario registrado con éxito', uid: userRecord.uid });

  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      return res.status(409).json({ error: 'El email ya está en uso.' });
    }
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

app.post('/missions', async (req, res) => {
  const { name, description, type, targetValue, unit, reward, startDate, endDate } = req.body;

  // Validación básica (puedes añadir más validaciones)
  if (!name || !description || !type || !targetValue || !unit || !reward) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para la misión.' });
  }

  try {
    const newMission = {
      name,
      description,
      type,
      targetValue: Number(targetValue), // Asegurarse de que sea un número
      unit,
      reward,
      status: 'active', // Estado inicial
      startDate: startDate ? new Date(startDate) : null, // Convertir a objeto Date o null
      endDate: endDate ? new Date(endDate) : null,     // Convertir a objeto Date o null
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('missions').add(newMission);
    res.status(201).json({ message: 'Misión creada con éxito', id: docRef.id });

  } catch (error) {
    console.error('Error al crear misión:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});
//CAMBIAR PARA GUARDAR LOS DATOS DE LAS ACTIVIDADES 
app.post('/missions', async (req, res) => {
  const { name, description, type, targetValue, unit, reward, startDate, endDate } = req.body;

  // Validación básica (puedes añadir más validaciones)
  if (!name || !description || !type || !targetValue || !unit || !reward) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para la misión.' });
  }

  try {
    const newMission = {
      name,
      description,
      type,
      targetValue: Number(targetValue), // Asegurarse de que sea un número
      unit,
      reward,
      status: 'active', // Estado inicial
      startDate: startDate ? new Date(startDate) : null, // Convertir a objeto Date o null
      endDate: endDate ? new Date(endDate) : null,     // Convertir a objeto Date o null
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('missions').add(newMission);
    res.status(201).json({ message: 'Misión creada con éxito', id: docRef.id });

  } catch (error) {
    console.error('Error al crear misión:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});
//
app.get('/missions', async (req, res) => {
  try {
    const missionsRef = db.collection('missions');
    const snapshot = await missionsRef.get();

    const missions = [];
    snapshot.forEach(doc => {
      // Convertir Timestamp de Firestore a formato ISO String o similar si es necesario
      const data = doc.data();
      if (data.createdAt && data.createdAt.toDate) {
        data.createdAt = data.createdAt.toDate().toISOString();
      }
      if (data.startDate && data.startDate.toDate) {
        data.startDate = data.startDate.toDate().toISOString().split('T')[0]; // Solo la fecha
      }
      if (data.endDate && data.endDate.toDate) {
        data.endDate = data.endDate.toDate().toISOString().split('T')[0]; // Solo la fecha
      }
      missions.push({ id: doc.id, ...data });
    });

    res.status(200).json(missions);
  } catch (error) {
    console.error('Error al obtener misiones:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener misiones' });
  }
});


// app.use("/api", testRoutes);
app.listen(PORT, () => {
  console.log(`✅ SV corriendo en http://localhost:${PORT}`);
});


//API STRAVA








