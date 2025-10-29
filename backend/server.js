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

// FUNCIONES login y register usuarios
// Register: Registrar un nuevo usuario
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
      team_member: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Usamos el UID del usuario de Auth como ID del documento en Firestore
    await db.collection('users').doc(userRecord.uid).set(newUserDoc);

    // Enviamos una respuesta exitosa
    res.status(201).send({
      uid: userRecord.uid,
      email: userRecord.email,
      role: 'user',
      team_member: false
    });


    // navigate('/login');

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
// Login: Obtener información del usuario autenticado
app.get('/api/auth/me', verifyToken, (req, res) => {
  // Gracias al middleware 'verifyToken', req.user ya tiene
  // el uid, email y (lo más importante) el 'role'.

  if (!req.user) {
    return res.status(404).send('Usuario no encontrado');
  }

  // Simplemente devolvemos el objeto 'user' que el middleware adjuntó
  res.status(200).json(req.user);
});

// CRUD Misiones
// CREATE: Crear Misión
app.post('/api/missions', verifyToken, isAdmin, async (req, res) => {
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
// READ: Obtener todas las Misiones
app.get('/api/missions', async (req, res) => {
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
// UPDATE: Actualizar Misión
app.put('/api/missions/:id', verifyToken, isAdmin, async (req, res) => {
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
// DELETE: Eliminar Misión
app.delete('/api/missions/:id', verifyToken, isAdmin, async (req, res) => {
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


// FUNCIONES Actividades
// Crear actividad (sólo admin)
app.post('/api/activities', verifyToken, isAdmin, async (req, res) => {
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


//FUNCIONES Equipos
// Crear un Nuevo Equipo
app.post('/api/teams', verifyToken, async (req, res) => {
  const { team_name } = req.body;
  const user = req.user; // From verifyToken

  if (!team_name) {
    return res.status(400).send('Team name is required.');
  }
  if (user.team_member === true) {
    return res.status(400).send('You already belong to a team. Leave your current team first.');
  }

  try {
    const newTeamRef = await db.collection('teams').add({
      team_name: team_name,
      owner_uid: user.uid,
      members: [user.uid], // Creator is the first member
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      sport_type: req.body.sport_type,
      description: req.body.description,
      created_by: user.uid,
      insignia: [],
      team_distance: 0,
      activity_time: 0,
    });

    await db.collection('users').doc(user.uid).update({
      team_member: true,
      // id_team: newTeamRef.id // Store the team ID on the user doc
    });

    res.status(201).json({
      message: 'Team created successfully',
      // id_team: newTeamRef.id,
      team_name: team_name,
      members: [user.uid]
    });

  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).send('Internal server error while creating team.');
  }
});

// Unirte a un Equipo Existente
app.post('/api/teams/:teamId/join', verifyToken, async (req, res) => {
  const { teamId } = req.params;
  const user = req.user;

  if (user.team_member) {
    return res.status(400).send('You already belong to a team. Leave your current team first.');
  }

  try {
    const teamRef = db.collection('teams').doc(teamId);
    const userRef = db.collection('users').doc(user.uid);

    // Use a transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      const teamDoc = await transaction.get(teamRef);
      if (!teamDoc.exists) {
        throw new Error("Team not found."); // This specific error message will be sent to the client
      }

      // Update team: Add user UID to the members array
      transaction.update(teamRef, {
        members: admin.firestore.FieldValue.arrayUnion(user.uid)
      });

      // Update user: Set teamMember to true and store teamId
      transaction.update(userRef, {
        team_member: true,
        id_team: teamId
      });
    });

    res.status(200).send('Successfully joined the team.');

  } catch (error) {
    console.error("Error joining team:", error);
    // Send specific error messages (like "Team not found") or a generic one
    res.status(500).send(error.message || 'Internal server error while joining team.');
  }
});

// Obtener Equipos Disponibles (Equipos a los que el usuario no pertenece)
app.get('/api/teams/available', verifyToken, async (req, res) => {
  const userId = req.user.uid;

  try {
    const teamsRef = db.collection('teams');
    const snapshot = await teamsRef.get();

    const availableTeams = [];
    snapshot.forEach(doc => {
      const teamData = doc.data();
      // Only include teams where the current user is NOT a member
      if (teamData.members && !teamData.members.includes(userId)) {
        availableTeams.push({
          id: doc.id,
          team_name: teamData.team_name,
          member_count: teamData.members.length
        });
      }
    });

    res.status(200).json(availableTeams);

  } catch (error) {
    console.error("Error fetching available teams:", error);
    res.status(500).send('Internal server error while fetching teams.');
  }
});

// Obtener Información sobre el Equipo al que Pertenece el Usuario
app.get('/api/teams/my-team', verifyToken, async (req, res) => {
  const user = req.user;

  if (!user.team_member) { 
    // If the middleware provided up-to-date info, this user isn't in a team
    return res.status(404).send('You do not belong to any team.');
  }

  try {
    // Option 1: If you stored teamId on the user document (recommended)
    if (user.id_team) {
        const teamDoc = await db.collection('teams').doc(user.id_team).get();
        if (teamDoc.exists) {
            // Verify the user is still listed as a member in the team document for consistency
            const teamData = teamDoc.data();
            if (teamData.members && teamData.members.includes(user.uid)) {
                const memberDetails = [];
                if (teamData.members && teamData.members.length > 0) {
                  // Create an array of promises to fetch each user document
                  const memberPromises = teamData.members.map(memberId =>
                    db.collection('users').doc(memberId).get()
                  );
                  // Wait for all fetches to complete
                  const memberDocs = await Promise.all(memberPromises);

                  // Extract the data we need (id and name)
                  memberDocs.forEach(memberDoc => {
                    if (memberDoc.exists) {
                      // Get the 'name' field from the user document
                      memberDetails.push({
                        uid: memberDoc.id, 
                        name: memberDoc.data().name || 'Usuario sin nombre' // Use the 'name' field
                      });
                    } else {
                      // Handle case where a member document might be missing
                      memberDetails.push({ uid: memberDoc.id, name: 'Usuario no encontrado' });
                    }
                  });
                }
                return res.status(200).json({ id: teamDoc.id, ...teamData, members: memberDetails });
            } else {
                 // Data inconsistency: User thinks they are in a team, but team doesn't list them. Fix user doc.
                 await db.collection('users').doc(user.uid).update({ team_member: false, id_team: admin.firestore.FieldValue.delete() });
                 return res.status(404).send('Team data inconsistent. Your membership status has been corrected. Please try joining a team again.');
            }
        } else {
            // Data inconsistency: User has a teamId for a non-existent team. Fix user doc.
            await db.collection('users').doc(user.uid).update({ team_member: false, id_team: admin.firestore.FieldValue.delete() });
            return res.status(404).send('The team associated with your account no longer exists. Your membership status has been corrected.');
        }
    } else {
        // Option 2: Fallback query if teamId is not on the user doc (less efficient)
        // This case indicates data inconsistency if user.teamMember was true
        const teamsRef = db.collection('teams');
        const querySnapshot = await teamsRef.where('members', 'array-contains', user.uid).limit(1).get();

        if (querySnapshot.empty) {
            // Fix user doc inconsistency
            await db.collection('users').doc(user.uid).update({ team_member: false, id_team: admin.firestore.FieldValue.delete() });
            return res.status(404).send('Could not find your team (data corrected). Try joining again.');
        }

        const teamDoc = querySnapshot.docs[0];
        const teamData = teamDoc.data();

        const memberDetails = [];
        if (teamData.members && teamData.members.length > 0) {
          const memberPromises = teamData.members.map(memberId =>
            db.collection('users').doc(memberId).get()
          );
          const memberDocs = await Promise.all(memberPromises);
          memberDocs.forEach(memberDoc => {
            if (memberDoc.exists) {
              memberDetails.push({
                uid: memberDoc.id,
                name: memberDoc.data().name || 'Usuario sin nombre'
              });
            } else {
              memberDetails.push({ uid: memberDoc.id, name: 'Usuario no encontrado' });
            }
          });
        }

        // Optionally update the user doc with the found teamId now
         await db.collection('users').doc(user.uid).update({ id_team: teamDoc.id });
        return res.status(200).json({ id: teamDoc.id, ...teamData, members: memberDetails });
    }

  } catch (error) {
    console.error("Error fetching user's team:", error);
    res.status(500).send('Internal server error while fetching your team.');
  }
});

// Salir de un equipo (ELIMINAR si eres el dueño)
app.delete('/api/teams/leave', verifyToken, async (req, res) => {
  const user = req.user; // Obtenido del verifyToken (ahora debe contener 'id_team' y 'team_member')

  // 1. Verificar si el usuario realmente está en un equipo (usando los nuevos nombres)
  if (!user.team_member || !user.id_team) { // <-- Cambio aquí
    return res.status(400).send('No perteneces a ningún equipo.');
  }

  const teamId = user.id_team; // <-- Cambio aquí (variable local puede mantener el nombre)
  const userId = user.uid;
  const teamRef = db.collection('teams').doc(teamId);
  const userRef = db.collection('users').doc(userId);

  try {
    // Usaremos una transacción para asegurar consistencia
    await db.runTransaction(async (transaction) => {
      const teamDoc = await transaction.get(teamRef);
      if (!teamDoc.exists) {
        // El equipo ya no existe, limpiamos el estado del usuario por si acaso
        transaction.update(userRef, {
          team_member: false, // <-- Cambio aquí
          id_team: admin.firestore.FieldValue.delete() // <-- Cambio aquí
        });
        throw new Error("El equipo al que pertenecías ya no existe.");
      }

      const teamData = teamDoc.data();

      // 2. Lógica Condicional: ¿Es el dueño? (asumiendo que 'owner_uid' sigue igual)
      if (teamData.owner_uid === userId) {
        // --- CASO: EL DUEÑO SE VA ---
        
        // a) Borrar el documento del equipo completo
        transaction.delete(teamRef);

        // b) Actualizar a TODOS los MIEMBROS restantes
        const otherMembers = teamData.members.filter(memberId => memberId !== userId);
        otherMembers.forEach(memberId => {
          const memberRef = db.collection('users').doc(memberId);
          transaction.update(memberRef, {
            team_member: false, // <-- Cambio aquí
            id_team: admin.firestore.FieldValue.delete() // <-- Cambio aquí
          });
        });
        
        // c) Actualizar al dueño (que se está yendo)
        transaction.update(userRef, {
          team_member: false, // <-- Cambio aquí
          id_team: admin.firestore.FieldValue.delete() // <-- Cambio aquí
        });

      } else {
        // --- CASO: UN MIEMBRO NORMAL SE VA ---

        // a) Quitar al usuario del array 'members' del equipo
        transaction.update(teamRef, {
          members: admin.firestore.FieldValue.arrayRemove(userId)
        });

        // b) Actualizar solo al usuario que se está yendo
        transaction.update(userRef, {
          team_member: false, // <-- Cambio aquí
          id_team: admin.firestore.FieldValue.delete() // <-- Cambio aquí
        });
      }
    }); // Fin de la transacción

    // 3. Respuesta Exitosa
    res.status(200).send('Has salido del equipo correctamente.');

  } catch (error) {
    console.error("Error al salir del equipo:", error);
    res.status(500).send(error.message || 'Error interno al salir del equipo.');
  }
});


// --- INICIO DEL SERVIDOR ---
app.listen(PORT, () => {
  console.log(`✅ SV corriendo en http://localhost:${PORT}`);
});