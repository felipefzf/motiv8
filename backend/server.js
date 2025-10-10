import express from "express";
import cors from "cors";
import axios from "axios";
import testRoutes from "./routes/test.js";

const app = express();
app.use(cors());
app.use(express.json());
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


app.use("/api", testRoutes);
app.listen(PORT, () => {
  console.log(`✅ SV corriendo en http://localhost:${PORT}`);
});


//API STRAVA








