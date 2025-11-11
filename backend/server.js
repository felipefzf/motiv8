import express from "express";
import cors from "cors";
import axios from "axios";
import testRoutes from "./routes/test.js";
import admin from "firebase-admin";
import { createRequire } from "module"; // Importa createRequire
import { verifyToken, isAdmin } from "./middlewares/authMiddleware.js"; // <-- IMPORTA
import multer from "multer";

const require = createRequire(import.meta.url);
const serviceAccount = require("./config/motiv8-b965b-firebase-adminsdk-fbsvc-4489c9f191.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Ahora puedes obtener las instancias de Firestore y Auth aquí o en tus rutas
export const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket("gs://motiv8-b965b.appspot.com");

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173", // ¡IMPORTANTE! Asegúrate de que este sea el puerto donde corre tu frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const PORT = 5000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
});

app.use("/api", testRoutes);

// FUNCIONES login y register usuarios
// Register: Registrar un nuevo usuario
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name, region, comuna } = req.body;

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
      name: userRecord.displayName || "Sin Nombre",
      role: "user", // <--- ¡AQUÍ ESTÁ LA MAGIA!
      team_member: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      region: region,
      comuna: comuna,
    };

    // Usamos el UID del usuario de Auth como ID del documento en Firestore
    await db.collection("users").doc(userRecord.uid).set(newUserDoc);

    // 🌟 --- PASO 3: Inicializar la Colección de Estadísticas (Colección 'userStats' separada) ---

    // Enviamos una respuesta exitosa
    res.status(201).send({
      uid: userRecord.uid,
      email: userRecord.email,
      role: "user",
      team_member: false,
      region: region,
      comuna: comuna,
    });

    // navigate('/login');
  } catch (error) {
    // Manejar errores comunes (ej. email ya existe)
    if (error.code === "auth/email-already-exists") {
      return res.status(400).send("El correo electrónico ya está en uso.");
    }
    // Manejar otros posibles errores
    if (error.code === "auth/invalid-password") {
      return res.status(400).send("La contraseña es demasiado débil.");
    }

    console.error("Error en el registro:", error);
    res.status(500).send("Error al registrar el usuario.");
  }
});
// Login: Obtener información del usuario autenticado
app.get("/api/auth/me", verifyToken, (req, res) => {
  // Gracias al middleware 'verifyToken', req.user ya tiene
  // el uid, email y (lo más importante) el 'role'.

  if (!req.user) {
    return res.status(404).send("Usuario no encontrado");
  }

  // Simplemente devolvemos el objeto 'user' que el middleware adjuntó
  res.status(200).json(req.user);
});

// CRUD Misiones
// CREATE: Crear Misión
app.post("/api/missions", verifyToken, isAdmin, async (req, res) => {
  const {
    name,
    description,
    type,
    targetValue,
    unit,
    reward,
    startDate,
    endDate,
  } = req.body;

  // Validación básica (puedes añadir más validaciones)
  if (!name || !description || !type || !targetValue || !unit || !reward) {
    return res
      .status(400)
      .json({ error: "Faltan campos obligatorios para la misión." });
  }

  try {
    const newMission = {
      name,
      description,
      type,
      targetValue: Number(targetValue), // Asegurarse de que sea un número
      unit,
      reward,
      status: "active", // Estado inicial
      startDate: startDate ? new Date(startDate) : null, // Convertir a objeto Date o null
      endDate: endDate ? new Date(endDate) : null, // Convertir a objeto Date o null
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("missions").add(newMission);
    res.status(201).json({ message: "Misión creada con éxito", id: docRef.id });
  } catch (error) {
    console.error("Error al crear misión:", error);
    res
      .status(500)
      .json({ error: error.message || "Error interno del servidor" });
  }
});
// READ: Obtener todas las Misiones
app.get("/api/missions", async (req, res) => {
  try {
    const missionsRef = db.collection("missions");
    const snapshot = await missionsRef.get();

    const missions = [];
    snapshot.forEach((doc) => {
      // Convertir Timestamp de Firestore a formato ISO String o similar si es necesario
      const data = doc.data();
      if (data.createdAt && data.createdAt.toDate) {
        data.createdAt = data.createdAt.toDate().toISOString();
      }
      if (data.startDate && data.startDate.toDate) {
        data.startDate = data.startDate.toDate().toISOString().split("T")[0]; // Solo la fecha
      }
      if (data.endDate && data.endDate.toDate) {
        data.endDate = data.endDate.toDate().toISOString().split("T")[0]; // Solo la fecha
      }
      missions.push({ id: doc.id, ...data });
    });

    res.status(200).json(missions);
  } catch (error) {
    console.error("Error al obtener misiones:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al obtener misiones" });
  }
});
// UPDATE: Actualizar Misión
app.put("/api/missions/:id", verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    type,
    targetValue,
    unit,
    reward,
    startDate,
    endDate,
  } = req.body;

  // Validación básica (igual que en tu POST)
  if (!name || !description || !type || !targetValue || !unit || !reward) {
    return res
      .status(400)
      .json({ error: "Faltan campos obligatorios para la misión." });
  }

  try {
    const missionRef = db.collection("missions").doc(id);

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

    res.status(200).json({ message: "Misión actualizada con éxito", id: id });
  } catch (error) {
    console.error("Error al actualizar misión:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al actualizar la misión" });
  }
});
// DELETE: Eliminar Misión
app.delete("/api/missions/:id", verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const missionRef = db.collection("missions").doc(id);

    // Elimina el documento
    await missionRef.delete();

    res.status(200).json({ message: "Misión eliminada con éxito", id: id });
  } catch (error) {
    console.error("Error al eliminar misión:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al eliminar la misión" });
  }
});

// FUNCIONES Actividades
// Crear actividad (sólo admin)
app.post("/api/activities", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      path,
      distance,
      time,
      avg_speed,
      max_speed,
      comunaInicio,
      comunaTermino,
      regionInicio,
      regionTermino,
    } = req.body;

    if (
      !distance ||
      !time ||
      !avg_speed ||
      !max_speed ||
      !comunaInicio ||
      !comunaTermino
    ) {
      return res.status(400).send("Faltan datos de la actividad.");
    }

    // 1. Guardar actividad
    const newActivity = {
      id_user: userId,
      distance: Number(distance),
      time: Number(time),
      avg_speed: Number(avg_speed),
      max_speed: Number(max_speed),
      regionInicio: req.body.regionInicio || null,
      regionTermino: req.body.regionTermino || null,
      comunaInicio: req.body.comunaInicio || null,
      comunaTermino: req.body.comunaTermino || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("activities").add(newActivity);

    // 2. Actualizar progreso en misiones
    const userMissionRef = db.collection("user_missions").doc(userId);
    const missionDoc = await userMissionRef.get();

    let updatedMissions = [];
    if (missionDoc.exists) {
      const data = missionDoc.data();
      updatedMissions = data.missions.map((m) => {
        let progresoActual = Number(m.progressValue || 0);

        if (m.unit.toLowerCase() === "km") {
          progresoActual += Number(distance);
        } else if (m.unit.toLowerCase() === "min") {
          progresoActual += Number(time);
        }

        const completadaAhora = progresoActual >= Number(m.targetValue);

        return {
          ...m,
          progressValue: progresoActual,
          completed: completadaAhora,
        };
      });

      await userMissionRef.set({
        ...data,
        missions: updatedMissions,
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // 3. Actualizar estadísticas del usuario
    const userStatsRef = db.collection("userStats").doc(userId);
    const statsDoc = await userStatsRef.get();

    if (statsDoc.exists) {
      const stats = statsDoc.data();

      const nuevaDistancia = (stats.distanciaTotalKm || 0) + Number(distance);
      const nuevoTiempo = (stats.tiempoTotalRecorridoMin || 0) + Number(time);
      const nuevaVelocidadMax = Math.max(
        stats.velocidadMaximaKmh || 0,
        Number(max_speed)
      );
      const nuevaVelocidadPromedio =
        nuevaDistancia > 0
          ? nuevaDistancia / (nuevoTiempo / 60)
          : stats.velocidadPromedioKmh || 0;

      await userStatsRef.update({
        distanciaTotalKm: nuevaDistancia,
        tiempoTotalRecorridoMin: nuevoTiempo,
        velocidadMaximaKmh: nuevaVelocidadMax,
        velocidadPromedioKmh: nuevaVelocidadPromedio,
        ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // 4. Actualizar lugares visitados (sin duplicados)
    const userPlacesRef = db.collection("user_places").doc(userId);
    const placesDoc = await userPlacesRef.get();

    let lugaresVisitados = placesDoc.exists
      ? placesDoc.data().lugares || []
      : [];

    // Añadir comunaInicio si no existe
    if (!lugaresVisitados.includes(comunaInicio)) {
      lugaresVisitados.push(comunaInicio);
    }

    // Añadir comunaTermino si no existe
    if (!lugaresVisitados.includes(comunaTermino)) {
      lugaresVisitados.push(comunaTermino);
    }

    await userPlacesRef.set({
      lugares: lugaresVisitados,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 5. Responder al frontend
    res.status(201).json({
      activity: {
        id: docRef.id,
        id_user: userId,
        distance: Number(distance),
        time: Number(time),
        avg_speed: Number(avg_speed),
        max_speed: Number(max_speed),
        comunaInicio,
        comunaTermino,
        regionInicio,
        regionTermino,
      },
      missions: updatedMissions,
      lugaresVisitados,
    });
  } catch (error) {
    console.error("Error al guardar actividad:", error);
    res.status(500).send("Error interno al guardar la actividad.");
  }
});

//FUNCIONES Equipos
// Crear un Nuevo Equipo
app.post("/api/teams", verifyToken, async (req, res) => {
  const { team_name, sport_type, description, team_color } = req.body;
  const user = req.user;

  if (!team_name) return res.status(400).send("Nombre requerido.");
  if (user.team_member) return res.status(400).send("Ya estás en un equipo.");

  try {
    // 1. Crea el documento del equipo PRIMERO (sin la URL)
    const newTeamRef = await db.collection("teams").add({
      team_name,
      sport_type: sport_type || null,
      description: description || null,
      team_color: team_color || "#CCCCCC",
      owner_uid: user.uid,
      members: [{ uid: user.uid, role: "Líder👑" }],
      team_image_url: null, // Empezará como nulo
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 6. Actualiza el documento del usuario
    await db.collection("users").doc(user.uid).update({
      team_member: true,
      id_team: newTeamRef.id,
    });

    res.status(201).json({
      message: "Equipo creado con éxito",
      teamId: newTeamRef.id,
      team_name: team_name,
    });
  } catch (error) {
    console.error("Error al crear equipo con imagen:", error);
    res.status(500).send("Error interno al crear el equipo.");
  }
});

// Unirte a un Equipo Existente
app.post("/api/teams/:teamId/join", verifyToken, async (req, res) => {
  const { teamId } = req.params;
  const user = req.user;

  if (user.team_member) {
    return res
      .status(400)
      .send("Ya perteneces a un equipo. Debes salir primero.");
  }

  try {
    const teamRef = db.collection("teams").doc(teamId);
    const userRef = db.collection("users").doc(user.uid);

    // Use a transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      const teamDoc = await transaction.get(teamRef);
      if (!teamDoc.exists) {
        throw new Error("Team not found."); // This specific error message will be sent to the client
      }

      // Update team: Add user UID to the members array
      transaction.update(teamRef, {
        members: admin.firestore.FieldValue.arrayUnion({
          uid: user.uid,
          role: "Miembro",
        }),
      });

      // Update user: Set teamMember to true and store teamId
      transaction.update(userRef, {
        team_member: true,
        id_team: teamId,
      });
    });

    res.status(200).send("Te has unido al equipo correctamente.");
  } catch (error) {
    console.error("Error joining team:", error);
    // Send specific error messages (like "Team not found") or a generic one
    res
      .status(500)
      .send(error.message || "Internal server error while joining team.");
  }
});

// Obtener Equipos Disponibles (Equipos a los que el usuario no pertenece)
// In server.js

app.get("/api/teams/available", verifyToken, async (req, res) => {
  const userId = req.user.uid;

  try {
    const teamsRef = db.collection("teams");
    const snapshot = await teamsRef.get();

    const availableTeams = [];
    // We might need member names later, so let's fetch all users once
    const allUsersSnapshot = await db.collection("users").get();
    const usersMap = new Map();
    allUsersSnapshot.forEach((doc) =>
      usersMap.set(doc.id, doc.data().name || "Usuario sin nombre")
    );

    snapshot.forEach((doc) => {
      const teamData = doc.data();
      // Only include teams where the current user is NOT a member
      if (teamData.members && !teamData.members.includes(userId)) {
        // Map member UIDs to names
        const memberDetails = teamData.members.map((uid) => ({
          uid: uid,
          name: usersMap.get(uid) || "Usuario desconocido",
        }));

        availableTeams.push({
          id: doc.id,
          team_name: teamData.team_name,
          description: teamData.description || "Sin descripción", // Add description
          sport_type: teamData.sport_type || "No especificado", // Add sport_type
          member_count: teamData.members.length,
          members: memberDetails, // Add member details array
        });
      }
    });

    res.status(200).json(availableTeams);
  } catch (error) {
    console.error("Error al obtener equipos disponibles:", error);
    res.status(500).send("Error interno al buscar equipos.");
  }
});

// Obtener Información sobre el Equipo al que Pertenece el Usuario
// app.get('/api/teams/my-team', verifyToken, async (req, res) => {
//   const user = req.user;

//   if (!user.team_member) {
//     // If the middleware provided up-to-date info, this user isn't in a team
//     return res.status(404).send('You do not belong to any team.');
//   }

//   try {
//     // Option 1: If you stored teamId on the user document (recommended)
//     if (user.id_team) {
//         const teamDoc = await db.collection('teams').doc(user.id_team).get();
//         if (teamDoc.exists) {
//             // Verify the user is still listed as a member in the team document for consistency
//             const teamData = teamDoc.data();
//             const userIsMember = teamData.members.find(member => member.uid === user.uid);
//             if (teamData.members && userIsMember) {
//                 const memberDetails = [];
//                 if (teamData.members && teamData.members.length > 0) {
//                   // Create an array of promises to fetch each user document
//                   const memberPromises = teamData.members.map(member =>
//                     db.collection('users').doc(member.uid).get()
//                   );
//                   // Wait for all fetches to complete
//                   const memberDocs = await Promise.all(memberPromises);

//                   // Extract the data we need (id and name)
//                   memberDocs.forEach(memberDoc => {
//                     if (memberDoc.exists) {
//                       // Get the 'name' field from the user document
//                       memberDetails.push({
//                         uid: memberDoc.id,
//                         name: memberDoc.data().name || 'Usuario sin nombre', // Use the 'name' field
//                         role: memberDoc.data().role || 'Member'
//                       });
//                     } else {
//                       // Handle case where a member document might be missing
//                       memberDetails.push({ uid: memberDoc.id, name: 'Usuario no encontrado' });
//                     }
//                   });
//                 }
//                 return res.status(200).json({ id: teamDoc.id, ...teamData, members: memberDetails });
//             } else {
//                  // Data inconsistency: User thinks they are in a team, but team doesn't list them. Fix user doc.
//                  await db.collection('users').doc(user.uid).update({ team_member: false, id_team: admin.firestore.FieldValue.delete() });
//                  return res.status(404).send('Team data inconsistent. Your membership status has been corrected. Please try joining a team again.');
//             }
//         } else {
//             // Data inconsistency: User has a teamId for a non-existent team. Fix user doc.
//             await db.collection('users').doc(user.uid).update({ team_member: false, id_team: admin.firestore.FieldValue.delete() });
//             return res.status(404).send('The team associated with your account no longer exists. Your membership status has been corrected.');
//         }
//     } else {
//         // Option 2: Fallback query if teamId is not on the user doc (less efficient)
//         // This case indicates data inconsistency if user.teamMember was true
//         const teamsRef = db.collection('teams');
//         const querySnapshot = await teamsRef.where('members', 'array-contains', user.uid).limit(1).get();

//         if (querySnapshot.empty) {
//             // Fix user doc inconsistency
//             await db.collection('users').doc(user.uid).update({ team_member: false, id_team: admin.firestore.FieldValue.delete() });
//             return res.status(404).send('Could not find your team (data corrected). Try joining again.');
//         }

//         const teamDoc = querySnapshot.docs[0];
//         const teamData = teamDoc.data();

//         const memberDetails = [];
//         if (teamData.members && teamData.members.length > 0) {
//           const memberPromises = teamData.members.map(member =>
//             db.collection('users').doc(member.uid).get()
//           );
//           const memberDocs = await Promise.all(memberPromises);
//           memberDocs.forEach(memberDoc => {
//             if (memberDoc.exists) {
//               memberDetails.push({
//                 uid: memberDoc.id,
//                 name: memberDoc.data().name || 'Usuario sin nombre',
//                 role: member.role
//               });
//             } else {
//               memberDetails.push({ uid: memberDoc.id, name: 'Usuario no encontrado' });
//             }
//           });
//         }

//         // Optionally update the user doc with the found teamId now
//         //  await db.collection('users').doc(user.uid).update({ id_team: teamDoc.id });
//         return res.status(200).json({ id: teamDoc.id, ...teamData, members: memberDetails });
//     }

//   } catch (error) {
//     console.error("Error fetching user's team:", error);
//     res.status(500).send('Internal server error while fetching your team.');
//   }
// });

// En server.js

app.get("/api/teams/my-team", verifyToken, async (req, res) => {
  const user = req.user;

  // (Usando tus nombres de campo: team_member, id_team)
  if (!user.team_member || !user.id_team) {
    return res.status(404).send("No perteneces a ningún equipo.");
  }

  const teamId = user.id_team;

  try {
    const teamDoc = await db.collection("teams").doc(teamId).get();

    if (teamDoc.exists) {
      const teamData = teamDoc.data();

      // Verifica consistencia (usando .find() para el array de objetos)
      const userIsMember = teamData.members.find(
        (member) => member.uid === user.uid
      );

      if (teamData.members && userIsMember) {
        // --- Bloque para Obtener Nombres ---
        const memberDetails = [];
        if (teamData.members && teamData.members.length > 0) {
          // Asegúrate de que tu objeto member se llame 'uid' aquí
          const memberPromises = teamData.members.map((member) =>
            db.collection("users").doc(member.uid).get()
          );

          const memberDocs = await Promise.all(memberPromises);

          // ¡BLOQUE CORREGIDO!
          memberDocs.forEach((memberDoc) => {
            if (memberDoc.exists) {
              const originalMember = teamData.members.find(
                (m) => m.uid === memberDoc.id
              );
              const role = originalMember ? originalMember.role : "Miembro"; // Rol por defecto
              memberDetails.push({
                uid: memberDoc.id,
                name: memberDoc.data().name || "Usuario sin nombre",
                role: role,
              });
            } else {
              // ¡Usa 'memberDoc.id', no 'member.id'!
              memberDetails.push({
                uid: memberDoc.id,
                name: "Usuario desconocido",
              });
            }
          });
        }
        // --- Fin del Bloque ---

        // Devuelve los datos del equipo CON los nombres
        return res.status(200).json({
          id: teamDoc.id,
          ...teamData,
          members: memberDetails, // Sobrescribe 'members' con la lista detallada
        });
      } else {
        // ... (Lógica de inconsistencia, actualiza al usuario)
        await db.collection("users").doc(user.uid).update({
          team_member: false,
          id_team: admin.firestore.FieldValue.delete(),
        });
        return res
          .status(404)
          .send(
            "Team data inconsistent. Your membership status has been corrected."
          );
      }
    } else {
      // ... (Lógica de inconsistencia, el equipo no existe)
      await db.collection("users").doc(user.uid).update({
        team_member: false,
        id_team: admin.firestore.FieldValue.delete(),
      });
      return res
        .status(404)
        .send("The team associated with your account no longer exists.");
    }
  } catch (error) {
    console.error("Error fetching user's team:", error);
    res.status(500).send("Internal server error while fetching your team.");
  }
});

// Salir de un equipo (ELIMINAR si eres el dueño)
// app.delete('/api/teams/leave', verifyToken, async (req, res) => {
//   const user = req.user; // Obtenido del verifyToken (ahora debe contener 'id_team' y 'team_member')

//   // 1. Verificar si el usuario realmente está en un equipo (usando los nuevos nombres)
//   if (!user.team_member || !user.id_team) { // <-- Cambio aquí
//     return res.status(400).send('No perteneces a ningún equipo.');
//   }

//   const teamId = user.id_team; // <-- Cambio aquí (variable local puede mantener el nombre)
//   const userId = user.uid;
//   const teamRef = db.collection('teams').doc(teamId);
//   const userRef = db.collection('users').doc(userId);

//   try {
//     // Usaremos una transacción para asegurar consistencia
//     await db.runTransaction(async (transaction) => {
//       const teamDoc = await transaction.get(teamRef);
//       if (!teamDoc.exists) {
//         // El equipo ya no existe, limpiamos el estado del usuario por si acaso
//         transaction.update(userRef, {
//           team_member: false, // <-- Cambio aquí
//           id_team: admin.firestore.FieldValue.delete() // <-- Cambio aquí
//         });
//         throw new Error("El equipo al que pertenecías ya no existe.");
//       }

//       const teamData = teamDoc.data();

//       // 2. Lógica Condicional: ¿Es el dueño? (asumiendo que 'owner_uid' sigue igual)
//       if (teamData.owner_uid === userId) {
//         // --- CASO: EL DUEÑO SE VA ---

//         // a) Borrar el documento del equipo completo
//         transaction.delete(teamRef);

//         // b) Actualizar a TODOS los MIEMBROS restantes
//         const otherMembers = teamData.members.filter(memberId => memberId !== userId);
//         otherMembers.forEach(memberId => {
//           const memberRef = db.collection('users').doc(memberId);
//           transaction.update(memberRef, {
//             team_member: false, // <-- Cambio aquí
//             id_team: admin.firestore.FieldValue.delete() // <-- Cambio aquí
//           });
//         });

//         // c) Actualizar al dueño (que se está yendo)
//         transaction.update(userRef, {
//           team_member: false, // <-- Cambio aquí
//           id_team: admin.firestore.FieldValue.delete() // <-- Cambio aquí
//         });

//       } else {
//         // --- CASO: UN MIEMBRO NORMAL SE VA ---

//         // a) Quitar al usuario del array 'members' del equipo
//         transaction.update(teamRef, {
//           members: admin.firestore.FieldValue.arrayRemove(userId)
//         });

//         // b) Actualizar solo al usuario que se está yendo
//         transaction.update(userRef, {
//           team_member: false, // <-- Cambio aquí
//           id_team: admin.firestore.FieldValue.delete() // <-- Cambio aquí
//         });
//       }
//     }); // Fin de la transacción

//     // 3. Respuesta Exitosa
//     res.status(200).send('Has salido del equipo correctamente.');

//   } catch (error) {
//     console.error("Error al salir del equipo:", error);
//     res.status(500).send(error.message || 'Error interno al salir del equipo.');
//   }
// });

app.delete("/api/teams/leave", verifyToken, async (req, res) => {
  const user = req.user; // Obtenido del verifyToken (contiene uid, id_team, team_member)

  // 1. Verificar si el usuario realmente está en un equipo
  if (!user.team_member || !user.id_team) {
    return res.status(400).send("No perteneces a ningún equipo.");
  }

  const teamId = user.id_team;
  const userId = user.uid;
  const teamRef = db.collection("teams").doc(teamId);
  const userRef = db.collection("users").doc(userId);

  try {
    // 2. Usar una transacción para asegurar que todo ocurra a la vez
    await db.runTransaction(async (transaction) => {
      const teamDoc = await transaction.get(teamRef);
      if (!teamDoc.exists) {
        // El equipo ya no existe, solo limpia al usuario
        transaction.update(userRef, {
          team_member: false,
          id_team: admin.firestore.FieldValue.delete(),
        });
        throw new Error("El equipo al que pertenecías ya no existe.");
      }

      const teamData = teamDoc.data();

      // 3. Lógica Condicional: ¿Es el dueño?
      if (teamData.owner_uid === userId) {
        // --- CASO: EL DUEÑO SE VA ---

        // a) Borrar el documento del equipo completo
        transaction.delete(teamRef);

        // b) Actualizar a TODOS los MIEMBROS restantes para quitarles el equipo
        // (Iteramos sobre los miembros EXCLUYENDO al dueño)
        const otherMembers = teamData.members.filter(
          (member) => member.uid !== userId
        );

        otherMembers.forEach((member) => {
          const memberRef = db.collection("users").doc(member.uid);
          transaction.update(memberRef, {
            team_member: false,
            id_team: admin.firestore.FieldValue.delete(),
          });
        });

        // c) Actualizar al dueño (que se está yendo)
        transaction.update(userRef, {
          team_member: false,
          id_team: admin.firestore.FieldValue.delete(),
        });
      } else {
        // --- CASO: UN MIEMBRO NORMAL SE VA ---

        // a) ¡LA CORRECCIÓN! Filtra el array 'members' para quitar al usuario
        const updatedMembers = teamData.members.filter(
          (member) => member.uid !== userId
        );

        // Sobrescribe el array 'members' con la nueva versión
        transaction.update(teamRef, {
          members: updatedMembers,
        });

        // b) Actualizar solo al usuario que se está yendo
        transaction.update(userRef, {
          team_member: false,
          id_team: admin.firestore.FieldValue.delete(),
        });
      }
    }); // Fin de la transacción

    // 4. Respuesta Exitosa
    res.status(200).send("Has salido del equipo correctamente.");
  } catch (error) {
    console.error("Error al salir del equipo:", error);
    res.status(500).send(error.message || "Error interno al salir del equipo.");
  }
});

// ASIGNAR MISIONES
// Ruta para asignar 2 misiones aleatorias al usuario
app.post("/api/user-missions/assign", verifyToken, async (req, res) => {
  const userId = req.user.uid;

  try {
    const userMissionRef = db.collection("user_missions").doc(userId);
    const doc = await userMissionRef.get();

    const currentMissions = doc.exists ? doc.data().missions : [];
    const currentIds = currentMissions.map((m) => m.id);

    // ✅ Limitar a 3 misiones activas
    if (currentMissions.length >= 3) {
      return res.status(400).send("Ya tienes 3 misiones activas.");
    }

    const snapshot = await db.collection("missions").get();
    const allMissions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const available = allMissions.filter((m) => !currentIds.includes(m.id));

    if (available.length === 0) {
      return res.status(400).send("No hay misiones nuevas disponibles.");
    }

    const nueva = available[Math.floor(Math.random() * available.length)];
    const updatedMissions = [...currentMissions, nueva];

    await userMissionRef.set({
      missions: updatedMissions,
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ missions: updatedMissions });
  } catch (error) {
    console.error("Error asignando nueva misión:", error);
    res.status(500).send("Error interno al asignar misión.");
  }
});

app.get("/api/user-missions", verifyToken, async (req, res) => {
  const userId = req.user.uid;

  try {
    const doc = await db.collection("user_missions").doc(userId).get();

    if (!doc.exists) {
      return res.status(404).send("No hay misiones asignadas.");
    }

    res.status(200).json(doc.data().missions);
  } catch (error) {
    console.error("Error obteniendo misiones:", error);
    res.status(500).send("Error interno al obtener misiones.");
  }
});

app.post("/api/user-missions/complete", verifyToken, async (req, res) => {
  const userId = req.user.uid;
  const { missionId } = req.body;

  try {
    const userMissionRef = db.collection("user_missions").doc(userId);
    const doc = await userMissionRef.get();

    if (!doc.exists) {
      return res.status(404).send("No hay misiones asignadas.");
    }

    const data = doc.data();
    const updatedMissions = data.missions.filter((m) => m.id !== missionId);

    await userMissionRef.set({
      ...data,
      missions: updatedMissions,
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ missions: updatedMissions });
  } catch (error) {
    console.error("Error completando misión:", error);
    res.status(500).send("Error interno al completar misión.");
  }
});

app.post("/api/user-missions/assign-3", verifyToken, async (req, res) => {
  const userId = req.user.uid;
  try {
    const userMissionRef = db.collection("user_missions").doc(userId);
    const doc = await userMissionRef.get();

    // ✅ Si el usuario tiene misiones activas, no permitir agregar nuevas
    if (doc.exists && doc.data().missions.length > 0) {
      return res
        .status(400)
        .send(
          "No puedes agregar nuevas misiones hasta completar todas las actuales."
        );
    }

    // Obtener todas las misiones disponibles
    const snapshot = await db.collection("missions").get();
    const allMissions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (allMissions.length < 3) {
      return res.status(400).send("No hay suficientes misiones disponibles.");
    }

    // Seleccionar 3 misiones aleatorias
    const shuffled = allMissions.sort(() => 0.5 - Math.random());
    const nuevas = shuffled.slice(0, 3).map((m) => ({
      ...m,
      progressValue: 0,
      completed: false,
    }));

    await userMissionRef.set({
      missions: nuevas,
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ missions: nuevas });
  } catch (error) {
    console.error("Error asignando 3 misiones:", error);
    res.status(500).send("Error interno al asignar misiones.");
  }
});

// ASIGNAR MISIONES

app.get("/api/users/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).send("Usuario no encontrado");
    }

    res.status(200).json(userDoc.data());
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    res.status(500).send("Error interno al obtener usuario.");
  }
});

app.post("/api/user/initStats", async (req, res) => {
  const { uid } = req.body;

  const initialStats = {
    distanciaTotalKm: 0,
    velocidadMaximaKmh: 0,
    velocidadPromedioKmh: 0,
    tiempoTotalRecorridoMin: 0,
    misionesCompletas: 0,
    insigniasGanadas: 0,
    userId: uid,
    ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await db.collection("userStats").doc(uid).set(initialStats);
    res
      .status(201)
      .send({ message: "Estadísticas inicializadas correctamente." });
  } catch (error) {
    console.error("Error creando estadísticas:", error);
    res.status(500).send({ error: "No se pudieron crear las estadísticas." });
  }
});

app.get("/api/userStats/:uid", async (req, res) => {
  const { uid } = req.params;
  const doc = await db.collection("userStats").doc(uid).get();
  if (!doc.exists) return res.status(404).send("Stats no encontradas");
  res.status(200).json(doc.data());
});

//PROGESO

app.post(
  "/api/user-missions/update-progress",
  verifyToken,
  async (req, res) => {
    const userId = req.user.uid;
    const { missionId, value, unit } = req.body; // ← ahora también recibimos la unidad

    try {
      const userMissionRef = db.collection("user_missions").doc(userId);
      const doc = await userMissionRef.get();

      if (!doc.exists) {
        return res.status(404).send("No hay misiones asignadas.");
      }

      const data = doc.data();
      const updatedMissions = data.missions.map((m) => {
        if (m.id === missionId) {
          // Verificamos que la unidad coincida
          if (m.unit !== unit) {
            return m; // No actualizamos si la unidad no coincide
          }

          const nuevoProgreso = (m.progressValue || 0) + value;
          const completada = nuevoProgreso >= m.targetValue;

          return {
            ...m,
            progressValue: nuevoProgreso,
            completed: completada,
          };
        }
        return m;
      });

      await userMissionRef.set({
        ...data,
        missions: updatedMissions,
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(200).json({ missions: updatedMissions });
    } catch (error) {
      console.error("Error actualizando progreso:", error);
      res.status(500).send("Error interno al actualizar progreso.");
    }
  }
);

app.post("/api/user-missions/claim", verifyToken, async (req, res) => {
  const userId = req.user.uid;
  const { missionId } = req.body;

  try {
    const userMissionRef = db.collection("user_missions").doc(userId);
    const doc = await userMissionRef.get();

    if (!doc.exists) return res.status(404).send("No hay misiones asignadas.");

    const data = doc.data();
    const missionToClaim = data.missions.find(
      (m) => m.id === missionId && m.completed
    );

    if (!missionToClaim) {
      return res.status(400).send("La misión no está completada o no existe.");
    }

    // Eliminar misión reclamada
    const updatedMissions = data.missions.filter((m) => m.id !== missionId);

    await userMissionRef.set({
      ...data,
      missions: updatedMissions,
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // ✅ Actualizar estadísticas del usuario (misiones completadas + puntos)
    const userStatsRef = db.collection("userStats").doc(userId);
    const statsDoc = await userStatsRef.get();

    if (statsDoc.exists) {
      const stats = statsDoc.data();
      await userStatsRef.update({
        misionesCompletas: (stats.misionesCompletas || 0) + 1,
        puntosTotales:
          (stats.puntosTotales || 0) + (missionToClaim.reward || 0),
        ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.status(200).json({ missions: updatedMissions });
  } catch (error) {
    console.error("Error reclamando recompensa:", error);
    res.status(500).send("Error interno al reclamar recompensa.");
  }
});

app.get('/api/user-locations', verifyToken, async (req, res) => {
  const userId = req.user.uid;
  try {
    const snapshot = await db.collection('activities').where('id_user', '==', userId).get();
    if (snapshot.empty) return res.status(200).json([]);

    const uniqueLocations = new Set();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.regionInicio && data.comunaInicio) {
        uniqueLocations.add(`${data.regionInicio} - ${data.comunaInicio}`);
      }
      if (data.regionTermino && data.comunaTermino) {
        uniqueLocations.add(`${data.regionTermino} - ${data.comunaTermino}`);
      }
    });

    res.status(200).json(Array.from(uniqueLocations));
  } catch (error) {
    console.error("Error obteniendo ubicaciones:", error);
    res.status(500).send("Error interno al obtener ubicaciones.");
  }
});


// --- INICIO DEL SERVIDOR ---
app.listen(PORT, () => {
  console.log(`✅ SV corriendo en http://localhost:${PORT}`);
});
