import express from "express";
import cors from "cors";
import axios from "axios";
import testRoutes from "./routes/test.js";



const app = express();
app.use(cors());
app.use(express.json());
const PORT = 5000

app.use("/api", testRoutes);
app.listen(PORT, () => {
  console.log(`✅ SV corriendo en http://localhost:${PORT}`);
});











