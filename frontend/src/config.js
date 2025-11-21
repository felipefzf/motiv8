const API_URL = import.meta.env.PROD 
  ? 'https://motiv8-api.onrender.com' // <-- Tu URL real de Render
  : 'http://localhost:5000';
export default API_URL;