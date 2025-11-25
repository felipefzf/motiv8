import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import axios from "axios";
import testRoutes from "./routes/test.js";
import admin from "firebase-admin";
import { createRequire } from "module"; // Importa createRequire
import { verifyToken, isAdmin } from "./middlewares/authMiddleware.js"; // <-- IMPORTA
import multer from "multer";
import 'dotenv/config'


const require = createRequire(import.meta.url);

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  // ¡TRUCO IMPORTANTE! Las claves privadas tienen saltos de línea (\n)
  // que a veces se rompen en las variables de entorno. Esto lo arregla:
  private_key: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Ahora puedes obtener las instancias de Firestore y Auth aquí o en tus rutas
export const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket("gs://motiv8-b965b.firebasestorage.app");

const app = express();
const server = http.createServer(app); // 👈 servidor HTTP base


export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // tu frontend
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

// ✅ Socket.IO listeners
io.on("connection", (socket) => {
  console.log("Socket conectado:", socket.id);

  socket.on("joinMission", (missionId) => {
    socket.join(missionId);
    console.log(`Socket ${socket.id} se unió a la misión ${missionId}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket desconectado:", socket.id);
  });
});


app.use(express.json());
app.use(
  cors({
    origin: [
    "http://localhost:5173", 
    "https://motiv8-b965b.web.app", // <-- ¡AÑADE TU DOMINIO DE FIREBASE AQUÍ!
    "https://motiv8-b965b.firebaseapp.com" // (Añade también este por si acaso)
    ], // ¡IMPORTANTE! Asegúrate de que este sea el puerto donde corre tu frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000; // <--- OBLIGATORIO para Render

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
});

app.use("/api", testRoutes);

// FUNCIONES login y register usuarios
// Register: Registrar un nuevo usuario
app.post("/api/auth/register", upload.single("profile_image_file"), async (req, res) => {
    try {
      const { email, password, name, region, comuna, main_sport, performance } = req.body;
      const file = req.file;

      let performanceObj = {};
        if (performance) {
          try {
            performanceObj = JSON.parse(performance);
          } catch (e) {
            console.error("Error parseando performance:", e);
            // Si falla, guardamos un objeto vacío para no romper la DB
            performanceObj = {}; 
          }
        }

      // --- PASO 1: Crear el usuario en Firebase Authentication ---
      // Esto crea el registro de email/contraseña
      const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: name,
        main_sport: main_sport || "",
        performance: performanceObj || {},
      });

      let profile_image_url = null;

      if (file) {
        // Guardamos en una carpeta 'user_avatars'
        const fileName = `profile_pictures/${userRecord.uid}-${file.originalname}`;
        const blob = bucket.file(fileName);

        const blobStream = blob.createWriteStream({
          metadata: { contentType: file.mimetype },
        });

        await new Promise((resolve, reject) => {
          blobStream.on("error", (err) => reject(err));
          blobStream.on("finish", async () => {
            try {
              const [url] = await blob.getSignedUrl({
                action: "read",
                expires: "03-09-2491",
              });
              profile_image_url = url;
              resolve(url);
            } catch (err) {
              reject(new Error("Error al firmar URL."));
            }
          });
          blobStream.end(file.buffer);
        });
      }

      // --- PASO 2: Crear el documento en Firestore ---
      // Aquí es donde defines el rol por defecto
      const newUserDoc = {
        email: userRecord.email,
        name: userRecord.displayName || "Sin Nombre",
        role: "user", // <--- ¡AQUÍ ESTÁ LA MAGIA!
        team_member: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        profile_image_url: profile_image_url,
        region: region,
        comuna: comuna,
        main_sport: main_sport,
        performance: performanceObj || {},
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
        profile_image_url: profile_image_url,
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
  }
);
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

// Ruta para actualizar la foto de perfil
app.post("/api/users/avatar", verifyToken, upload.single("profileImageFile"), async (req, res) => {
    const user = req.user;
    const file = req.file;

    if (!file) {
      return res.status(400).send("No se subió ninguna imagen.");
    }

    try {
      const fileName = `profile_pictures/${user.uid}-${Date.now()}.png`; // Nombre único con timestamp
      const blob = bucket.file(fileName);

      const blobStream = blob.createWriteStream({
        metadata: { contentType: file.mimetype },
      });

      await new Promise((resolve, reject) => {
        blobStream.on("error", (err) => reject(err));
        blobStream.on("finish", async () => {
          try {
            // Generar URL firmada de larga duración
            const [url] = await blob.getSignedUrl({
              action: "read",
              expires: "03-09-2491",
            });
            resolve(url);

            // Actualizar el usuario en Firestore
            await db.collection("users").doc(user.uid).update({
              profile_image_url: url,
            });

            // Devolver la nueva URL al frontend
            res
              .status(200)
              .json({ message: "Avatar actualizado", profile_image_url: url });
          } catch (err) {
            reject(new Error("Error al firmar URL."));
          }
        });
        blobStream.end(file.buffer);
      });
    } catch (error) {
      console.error("Error al actualizar avatar:", error);
      res.status(500).send("Error interno al actualizar avatar.");
    }
  }
);

// Ruta para actualizar información del perfil (Texto)
app.put("/api/users/profile", verifyToken, express.json(), async (req, res) => {
  const user = req.user;
  const { name, comuna, region, main_sport } = req.body;

  // Validaciones simples
  if (!name) {
    return res.status(400).send("El nombre es obligatorio.");
  }

  try {
    // Actualizar documento en Firestore
    await db
      .collection("users")
      .doc(user.uid)
      .update({
        name: name,
        comuna: comuna || "",
        region: region || "",
        main_sport: main_sport || "",
      });

    // Devolver los datos actualizados
    res.status(200).json({
      message: "Perfil actualizado correctamente",
      user: {
        ...user, // Datos anteriores
        name,
        comuna,
        region,
        main_sport, // Datos nuevos
      },
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).send("Error interno al actualizar el perfil.");
  }
});

app.put('/api/users/goals', verifyToken, express.json(), async (req, res) => {
  const user = req.user; // Obtenido del token
  const { performance } = req.body; 

  // Validación básica
  if (!performance) {
    return res.status(400).send('Se requieren datos de rendimiento (performance).');
  }

  try {
    // Actualizamos el documento del usuario en Firestore.
    // Al pasar el objeto 'performance' directamente, Firestore lo guardará como un Mapa.
    await db.collection('users').doc(user.uid).update({
      performance: performance
    });

    console.log(`Metas actualizadas para el usuario ${user.uid}`);

    res.status(200).json({ 
      message: 'Metas actualizadas correctamente',
      performance // Devolvemos lo que guardamos para confirmar
    });

  } catch (error) {
    console.error("Error al actualizar metas:", error);
    res.status(500).send("Error interno al actualizar las metas.");
  }
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
      targetValue: Number(targetValue),
      unit,
      reward: Number(reward), // XP
      coinReward: Number(req.body.coinReward) || 0, // 👈 Nuevo campo
      status: "active",
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
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
    coinReward,
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
      reward: Number(reward),        // XP
      coinReward: Number(coinReward), // 👈 Coins
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


// FUNCIONES Actividades:
// Guardar  nueva actividad y actualizar estadísticas
app.post('/api/activities', verifyToken, express.json(), async (req, res) => {
  const user = req.user;
  
  // 1. Desestructuramos los datos que envía el frontend
  const { 
    title,
    type, 
    distance, // en km
    time,     // en segundos
    avgSpeed, 
    path,     // Array de coordenadas o GeoJSON
    startLocation, 
    endLocation, 
    date 
  } = req.body;

  // 2. Validaciones básicas
  if (distance === undefined || time === undefined) {
    return res.status(400).send('Faltan datos obligatorios (distancia o tiempo).');
  }

  try {
    let firestorePath = [];
    
    if (Array.isArray(path) && path.length > 0) {
      // Verificamos si el primer elemento es un array (formato OSRM)
      if (Array.isArray(path[0])) {
         firestorePath = path.map(coord => ({
           lng: coord[0],
           lat: coord[1]
         }));
      } else {
         // Si ya son objetos (formato manual), lo dejamos igual
         firestorePath = path;
      }
    }
    // 3. Prepara el objeto de la actividad
    const newActivity = {
      title: title || 'Actividad',
      userId: user.uid, // Vinculamos la actividad al usuario
      userName: user.name || 'Usuario', // Opcional: útil para leaderboards
      type: type || 'running',
      distance: parseFloat(distance),
      time: parseInt(time),
      avgSpeed: parseFloat(avgSpeed),
      path: firestorePath || [],
      startLocation: startLocation || null,
      endLocation: endLocation || null,
      date: date || new Date().toISOString(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // 4. Usamos un "Batch" (Lote) o escritura atómica para hacer dos cosas a la vez:
    //    a) Guardar la actividad en la colección 'activities'
    //    b) Actualizar las estadísticas totales del usuario en 'users' (o 'user_stats')
    
    const batch = db.batch();

    // a) Referencia para la nueva actividad
    const activityRef = db.collection('activities').doc(); // Genera ID automático
    batch.set(activityRef, newActivity);

    // b) Referencia para las estadísticas del usuario
    // (Asumimos que guardas stats en el documento del usuario, o en una subcolección)
    // Aquí actualizaremos el documento principal del usuario en 'users'
    const userStatsRef = db.collection('users').doc(user.uid);

    batch.update(userStatsRef, {
      // Usamos FieldValue.increment para sumar sin leer primero (es atómico y seguro)
      "stats.distanciaTotalKm": admin.firestore.FieldValue.increment(parseFloat(distance)),
      "stats.tiempoTotalRecorridoMin": admin.firestore.FieldValue.increment(Math.floor(parseInt(time) / 60)),
      "stats.misionesCompletas": admin.firestore.FieldValue.increment(1), // Cuenta como 1 actividad más
      // Opcional: Actualizar última actividad
      "lastActivityDate": new Date().toISOString()
    });

    // 5. Ejecutar ambas operaciones
    await batch.commit();

    console.log(`Actividad guardada para ${user.email}: ${distance}km en ${time}s`);

    res.status(201).json({ 
      message: 'Actividad guardada exitosamente', 
      id: activityRef.id,
      ...newActivity 
    });

  } catch (error) {
    console.error("Error al guardar la actividad:", error);
    res.status(500).send(error.message || 'Error interno al procesar la actividad.');
  }
});

// Ruta para obtener el historial de actividades del usuario
app.get('/api/activities', verifyToken, async (req, res) => {
  const user = req.user;

  try {
    const snapshot = await db.collection('activities')
      .where('userId', '==', user.uid) // Filtra por usuario
      .orderBy('createdAt', 'desc')     // Ordena por fecha (más reciente primero)
      .limit(20)                        // Trae solo las últimas 20 (paginación básica)
      .get();

    if (snapshot.empty) {
      return res.status(200).json([]); // Devuelve array vacío si no hay nada
    }

    const activities = [];
    snapshot.forEach(doc => {
      activities.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(activities);

  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).send("Error al obtener el historial de actividades.");
  }
});


//FUNCIONES Equipos
// Crear un Nuevo Equipo
app.post("/api/teams", verifyToken, upload.single("teamImageFile"), async (req, res) => {
    console.log("req.file (lo que recibió multer):", req.file);
    console.log("req.body (los campos de texto):", req.body);

    const { team_name, sport_type, description, team_color, requirements } = req.body;
    const user = req.user;

    const file = req.file;

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
        requirements: requirements || {},
      });

      let teamImageUrl = null;
      if (file) {
        // 2. Sube la imagen al Storage Bucket
        const fileName = `team_logos/${newTeamRef.id}-${file.originalname}`;
        const fileUpload = bucket.file(fileName);

        await fileUpload.save(file.buffer, {
          metadata: {
            contentType: file.mimetype,
          },
        });

        // 3. Obtén la URL pública de la imagen
        await fileUpload.makePublic();
        teamImageUrl = fileUpload.publicUrl();
      }

      // 4. Actualiza el documento del equipo con la URL de la imagen
      await newTeamRef.update({
        team_image_url: teamImageUrl,
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
  }
);

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

    res.status(200).json({ message: "Te has unido al equipo correctamente." });
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

// Ruta para obtener los detalles (con nombres) de CUALQUIER equipo
app.get("/api/teams/:teamId/details", verifyToken, async (req, res) => {
  const { teamId } = req.params;

  try {
    const teamDoc = await db.collection("teams").doc(teamId).get();
    if (!teamDoc.exists) {
      return res.status(404).send("Equipo no encontrado");
    }

    const teamData = teamDoc.data();

    // --- Lógica para Obtener Nombres y Roles ---
    const memberDetails = [];
    if (teamData.members && teamData.members.length > 0) {
      const memberPromises = teamData.members.map(
        (member) => db.collection("users").doc(member.uid).get() // <-- Usa member.uid
      );

      const memberDocs = await Promise.all(memberPromises);

      memberDocs.forEach((memberDoc) => {
        if (memberDoc.exists) {
          const originalMember = teamData.members.find(
            (m) => m.uid === memberDoc.id
          );
          const role = originalMember ? originalMember.team_role : "Miembro";

          memberDetails.push({
            uid: memberDoc.id,
            name: memberDoc.data().name || "Usuario sin nombre",
            team_role: role,
          });
        } else {
          memberDetails.push({
            uid: memberDoc.id,
            name: "Usuario desconocido",
            team_role: "N/A",
          });
        }
      });
    }
    // --- Fin de la Lógica ---

    res.status(200).json({
      id: teamDoc.id,
      ...teamData,
      members: memberDetails,
    });
  } catch (error) {
    console.error("Error fetching team details:", error);
    res.status(500).send(error.message || "Error interno");
  }
});

// Salir de un equipo (ELIMINAR si eres el dueño)
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
    const mission = data.missions.find((m) => m.id === missionId);

    if (!mission) {
      return res.status(404).send("Misión no encontrada.");
    }

    // --- Eliminar misión completada del usuario actual ---
    const updatedMissions = data.missions.filter((m) => m.id !== missionId);
    await userMissionRef.set({
      ...data,
      missions: updatedMissions,
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // --- Actualizar estadísticas del usuario ---
    const userStatsRef = db.collection("userStats").doc(userId);
    const statsDoc = await userStatsRef.get();

    if (statsDoc.exists) {
      const stats = statsDoc.data();
      await userStatsRef.update({
        coins: (stats.coins || 0) + (mission.coinReward || 0),
        xp: (stats.xp || 0) + (mission.reward || 0),
        misionesCompletas: (stats.misionesCompletas || 0) + 1,
        ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // --- Emparejamiento cooperativo: marcar como completada para todos ---
    const matchRef = db.collection("mission_matches").doc(missionId);
    const matchDoc = await matchRef.get();

    if (matchDoc.exists) {
      const users = matchDoc.data().users || [];

      for (const u of users) {
        if (u.uid !== userId) {
          const otherRef = db.collection("user_missions").doc(u.uid);
          const otherDoc = await otherRef.get();

          if (otherDoc.exists) {
            const otherData = otherDoc.data();
            const otherUpdated = otherData.missions.map((m) =>
              m.id === missionId ? { ...m, completed: true } : m
            );
            await otherRef.update({ missions: otherUpdated });
          }
        }
      }

      // 🔥 Emitir evento en tiempo real
      io.to(missionId).emit("missionCompleted", { missionId });

      // ✅ Disolver emparejamiento
      await matchRef.delete();
    }

    res.status(200).json({
      missions: updatedMissions,
      coinsEarned: mission.coinReward || 0,
      xpEarned: mission.reward || 0,
    });
  } catch (error) {
    console.error("Error completando misión:", error);
    res.status(500).send("Error interno al completar misión.");
  }
});


app.post("/api/user-missions/assign-3", verifyToken, async (req, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).send("No autenticado.");

  try {
    // 1) Leer contador simple de clics
    const statsRef = db.collection("userStats").doc(userId);
    const statsDoc = await statsRef.get();
    const clicks = statsDoc.exists ? Number(statsDoc.data().assignClicks || 0) : 0;

    // 2) Si ya llegó al límite (3), no asignar y avisar al frontend
    if (clicks >= 3) {
      return res.status(200).json({
        message: "Haz completado tus misiones semanales",
        limitReached: true,
        assignClicks: clicks,
        missions: [], // no asignamos
      });
    }

    // 3) Validación opcional: evita asignar si hay misiones pendientes
    const userMissionRef = db.collection("user_missions").doc(userId);
    const userDoc = await userMissionRef.get();
    const currentData = userDoc.exists ? userDoc.data() : { missions: [] };

    if ((currentData.missions || []).length > 0) {
      return res.status(400).json({
        message: "Debes completar tus misiones actuales.",
        limitReached: false,
        assignClicks: clicks,
      });
    }

    // 4) Seleccionar 3 misiones aleatorias (tu lógica actual)
    const snapshot = await db.collection("missions").get();
    const allMissions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (allMissions.length < 3) {
      return res.status(400).send("No hay suficientes misiones disponibles.");
    }

    const shuffled = allMissions.sort(() => 0.5 - Math.random());
    const nuevas = shuffled.slice(0, 3).map((m) => ({
      ...m,
      progressValue: 0,
      completed: false,
    }));

    // 5) Guardar misiones del usuario
    await userMissionRef.set({
      missions: nuevas,
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 6) Incrementar contador y responder con estado
    const nextClicks = clicks + 1;
    await statsRef.set({ assignClicks: nextClicks }, { merge: true });

    return res.status(201).json({
      message: "Se asignaron 3 nuevas misiones",
      missions: nuevas,
      limitReached: nextClicks >= 3,
      assignClicks: nextClicks,
    });
  } catch (error) {
    console.error("Error asignando 3 misiones:", error);
    return res.status(500).send("Error interno al asignar misiones.");
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

app.post(
  "/api/users/avatar",
  verifyToken,
  upload.single("avatarFile"),
  async (req, res) => {
    try {
      const user = req.user;
      const file = req.file;
      if (!file) {
        return res.status(400).send("Archivo requerido");
      }

      const fileName = `profile/picture/${user.uid}-${Date.now()}-${
        file.originalname
      }`;
      const fileUpload = bucket.file(fileName);
      await fileUpload.save(file.buffer, {
        metadata: { contentType: file.mimetype },
      });
      await fileUpload.makePublic();
      const avatarUrl = fileUpload.publicUrl();

      await db
        .collection("users")
        .doc(user.uid)
        .update({ avatar_url: avatarUrl });

      res.status(200).json({ avatar_url: avatarUrl });
    } catch (error) {
      console.error("Error actualizando avatar:", error);
      res.status(500).send("Error interno al actualizar avatar.");
    }
  }
);

app.post("/api/user/initStats", async (req, res) => {
  const { uid } = req.body;

  const initialStats = {
    distanciaTotalKm: 0,
    velocidadMaximaKmh: 0,
    velocidadPromedioKmh: 0,
    tiempoTotalRecorridoMin: 0,
    misionesCompletas: 0,
    insigniasGanadas: 0,
    coins:0,
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
  try {
    const { uid } = req.params;
    const doc = await db.collection("userStats").doc(uid).get();
    if (!doc.exists) return res.status(404).send("Stats no encontradas");

    const stats = doc.data();
    const progreso = calcularProgresoNivel(stats.puntos || 0);

    res.status(200).json({
      ...stats,
      nivelActual: progreso.nivelActual,
      nivelSiguiente: progreso.nivelSiguiente,
      puntosParaSiguienteNivel: progreso.puntosParaSiguienteNivel,
    });
  } catch (error) {
    console.error("Error obteniendo stats:", error);
    res.status(500).send("Error interno al obtener stats");
  }
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

    // --- Eliminar misión reclamada del usuario actual ---
    const updatedMissions = data.missions.filter((m) => m.id !== missionId);
    await userMissionRef.set({
      ...data,
      missions: updatedMissions,
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // --- Recompensas ---
    const rewardPoints = missionToClaim.reward || 0;
    const rewardCoins = missionToClaim.coinReward || 0;

    // --- Actualizar stats del usuario actual ---
    const userStatsRef = db.collection("userStats").doc(userId);
    const statsDoc = await userStatsRef.get();

    let nuevosPuntos = rewardPoints;
    let nuevasCoins = rewardCoins;
    let nivelActual = 1;
    let nivelSiguiente = 2;
    let puntosParaSiguienteNivel = 1000;

    if (statsDoc.exists) {
      const stats = statsDoc.data();
      nuevosPuntos = (stats.puntos || 0) + rewardPoints;
      nuevasCoins = (stats.coins || 0) + rewardCoins;
      const progreso = calcularProgresoNivel(nuevosPuntos);
      nivelActual = progreso.nivelActual;
      nivelSiguiente = progreso.nivelSiguiente;
      puntosParaSiguienteNivel = progreso.puntosParaSiguienteNivel;

      await userStatsRef.update({
        puntos: nuevosPuntos,
        coins: nuevasCoins,
        nivelActual,
        nivelSiguiente,
        puntosParaSiguienteNivel,
        misionesCompletas: (stats.misionesCompletas || 0) + 1, // ✅ contador actualizado
        ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      const progreso = calcularProgresoNivel(nuevosPuntos);
      nivelActual = progreso.nivelActual;
      nivelSiguiente = progreso.nivelSiguiente;
      puntosParaSiguienteNivel = progreso.puntosParaSiguienteNivel;

      await userStatsRef.set({
        distanciaTotalKm: 0,
        tiempoTotalRecorridoMin: 0,
        velocidadMaximaKmh: 0,
        velocidadPromedioKmh: 0,
        coins: rewardCoins,
        insigniasGanadas: 0,
        puntos: nuevosPuntos,
        nivel: nivelActual,
        misionesCompletas: 1, // ✅ inicializado en 1
        ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // --- Emparejamiento cooperativo ---
    const matchRef = db.collection("mission_matches").doc(missionId);
    const matchDoc = await matchRef.get();

    if (matchDoc.exists) {
      const users = matchDoc.data().users || [];

      for (const u of users) {
        if (u.uid !== userId) {
          const otherMissionRef = db.collection("user_missions").doc(u.uid);
          const otherDoc = await otherMissionRef.get();

          if (otherDoc.exists) {
            const otherData = otherDoc.data();
            const otherMissions = otherData.missions.map((m) =>
              m.id === missionId ? { ...m, completed: true } : m
            );

            await otherMissionRef.update({ missions: otherMissions });
          }

          // Actualizar stats de los otros usuarios
          const otherStatsRef = db.collection("userStats").doc(u.uid);
          await otherStatsRef.update({
            puntos: admin.firestore.FieldValue.increment(rewardPoints),
            coins: admin.firestore.FieldValue.increment(rewardCoins),
            misionesCompletas: admin.firestore.FieldValue.increment(1), // ✅ también para los emparejados
            ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      // --- Disolver emparejamiento ---
      await matchRef.delete();

      // --- Emitir evento en tiempo real ---
      io.to(missionId).emit("missionCompleted", { missionId });
    }

    res.status(200).json({
      message: "Misión reclamada y completada para el grupo",
      missions: updatedMissions,
      stats: {
        puntos: nuevosPuntos,
        coins: nuevasCoins,
        nivelActual,
        nivelSiguiente,
        puntosParaSiguienteNivel,
      },
    });
  } catch (error) {
    console.error("Error reclamando recompensa:", error);
    res.status(500).send("Error interno al reclamar recompensa.");
  }
});

function calcularProgresoNivel(puntos) {
  let nivel = 1;
  let requerido = 1000;
  let incremento = 1000;

  while (puntos >= requerido) {
    nivel++;
    incremento += 500;
    requerido += incremento;
  }

  const puntosParaSiguienteNivel = requerido - puntos;
  return {
    nivelActual: nivel,
    nivelSiguiente: nivel + 1,
    puntosParaSiguienteNivel,
  };
}




app.get("/api/user-locations", verifyToken, async (req, res) => {
  const userId = req.user.uid;
  try {
    const snapshot = await db
      .collection("activities")
      .where("id_user", "==", userId)
      .get();
    if (snapshot.empty) return res.status(200).json([]);

    const uniqueLocations = new Set();
    snapshot.forEach((doc) => {
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

app.get("/api/ranking", async (req, res) => {
  try {
    const { comuna } = req.query; // opcional: filtrar por comuna

    const statsSnapshot = await db.collection("userStats").get();
    const usersSnapshot = await db.collection("users").get();

    const usersMap = new Map();
    usersSnapshot.forEach((doc) => usersMap.set(doc.id, doc.data()));

    let ranking = [];
    statsSnapshot.forEach((doc) => {
      const stats = doc.data();
      const userInfo = usersMap.get(doc.id) || {};
      ranking.push({
        uid: doc.id,
        name: userInfo.name || "Usuario",
        nivel: stats.nivelActual || stats.nivel || 1,
        distancia: stats.distanciaTotalKm || 0,
        misiones: stats.misionesCompletas || 0,
        comuna: userInfo.comuna || stats.comuna || null,
      });
    });

    // --- Filtrar por comuna si se pasa en query ---
    if (comuna) {
      ranking = ranking.filter((u) => u.comuna === comuna);
    }

    // --- Comunas disponibles (solo las que tienen usuarios) ---
    const comunasDisponibles = [
      ...new Set(ranking.filter((u) => u.comuna).map((u) => u.comuna)),
    ];

    // --- Calcular máximos ---
    const maxNivel = ranking.reduce((a, b) => (a.nivel > b.nivel ? a : b));
    const maxDistancia = ranking.reduce((a, b) =>
      a.distancia > b.distancia ? a : b
    );
    const maxMisiones = ranking.reduce((a, b) =>
      a.misiones > b.misiones ? a : b
    );

    // --- Ordenar por filtro principal (nivel por defecto) ---
    ranking.sort((a, b) => b.nivel - a.nivel);

    res.status(200).json({
      usuarios: ranking,
      comunasDisponibles,
      destacados: {
        maxNivel,
        maxDistancia,
        maxMisiones,
      },
    });
  } catch (error) {
    console.error("Error obteniendo ranking:", error);
    res.status(500).send("Error interno al obtener ranking.");
  }
});


// --- SHOP ---

app.post("/api/shop/items", verifyToken, isAdmin, async (req, res) => {
  const { name, description, price, imageUrl, type, durationMin } = req.body;

  if (!name || !description || !price || !type) {
    return res.status(400).send("Faltan campos obligatorios.");
  }

  try {
    const newItem = {
      name,
      description,
      price: Number(price),
      imageUrl: imageUrl || null,
      type,
      durationMin: durationMin || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("shop_items").add(newItem);
    res.status(201).json({ message: "Ítem creado con éxito", id: docRef.id });
  } catch (error) {
    console.error("Error creando ítem de tienda:", error);
    res.status(500).send("Error interno al crear ítem.");
  }
});

app.get("/api/shop/items", async (req, res) => {
  try {
    const snapshot = await db.collection("shop_items").get();
    const items = [];

    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(items);
  } catch (error) {
    console.error("Error obteniendo ítems de tienda:", error);
    res.status(500).send("Error interno al obtener ítems.");
  }
});

app.post("/api/shop/purchase", verifyToken, async (req, res) => {
  const userId = req.user.uid;
  const { itemName, cost } = req.body;

  try {
    const userStatsRef = db.collection("userStats").doc(userId);
    const statsDoc = await userStatsRef.get();

    if (!statsDoc.exists) {
      return res.status(404).send("No se encontraron estadísticas del usuario.");
    }

    const stats = statsDoc.data();
    const coinsActuales = stats.coins || 0;

    if (coinsActuales < cost) {
      const faltan = cost - coinsActuales;
      return res.status(400).json({
        message: `Te faltan ${faltan} coins para comprar este item`,
        coinsActuales,
      });
    }

    const nuevasCoins = coinsActuales - cost;

    await userStatsRef.update({
      coins: nuevasCoins,
      ultimaCompra: {
        item: itemName,
        fecha: admin.firestore.FieldValue.serverTimestamp(),
      },
    });

    return res.status(200).json({
      message: `Compraste este item: ${itemName}`,
      coinsRestantes: nuevasCoins,
    });
  } catch (error) {
    console.error("Error en compra:", error);
    res.status(500).send("Error interno al procesar la compra.");
  }
});

//--- MATCH
const missionGroups = {};
const missionEvents = {}; // { missionId: [ { uid, message, timestamp } ] }


// Iniciar emparejamiento
app.post("/api/match/start", verifyToken, async (req, res) => {
  const userId = req.user.uid;
  const { missionId } = req.body;

  try {
    const userStatsRef = db.collection("userStats").doc(userId);
    const statsDoc = await userStatsRef.get();
    const stats = statsDoc.exists ? statsDoc.data() : {};

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    const userInfo = userDoc.exists ? userDoc.data() : {};

    const matchRef = db.collection("mission_matches").doc(missionId);
    const matchDoc = await matchRef.get();

    let users = [];
    if (matchDoc.exists) {
      users = matchDoc.data().users || [];
    }

    // Evitar duplicados
    if (!users.find((u) => u.uid === userId)) {
      users.push({
        uid: userId,
        name: userInfo.name || "Usuario",
        nivel: stats.nivelActual || stats.nivel || 1,
      });
    }

    await matchRef.set({ missionId, users });
    res.status(200).json({ message: "Emparejamiento iniciado", users });
  } catch (error) {
    console.error("Error iniciando emparejamiento:", error);
    res.status(500).send("Error interno al iniciar emparejamiento.");
  }
});

// Detener emparejamiento
// POST /api/match/stop
app.post("/api/match/stop", async (req, res) => {
  const { missionId, uid, name } = req.body;

  // ✅ Eliminar del grupo en memoria
  if (missionGroups[missionId]) {
    missionGroups[missionId] = missionGroups[missionId].filter(u => u.uid !== uid);
  }

  // ✅ Eliminar del grupo en Firestore
  try {
    const matchRef = db.collection("mission_matches").doc(missionId);
    const matchDoc = await matchRef.get();

    if (matchDoc.exists) {
      const users = matchDoc.data().users || [];
      const updatedUsers = users.filter(u => u.uid !== uid);
      await matchRef.set({ missionId, users: updatedUsers });
    }
  } catch (err) {
    console.error("Error eliminando usuario de Firestore:", err);
  }

  // ✅ Registrar evento de salida
  if (!missionEvents[missionId]) missionEvents[missionId] = [];
  missionEvents[missionId].push({
    uid,
    message: `${name} abandonó el grupo`,
    timestamp: Date.now(),
    type: "userLeft"
  });

  res.json({ success: true });
});


app.get("/api/match/:missionId/events", (req, res) => {
  const { missionId } = req.params;
  const now = Date.now();
  const recentEvents = (missionEvents[missionId] || []).filter(
    (e) => now - e.timestamp < 10000 // últimos 10 segundos
  );
  res.json(recentEvents);
});



// Obtener usuarios emparejados
app.get("/api/match/:missionId", verifyToken, async (req, res) => {
  const { missionId } = req.params;

  try {
    const matchRef = db.collection("mission_matches").doc(missionId);
    const matchDoc = await matchRef.get();

    if (!matchDoc.exists) {
      return res.status(200).json([]);
    }

    res.status(200).json(matchDoc.data().users || []);
  } catch (error) {
    console.error("Error obteniendo emparejados:", error);
    res.status(500).send("Error interno al obtener emparejados.");
  }
});

// 👇 Ajuste en /claim para disolver emparejamiento
// Dentro de tu ruta /api/user-missions/claim, después de actualizar stats:

app.post("/api/user-missions/mark-completed", verifyToken, async (req, res) => {
  const userId = req.user.uid;
  const { missionId } = req.body;

  try {
    const userMissionRef = db.collection("user_missions").doc(userId);
    const doc = await userMissionRef.get();

    if (!doc.exists) return res.status(404).send("No hay misiones asignadas.");

    const data = doc.data();
    const missions = data.missions.map((m) =>
      m.id === missionId ? { ...m, completed: true } : m
    );
    await userMissionRef.update({ missions });

    // ✅ Emparejamiento cooperativo
    const matchRef = db.collection("mission_matches").doc(missionId);
    const matchDoc = await matchRef.get();

    if (matchDoc.exists) {
      const users = matchDoc.data().users || [];

      for (const u of users) {
        if (u.uid !== userId) {
          const otherRef = db.collection("user_missions").doc(u.uid);
          const otherDoc = await otherRef.get();

          if (otherDoc.exists) {
            const otherData = otherDoc.data();
            const otherUpdated = otherData.missions.map((m) =>
              m.id === missionId ? { ...m, completed: true } : m
            );
            await otherRef.update({ missions: otherUpdated });
          }
        }
      }

      // 🔥 Emitir evento en tiempo real
      io.to(missionId).emit("missionCompleted", { missionId });
    }

    res.status(200).json({ message: "Misión marcada como completada para el grupo." });
  } catch (error) {
    console.error("Error marcando misión como completada:", error);
    res.status(500).send("Error interno.");
  }
});
//--RECOMPENSAS DE NIVEL 

app.post("/api/profile/reward", verifyToken, async (req, res) => {
  const userId = req.user.uid;
  const { option } = req.body; // "coins", "xp", "cupon"

  try {
    const userStatsRef = db.collection("userStats").doc(userId);
    const statsDoc = await userStatsRef.get();

    if (!statsDoc.exists) {
      return res.status(404).send("No se encontraron estadísticas del usuario.");
    }

    const stats = statsDoc.data();
    const nivelActual = stats.nivelActual || 1;
    const ultimoNivelRecompensado = stats.ultimoNivelRecompensado || 0;

    // ✅ Validación: solo niveles múltiplos de 2 y no repetidos
    if (nivelActual % 2 !== 0 || nivelActual <= ultimoNivelRecompensado) {
      return res.status(403).send("Ya reclamaste recompensa en este nivel o no corresponde.");
    }

    let recompensa = null;

    if (option === "coins") {
      const cantidad = recompensaCoins();
      await userStatsRef.update({
        coins: (stats.coins || 0) + cantidad,
        ultimoNivelRecompensado: nivelActual, // ✅ guardar nivel reclamado
        ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
      });
      recompensa = `${cantidad} Coins`;
    }

    if (option === "xp") {
      const boost = recompensaBoost();
      await userStatsRef.update({
        xpBoost: { factor: boost, misionesRestantes: 3 },
        ultimoNivelRecompensado: nivelActual,
        ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
      });
      recompensa = `Boost XP x${boost} en próximas 3 misiones`;
    }

    if (option === "cupon") {
      const cupon = recompensaCupon();
      recompensa = cupon;
      const updateData = {
        ultimoNivelRecompensado: nivelActual,
        ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (cupon.includes("Cupón")) {
        updateData.cuponPremium = true;
      }
      await userStatsRef.update(updateData);
    }

    res.status(200).json({ message: "Recompensa otorgada", recompensa });
  } catch (error) {
    console.error("Error otorgando recompensa:", error);
    res.status(500).send("Error interno al otorgar recompensa.");
  }
});

// Funciones auxiliares
function recompensaCoins() {
  const valores = Array.from({ length: 16 }, (_, i) => (i + 1) * 50);
  return valores[Math.floor(Math.random() * valores.length)];
}

function recompensaBoost() {
  const boosts = [1.5, 3, 5];
  return boosts[Math.floor(Math.random() * boosts.length)];
}

function recompensaCupon() {
  const prob = Math.random();
  return prob <= 0.2 ? "Cupón 20% PREMIUM" : "Sigue intentándolo en el próximo nivel";
}


// --- INICIO DEL SERVIDOR ---
app.listen(PORT, () => {
  console.log(`✅ SV corriendo en http://localhost:${PORT}`);
});
