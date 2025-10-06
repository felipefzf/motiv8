import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Importar rutas
import testRoutes from "./routes/test.js";
app.use("/api", testRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend corriendo en http://localhost:${PORT}`);
});
