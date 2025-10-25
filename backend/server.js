import express from "express";
import cors from "cors";
import axios from "axios";
import testRoutes from "./routes/test.js";
import admin from 'firebase-admin';
import { createRequire } from 'module'; // Importa createRequire
import { verifyToken, isAdmin } from './middlewares/authMiddleware.js'; // <-- IMPORTA

const require = createRequire(import.meta.url);
const serviceAccount = require('./config/motiv8-b965b-firebase-adminsdk-fbsvc-4489c9f191.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Ahora puedes obtener las instancias de Firestore y Auth aquí o en tus rutas
export const db = admin.firestore();
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

app.use("/api", testRoutes);

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

//CAMBIAR PARA GUARDAR LOS DATOS DE LAS ACTIVIDADES 
app.post('/missions', verifyToken, isAdmin, async (req, res) => {
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

app.put('/missions/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, type, targetValue, unit, reward, startDate, endDate } = req.body;

  // Validación básica (igual que en tu POST)
  if (!name || !description || !type || !targetValue || !unit || !reward) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para la misión.' });
  }

  try {
    const missionRef = db.collection('missions').doc(id);

    // Prepara los datos actualizados
    // (Reutilizamos la misma lógica de conversión de fechas que en tu POST)
    const updatedMissionData = {
      name,
      description,
      type,
      targetValue: Number(targetValue),
      unit,
      reward: Number(reward),
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      // No actualizamos 'createdAt' para que mantenga la fecha de creación original
    };

    // Usamos 'update' para modificar la misión sin sobrescribir el documento entero
    await missionRef.update(updatedMissionData);

    res.status(200).json({ message: 'Misión actualizada con éxito', id: id });

  } catch (error) {
    console.error('Error al actualizar misión:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar la misión' });
  }
});


// --- DELETE (Eliminar Misión) ---
// Ruta protegida, solo para admins
app.delete('/missions/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const missionRef = db.collection('missions').doc(id);

    // Elimina el documento
    await missionRef.delete();

    res.status(200).json({ message: 'Misión eliminada con éxito', id: id });

  } catch (error) {
    console.error('Error al eliminar misión:', error);
    res.status(500).json({ error: 'Error interno del servidor al eliminar la misión' });
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



app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // --- PASO 1: Crear el usuario en Firebase Authentication ---
    // Esto crea el registro de email/contraseña
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    // --- PASO 2: Crear el documento en Firestore ---
    // Aquí es donde defines el rol por defecto
    const newUserDoc = {
      email: userRecord.email,
      name: userRecord.displayName || 'Sin Nombre',
      role: 'user', // <--- ¡AQUÍ ESTÁ LA MAGIA!
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Usamos el UID del usuario de Auth como ID del documento en Firestore
    await db.collection('users').doc(userRecord.uid).set(newUserDoc);

    // Enviamos una respuesta exitosa
    res.status(201).send({
      uid: userRecord.uid,
      email: userRecord.email,
      role: 'user'
    });

    navigate('/login');

  } catch (error) {
    // Manejar errores comunes (ej. email ya existe)
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).send('El correo electrónico ya está en uso.');
    }
    // Manejar otros posibles errores
    if (error.code === 'auth/invalid-password') {
      return res.status(400).send('La contraseña es demasiado débil.');
    }

    console.error("Error en el registro:", error);
    res.status(500).send('Error al registrar el usuario.');
  }
});
//API FIREBASE

app.post('/activities', async (req, res) => {
  const { activities } = req.body;
  console.log("Actividades recibidas en backend:", activities);
  if (!activities || !Array.isArray(activities)) {
    return res.status(400).json({ error: 'Formato de actividades inválido.' });
  }

  try {
    const batch = db.batch();
    activities.forEach(activity => {
      console.log("Preparando documento:", activity);
      const docRef = db.collection('activities').doc(); // crea un nuevo documento
      batch.set(docRef, {
        ...activity,

        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    console.log("Batch commit ejecutado correctamente");
    res.status(201).json({ message: 'Actividades guardadas exitosamente.' });
  } catch (error) {
    console.error('Error al guardar actividades:', error);
    res.status(500).json({ error: 'Error interno al guardar actividades.' });
  }

});


//API FIREBASE

//API STRAVA

app.get('/api/auth/me', verifyToken, (req, res) => {
  // Gracias al middleware 'verifyToken', req.user ya tiene
  // el uid, email y (lo más importante) el 'role'.

  if (!req.user) {
    return res.status(404).send('Usuario no encontrado');
  }

  // Simplemente devolvemos el objeto 'user' que el middleware adjuntó
  res.status(200).json(req.user);
});
// FUNCIONES TEAMS
app.post('/teams', async (req, res) => {
  const { nombreEquipo, tipoDeporte, descripcion, creadoPor } = req.body;

  if (!nombreEquipo || !tipoDeporte || !descripcion || !creadoPor) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }

  try {
    const teamsRef = db.collection('teams');
    const snapshot = await teamsRef.get();

    const newTeam = {
      nombreEquipo,
      tipoDeporte,
      descripcion,
      creadoPor, // 👈 Guardamos el UID directamente
      insignias: 0,
      distanciaClub: 0,
      tiempoEnRuta: 0,
      usuarios: 1,
      misionesCompletadas: 0,
      miembros: [creadoPor],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await teamsRef.add(newTeam);
    res.status(201).json({ message: 'Equipo creado con éxito', id: docRef.id });
  } catch (error) {
    console.error('Error al crear equipo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


app.get('/teams', async (req, res) => {
  try {
    const snapshot = await db.collection('teams').get();
    const teams = [];

    snapshot.forEach(doc => {
      teams.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(teams);
  } catch (error) {
    console.error('Error al obtener equipos:', error);
    res.status(500).json({ error: 'Error al obtener equipos' });
  }
});

app.post('/teams/:id/join', async (req, res) => {
  const { uid } = req.body;
  const teamId = req.params.id;

  if (!uid) {
    return res.status(400).json({ error: 'Falta el UID del usuario.' });
  }

  try {
    const teamRef = db.collection('teams').doc(teamId);
    const teamDoc = await teamRef.get();

    if (!teamDoc.exists) {
      return res.status(404).json({ error: 'Equipo no encontrado.' });
    }

    const teamData = teamDoc.data();
    const miembros = teamData.miembros || [];

    if (miembros.includes(uid)) {
      return res.status(400).json({ error: 'Ya eres parte del equipo.' });
    }

    miembros.push(uid);


    await teamRef.update({
      miembros,
      usuarios: miembros.length
    });


    res.status(200).json({ message: 'Te uniste al equipo con éxito.' });
  } catch (error) {
    console.error('Error al unirse al equipo:', error);
    res.status(500).json({ error: 'Error interno al unirse al equipo.' });
  }
});


app.get('/teams/user/:uid', async (req, res) => {
  const { uid } = req.params;

  try {
    const snapshot = await db.collection('teams')
      .where('miembros', 'array-contains', uid)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'No estás en ningún equipo.' });
    }

    const teams = [];
    snapshot.forEach(doc => {
      teams.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(teams[0]); // Asumimos que el usuario está en un solo equipo
  } catch (error) {
    console.error('Error al obtener equipo del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});


app.post('/teams/members', async (req, res) => {
  const { uids } = req.body;

  if (!uids || !Array.isArray(uids)) {
    return res.status(400).json({ error: 'Lista de UIDs inválida.' });
  }

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where(admin.firestore.FieldPath.documentId(), 'in', uids).get();

    const members = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      members.push({
        uid: doc.id,
        name: data.name || 'Sin nombre',
        email: data.email || ''
      });
    });

    res.status(200).json(members);
  } catch (error) {
    console.error('Error al obtener miembros:', error);
    res.status(500).json({ error: 'Error interno al obtener miembros.' });
  }
});

//FUNCIONES TEAMS

app.listen(PORT, () => {
  console.log(`✅ SV corriendo en http://localhost:${PORT}`);
});