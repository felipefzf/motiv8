// src/pages/Profile.jsx
import tomy from '../assets/tomy.png';
import bici from '../assets/bicicleta.png';
import medalla from '../assets/medalla.png';
import objetivo from '../assets/objetivo.png';
import equipo from '../assets/equipo.png';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';

const styles = {
  container: {
    padding: '20px',
    maxWidth: '600px',
    margin: '40px auto',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  divider: {
    margin: '20px 0',
    border: 'none',
    borderTop: '1px solid #eee'
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#dc3545', // Rojo
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px'
  }
};

export default function Profile() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // 1. Cierra la sesión en Firebase
      await signOut(auth);
      
      // 2. Limpia los datos de sesión guardados
      localStorage.removeItem('firebaseToken');
      localStorage.removeItem('userRole');
      
      // 3. Redirige al login (con 'replace' para que no pueda volver)
      navigate('/loginpage', { replace: true });

    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div style={{ padding: '20px', color: '#fff' }}>
      <h1 style={{ margin: 0, color: '#ffd000ff' }}>MOTIV8</h1>
      <h2 style={{ margin: '5px 0 10px 0' }}>Perfil</h2>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img
          src={tomy}
          className="rounded-circle border  border-warning"
          alt="..."
          width={200}
          height={200}
          style={{ marginBottom: '10px' }}
        />
        <h4 style={{ margin: 0 }}>tms.pz  <span style={{ color: '#ffd000ff' }}>Nivel 7</span></h4>
        <p style={{ margin: 0 }}>Ubicación: Puente Alto, Chile</p>
        <p style={{ margin: 0 }}>Deporte Principal: Ciclismo</p>
        <br />
        <h3 style={{ color: '#ffd000ff' }}>Estadísticas</h3>
        <p style={{ margin: 0 }}>Distancia: <span style={{ color: '#ffd000ff' }}>270 km</span></p>
        <p style={{ margin: 0 }}>Misiones: <span style={{ color: '#ffd000ff' }}>45 Completadas</span></p>
        <p style={{ margin: 0 }}>Tiempo Activo: <span style={{ color: '#ffd000ff' }}>120 hrs</span></p>
        <p style={{ margin: 0 }}>Insignias: <span style={{ color: '#ffd000ff' }}>8 Obtenidas</span></p>
        <br />
        <h3 style={{ color: '#ffd000ff', marginTop: '20px' }}>Logros y Medallas</h3>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap', // para que se ajusten en varias filas si no caben
            marginTop: '10px',
            justifyContent: 'center', // centra las medallas
          }}
        >
          <img src={bici} alt="Medalla 1" width={60} height={60} />
          <img src={medalla} alt="Medalla 2" width={60} height={60} />
          <img src={objetivo} alt="Medalla 3" width={60} height={60} />
          <img src={equipo} alt="Medalla 4" width={60} height={60} />
          <button 
            onClick={handleLogout} 
            style={styles.logoutButton}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
