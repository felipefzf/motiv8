// src/pages/Profile.jsx
import team from '../assets/equipo1.png';
import bici from '../assets/bicicleta.png';
import medalla from '../assets/medalla.png';
import objetivo from '../assets/objetivo.png';
import equipo from '../assets/equipo.png';

export default function Profile() {
  return (
    <div style={{ padding: '20px', color: '#fff' }}>
      <h1 style={{ margin: 0, color: '#ffd000ff' }}>MOTIV8</h1>
      <h2 style={{ margin: '5px 0 10px 0' }}>Equipos</h2>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img
          src={team}
          className=""
          alt="..."
          width={300}
          height={230}
          style={{ marginBottom: '0px' }}
        />
        <h4 style={{ margin: 0 }}>Shadow Crew  <span style={{ color: '#ffd000ff' }}>Nivel 23</span></h4>
        <p style={{ margin: 0 }}>Ubicación: <span style={{ color: '#ffd000ff' }}>Santiago, Chile</span></p>
        <p style={{ margin: 0 }}>Deporte Principal: <span style={{ color: '#ffd000ff' }}>Ciclismo</span></p>
        <p style={{ margin: 0 }}>Miembros: <span style={{ color: '#ffd000ff' }}>3</span></p>
        <br />
        <h3 style={{ color: '#ffd000ff' }}>Estadísticas</h3>
        <p style={{ margin: 0 }}>Distancia: <span style={{ color: '#ffd000ff' }}>1.500 km</span></p>
        <p style={{ margin: 0 }}>Misiones: <span style={{ color: '#ffd000ff' }}>243 Completadas</span></p>
        <p style={{ margin: 0 }}>Tiempo Activo: <span style={{ color: '#ffd000ff' }}>2.300 hrs</span></p>
        <p style={{ margin: 0 }}>Insignias: <span style={{ color: '#ffd000ff' }}>32 Obtenidas</span></p>
        <br />
        <h3 style={{ color: '#ffd000ff', marginTop: '10px' }}>Miembros</h3>
        <p style={{ margin: 0 }}>tms.pz - <span style={{ color: '#ffd000ff' }}>Nivel 7</span></p>
        <p style={{ margin: 0 }}>Uncol - <span style={{ color: '#ffd000ff' }}>Nivel 6</span></p>
        <p style={{ margin: 0 }}>PabloIg1 - <span style={{ color: '#ffd000ff' }}>Nivel 4</span></p>
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
        </div>
        
      </div>
    </div>
  );
}
