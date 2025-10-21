// src/pages/Profile.jsx
import tomy from '../assets/tomy.png';

export default function Profile() {
  return (
    <div style={{ padding: '20px', color: '#fff' }}>
      <h1 style={{ margin: 0 }}>Motiv8</h1>
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
        <p style={{ margin: 0 }}>tms.pz  Nivel 6</p>
        <p style={{ margin: 0 }}>Ubicación: Puente Alto, Chile</p>
        <p style={{ margin: 0 }}>Deporte Principal: Ciclismo</p>
        <br />
        <h3>Estadísticas</h3>
        <div>
          <div className="container" style={{ maxWidth: '400px', padding: 0, }}>
            <div className="row row-cols-2 g-2">
              <div className="col">
                <div className="card text-center">
                  <div className="card-body p-2">Distancia: 270 KM</div>
                </div>
              </div>
              <div className="col">
                <div className="card text-center">
                  <div className="card-body p-2">Tiempo Activo: 120 HRS</div>
                </div>
              </div>
              <div className="col">
                <div className="card text-center">
                  <div className="card-body p-2">Misiones: 45 Completadas</div>
                </div>
              </div>
              <div className="col">
                <div className="card text-center">
                  <div className="card-body p-2">Insignias: 10 Obtenidas</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
