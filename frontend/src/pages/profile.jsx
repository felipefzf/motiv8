// src/pages/Profile.jsx
import tomy from '../assets/tomy.png';
import bici from '../assets/bici.png';

export default function Profile() {
  return (
    <div style={{ padding: '20px', color: '#fff' }}>
      <h1 style={{ margin: 0, color: '#ffd000ff' }}>Motiv8</h1>
      <h2 style={{ margin: '5px 0 10px 0' }}>Perfil</h2>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img
          src={tomy}
          className="rounded-circle border border-warning"
          alt="..."
          width={200}
          height={200}
          style={{ marginBottom: '10px' }}
        />
        <p style={{ margin: 0 }}>tms.pz  <span style={{ color: '#ffd000ff' }}>Nivel 6</span></p>
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
          <img src="/path/to/medalla2.png" alt="Medalla 2" width={60} height={60} />
          <img src="/path/to/medalla3.png" alt="Medalla 3" width={60} height={60} />
          <img src="/path/to/medalla4.png" alt="Medalla 4" width={60} height={60} />
          <img src="/path/to/medalla5.png" alt="Medalla 5" width={60} height={60} />
        </div>

      </div>
    </div>
  );
}
