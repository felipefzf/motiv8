import { useState } from "react";
import "./activityCreator.css";


export default function ActivityCreator() {
  const [regionInicio, setRegionInicio] = useState("");
  const [regionTermino, setRegionTermino] = useState("");
  const [comunasInicio, setComunasInicio] = useState([]);
  const [comunasTermino, setComunasTermino] = useState([]);
  const [formData, setFormData] = useState({
    nombreActividad: "",
    kilometros: "",
    velocidadPunta: "",
    velocidadPromedio: "",
    comunaInicio: "",
    comunaTermino: "",
  });

  const regionesYcomunas = [
    { region: "Región de Arica y Parinacota", comunas: ["Arica", "Camarones", "Putre", "General Lagos"] },
    { region: "Región de Tarapacá", comunas: ["Iquique", "Alto Hospicio", "Pozo Almonte", "Pica", "Camiña", "Colchane", "Huara"] },
    { region: "Región de Antofagasta", comunas: ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal", "Calama", "Ollagüe", "San Pedro de Atacama", "María Elena", "Tocopilla"] },
    { region: "Región de Atacama", comunas: ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Freirina", "Huasco", "Alto del Carmen"] },
    { region: "Región de Coquimbo", comunas: ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paihuano", "Vicuña", "Ovalle", "Monte Patria", "Combarbalá", "Punitaqui", "Illapel", "Salamanca", "Los Vilos"] },
    { region: "Región de Valparaíso", comunas: ["Valparaíso", "Viña del Mar", "Concón", "Quilpué", "Villa Alemana", "Casablanca", "Quillota", "La Calera", "Hijuelas", "La Cruz", "Nogales", "San Antonio", "Cartagena", "El Quisco", "El Tabo", "Algarrobo", "Santo Domingo", "San Felipe", "Los Andes", "Llay-Llay", "Catemu", "Panquehue", "Putaendo", "Santa María"] },
    { region: "Región Metropolitana de Santiago", comunas: ["Santiago", "Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Joaquín", "San Miguel", "San Ramón", "Vitacura"] },
    { region: "Región del Libertador General Bernardo O’Higgins", comunas: ["Rancagua", "Machalí", "Requínoa", "Graneros", "Mostazal", "Codegua", "Doñihue", "Coltauco", "San Vicente", "Peumo", "Las Cabras", "Pichidegua", "San Fernando", "Chimbarongo", "Nancagua", "Santa Cruz", "Lolol", "Palmilla", "Pumanque", "Peralillo", "Marchigüe", "La Estrella", "Pichilemu", "Navidad", "Litueche"] },
    { region: "Región del Maule", comunas: ["Talca", "Maule", "San Clemente", "Pelarco", "Pencahue", "Río Claro", "San Rafael", "Curepto", "Empedrado", "Constitución", "Linares", "Yerbas Buenas", "Longaví", "Colbún", "Villa Alegre", "Retiro", "Parral", "Cauquenes", "Chanco", "Pelluhue"] },
    { region: "Región de Ñuble", comunas: ["Chillán", "Chillán Viejo", "San Carlos", "Bulnes", "Quillón", "Yungay", "Pinto", "San Fabián", "Coihueco", "Ñiquén", "San Nicolás", "El Carmen", "Pemuco", "Ránquil", "Trehuaco", "Ninhue", "Cobquecura", "Quirihue", "Portezuelo"] },
    { region: "Región del Biobío", comunas: ["Concepción", "Talcahuano", "Hualpén", "San Pedro de la Paz", "Chiguayante", "Penco", "Tomé", "Florida", "Hualqui", "Coronel", "Lota", "Arauco", "Curanilahue", "Los Álamos", "Lebu", "Nacimiento", "Los Ángeles", "Cabrero", "Yumbel", "Laja", "San Rosendo", "Mulchén", "Negrete", "Quilleco", "Santa Bárbara", "Tucapel", "Antuco", "Quilaco"] },
    { region: "Región de La Araucanía", comunas: ["Temuco", "Padre Las Casas", "Vilcún", "Lautaro", "Perquenco", "Freire", "Pitrufquén", "Gorbea", "Toltén", "Nueva Imperial", "Carahue", "Saavedra", "Teodoro Schmidt", "Cunco", "Melipeuco", "Villarrica", "Pucón", "Curarrehue", "Angol", "Collipulli", "Ercilla", "Traiguén", "Purén", "Los Sauces", "Lumaco", "Victoria"] },
    { region: "Región de Los Ríos", comunas: ["Valdivia", "Corral", "Lanco", "Mariquina", "Paillaco", "Los Lagos", "Futrono", "Lago Ranco", "Río Bueno", "La Unión"] },
    { region: "Región de Los Lagos", comunas: ["Puerto Montt", "Puerto Varas", "Llanquihue", "Frutillar", "Los Muermos", "Fresia", "Calbuco", "Maullín", "Cochamó", "Osorno", "San Pablo", "San Juan de la Costa", "Purranque", "Río Negro", "Puerto Octay", "Puyehue", "Río Bueno", "Ancud", "Castro", "Chonchi", "Dalcahue", "Curaco de Vélez", "Puqueldón", "Quinchao", "Queilén", "Quemchi", "Quellón"] },
    { region: "Región de Aysén del General Carlos Ibáñez del Campo", comunas: ["Coyhaique", "Aysén", "Cisnes", "Guaitecas", "Chile Chico", "Río Ibáñez", "Cochrane", "O'Higgins", "Tortel"] },
    { region: "Región de Magallanes y de la Antártica Chilena", comunas: ["Punta Arenas", "Puerto Natales", "Torres del Paine", "Porvenir", "Primavera", "Timaukel", "Cabo de Hornos", "Antártica"] },
  ];

  const handleRegionInicio = (e) => {
    const region = e.target.value;
    setRegionInicio(region);
    const regionData = regionesYcomunas.find((r) => r.region === region);
    setComunasInicio(regionData ? regionData.comunas : []);
    setFormData({ ...formData, comunaInicio: "" });
  };

  const handleRegionTermino = (e) => {
    const region = e.target.value;
    setRegionTermino(region);
    const regionData = regionesYcomunas.find((r) => r.region === region);
    setComunasTermino(regionData ? regionData.comunas : []);
    setFormData({ ...formData, comunaTermino: "" });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos del formulario:", formData);
  };
  const toastTrigger = document.getElementById('liveToastBtn')
  const toastLiveExample = document.getElementById('liveToast')

  if (toastTrigger) {
    // eslint-disable-next-line no-undef
    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample)
    toastTrigger.addEventListener('click', () => {
      toastBootstrap.show()
    })
  }
  return (
    <div className="act-container">
      <h1 className="act-title">MOTIV8</h1>
      <form className="activity-form" onSubmit={handleSubmit}>
        <h2>Registrar Actividad</h2>

        <label>Nombre de la Actividad:</label>
        <input type="text" name="nombreActividad" value={formData.nombreActividad} onChange={handleChange} required />

        <label>Región de Inicio:</label>
        <select value={regionInicio} onChange={handleRegionInicio} required>
          <option value="">Seleccione una región</option>
          {regionesYcomunas.map((r, i) => <option key={i} value={r.region}>{r.region}</option>)}
        </select>

        <label>Comuna de Inicio:</label>
        <select name="comunaInicio" value={formData.comunaInicio} onChange={handleChange} required>
          <option value="">Seleccione una comuna</option>
          {comunasInicio.map((c, i) => <option key={i} value={c}>{c}</option>)}
        </select>

        <label>Región de Término:</label>
        <select value={regionTermino} onChange={handleRegionTermino} required>
          <option value="">Seleccione una región</option>
          {regionesYcomunas.map((r, i) => <option key={i} value={r.region}>{r.region}</option>)}
        </select>

        <label>Comuna de Término:</label>
        <select name="comunaTermino" value={formData.comunaTermino} onChange={handleChange} required>
          <option value="">Seleccione una comuna</option>
          {comunasTermino.map((c, i) => <option key={i} value={c}>{c}</option>)}
        </select>

        <label>Kilómetros Totales:</label>
        <input type="number" name="kilometros" value={formData.kilometros} onChange={handleChange} required />

        <label>Velocidad Punta (km/h):</label>
        <input type="number" name="velocidadPunta" value={formData.velocidadPunta} onChange={handleChange} required />

        <label>Velocidad Promedio (km/h):</label>
        <input type="number" name="velocidadPromedio" value={formData.velocidadPromedio} onChange={handleChange} required />

        <button type="button" class="btn btn-primary" id="liveToastBtn">Registrar Actividad</button>

        <div className="alerta toast-container position-fixed bottom-0 end-0 p-3">
          <div id="liveToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
              <strong class="me-auto">MOTIV8</strong>
              <small>Hace un instante</small>
              <button type="button" className="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
              Actividad Registrada con exito!!
            </div>
          </div>
        </div>
      </form>
    </div>

  );
}
