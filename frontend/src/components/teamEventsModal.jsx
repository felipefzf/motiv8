import React, { useState, useEffect } from 'react';
import Modal from './modal';
import { useAuth } from '../context/authContext';
// Reutilizamos los estilos del formulario de equipos para mantener consistencia
import styles from './CreateTeamForm.module.css'; 
import API_URL from '../config';

export default function TeamEventsModal({ isOpen, onClose, teamId, canCreate }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  
  // Estado para controlar qué vista mostramos: 'list' (lista) o 'create' (formulario)
  const [view, setView] = useState('list'); 

  // Estado del formulario de creación
  const [formData, setFormData] = useState({
    title: '',
    type: 'training', // valor por defecto
    date: '',
    route: '',
    distance: '',
    speed: '',
    duration: ''
  });

  const toggleAttendees = (eventId) => {
    setExpandedEventId(prev => prev === eventId ? null : eventId);
  };

  // Cargar eventos al abrir el modal
  useEffect(() => {
    if (isOpen && teamId) {
      fetchEvents();
      setView('list'); // Siempre empezar en la lista
    }
  }, [isOpen, teamId]);

  const fetchEvents = async () => {
    setLoading(true);
    const token = localStorage.getItem('firebaseToken');
    try {
      const res = await fetch(`${API_URL}/api/teams/${teamId}/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Error cargando eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. FUNCIÓN PARA PREPARAR LA EDICIÓN ---
  const handleEditClick = (event) => {
    setEditingEventId(event.id); // Guardamos el ID
    // Llenamos el formulario con los datos actuales
    setFormData({
      title: event.title,
      type: event.type,
      date: event.date, // Asegúrate de que el formato coincida con el input datetime-local
      route: event.route,
      distance: event.distance,
      speed: event.speed,
      duration: event.duration
    });
    setView('create'); // Cambiamos a la vista de formulario
  };

  // --- 3. FUNCIÓN PARA ELIMINAR ---
  const handleDelete = async (eventId) => {
    if (!window.confirm("¿Estás seguro de eliminar este evento?")) return;
    
    const token = localStorage.getItem('firebaseToken');
    try {
      await fetch(`${API_URL}/api/teams/${teamId}/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEvents(); // Recargar lista
    } catch (error) {
      console.error(error);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('firebaseToken');
    
    // Decidimos si es CREAR (POST) o EDITAR (PUT)
    const method = editingEventId ? 'PUT' : 'POST';
    const url = editingEventId 
      ? `${API_URL}/api/teams/${teamId}/events/${editingEventId}`
      : `${API_URL}/api/teams/${teamId}/events`;

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Error en la operación');

      alert(editingEventId ? "Evento actualizado" : "Evento creado");
      
      // Resetear todo
      setFormData({ title: '', type: 'training', date: '', route: '', distance: '', speed: '', duration: '' });
      setEditingEventId(null); // Limpiar modo edición
      setView('list');
      fetchEvents();

    } catch (error) {
      alert(error.message);
    }
  };

  // Función auxiliar para resetear al volver
  const handleBackToList = () => {
    setFormData({ title: '', type: 'training', date: '', route: '', distance: '', speed: '', duration: '' });
    setEditingEventId(null);
    setView('list');
  }

  const handleJoinToggle = async (eventId) => {
    const token = localStorage.getItem('firebaseToken');
    try {
        await fetch(`${API_URL}/api/events/${teamId}/${eventId}/toggle-join`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchEvents(); // Recargar para actualizar el botón
    } catch (error) {
        console.error(error);
    }
  };

  // Helper para renderizar la etiqueta del tipo de evento
  const getTypeLabel = (type) => {
      switch(type) {
          case 'social': return '☕ Social Ride';
          case 'race': return '🏆 Carrera';
          default: return '💪 Entrenamiento';
      }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.form}> 
        
        {/* --- CABECERA --- */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20}}>
            <h2 className={styles.title} style={{margin:0, fontSize:'1.5rem'}}>
                {view === 'create' ? (editingEventId ? 'Editar Evento' : 'Nuevo Evento') : 'Eventos del Equipo'}
            </h2>
            {/* Botón "Volver" si estamos en crear */}
            {view === 'create' && (
                <button onClick={() => setView('list')} style={{background:'none', border:'none', color:'#666', cursor:'pointer', textDecoration:'underline'}}>
                    Volver a lista
                </button>
            )}
        </div>

        {/* --- VISTA 1: LISTA DE EVENTOS --- */}
        {view === 'list' && (
          <>
            {/* Botón de Crear (Solo visible para el dueño) */}
            {canCreate && (
              <button 
                onClick={() => { setEditingEventId(null); setView('create'); }}
                className={styles.submitButton} 
                style={{width: '100%', marginBottom: 20, backgroundColor: '#17a2b8'}}
              >
                + Crear Nuevo Evento
              </button>
            )}
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loading ? <p style={{textAlign:'center'}}>Cargando...</p> : events.length === 0 ? (
                  <p style={{textAlign:'center', color:'#888'}}>No hay eventos próximos.</p>
              ) : (
                  events.map(evt => {
                    const isJoined = evt.attendees?.includes(user.uid);
                    const isExpanded = expandedEventId === evt.id; // ¿Está abierta esta lista?
                    const canManage = canCreate || evt.createdBy === user.uid;
                    return (
                      <div key={evt.id} style={{border: '1px solid #ddd', borderRadius: 8, padding: 12, background: '#f9f9f9'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px dashed #ddd', paddingBottom: 10}}>
                            <div>
                                <h4 style={{margin:'0 0 5px 0', color:'#333'}}>{evt.title}</h4>
                                <span style={{fontSize:'0.8em', background:'#e9ecef', padding:'2px 6px', borderRadius:4, color:'#555'}}>
                                    {getTypeLabel(evt.type)}
                                </span>
                            </div>
                            {/* Fecha */}
                            <div style={{textAlign:'right', fontSize:'0.85em', color:'#666'}}>
                                <div>📅 {new Date(evt.date).toLocaleDateString()}</div>
                                <div>⏰ {new Date(evt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            </div>
                        </div>

                        <div style={{marginTop: 10, fontSize: '0.9em', color: '#444'}}>
                        
                            <p style={{margin: '0px 0', backgroundColor:'#e9ecef', padding:'5px 10px', borderRadius:4}}>📍 <strong>Lugar de encuentro:</strong> {evt.route}</p>
                            <br />
                            <div style={{display:'flex', gap: 10}}>
                                <span>📏 {evt.distance} km</span>
                                <span>⚡ {evt.speed} km/h</span>
                                <span>⏱ {evt.duration} min</span>
                              {canManage ? (
                              <div style={{display: 'flex', gap: 10}}>
                                <button onClick={() => handleEditClick(evt)} style={{border:'none', padding:'5px 10px', background:'#2259f1ff', cursor:'pointer'}}>✏️</button>
                                <button onClick={() => handleDelete(evt.id)} style={{border:'none', padding:'5px 10px', background:'#dc3545', cursor:'pointer'}}>🗑️</button>
                              </div>
                          ) : null}
                            </div>
                        </div>
                        
                        <div style={{marginTop: 12, paddingTop: 10, borderTop:'1px dashed #ddd', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <button 
                              onClick={() => toggleAttendees(evt.id)}
                              style={{background: '#007bff',padding:'7px 15px', border: 'none', color: 'white', cursor: 'pointer', textDecoration: 'none', fontSize: '0.9rem'}}
                            >
                              👥 {evt.attendees?.length || 0} confirmados {isExpanded ? '▲' : '▼'}
                            </button>

                            <button 
                              onClick={() => handleJoinToggle(evt.id)}
                              style={{
                                padding: '6px 12px', 
                                borderRadius: 5, 
                                border: 'none', 
                                color: 'white', 
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                backgroundColor: isJoined ? '#dc3545' : '#28a745'
                              }}
                            >
                              {isJoined ? 'Cancelar Asistencia' : 'Asistir'}
                            </button>
                        </div>
                        {isExpanded && (
                          <div style={{marginTop: 10, borderRadius: 5 }}>
                              {(!evt.attendeesDetails || evt.attendeesDetails.length === 0) ? (
                                  <p style={{margin:0, fontStyle:'italic', fontSize:'0.8rem'}}>Aún no hay asistentes.</p>
                              ) : (
                                  <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                                    {evt.attendeesDetails.map(att => (
                                      <li key={att.uid} style={{display:'flex', alignItems:'center', gap: 10, marginBottom: 5, backgroundColor:'#e9ecef', padding:'5px 10px', borderRadius:4}}>
                                          {/* NOMBRE */}
                                          <span style={{fontSize: '0.9rem', color: '#333'}}>{att.name}</span>

                                      </li>
                                    ))}
                                  </ul>
                              )}
                          </div>
                        )}
                      </div>
                    );
                  })  
              )}
            </div>
          </>
        )}

        {/* --- VISTA 2: FORMULARIO DE CREACIÓN --- */}
        {view === 'create' && (
          <form onSubmit={handleFormSubmit} style={{display:'flex', flexDirection:'column', gap: 15}}>
            
            <div className={styles.inputGroup}>
                <label>Título del Evento</label>
                <input 
                    type="text" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    required 
                    placeholder="Ej. Salida Dominical al Cerro"
                />
            </div>

            <div className={styles.inputGroup}>
                <label>Tipo</label>
                <select 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    style={{width:'100%', padding: 10, borderRadius: 5, border: '1px solid #ccc'}}
                >
                    <option value="training">Entrenamiento</option>
                    <option value="social">Social Ride (Paseo)</option>
                    <option value="race">Carrera Amistosa</option>
                </select>
            </div>

            <div className={styles.inputGroup}>
                <label>Fecha y Hora</label>
                <input 
                    type="datetime-local" 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                    required 
                />
            </div>

            <div className={styles.inputGroup}>
                <label>Ruta / Lugar de Encuentro</label>
                <input 
                    type="text" 
                    value={formData.route} 
                    onChange={e => setFormData({...formData, route: e.target.value})} 
                    placeholder="Ej. Entrada Parque Metropolitano"
                    required
                />
            </div>

            <div style={{display:'flex', gap: 10}}>
                <div className={styles.inputGroup} style={{flex:1}}>
                    <label>Distancia (km)</label>
                    <input type="number" value={formData.distance} onChange={e => setFormData({...formData, distance: e.target.value})} />
                </div>
                <div className={styles.inputGroup} style={{flex:1}}>
                    <label>Vel. Prom. (km/h)</label>
                    <input type="number" value={formData.speed} onChange={e => setFormData({...formData, speed: e.target.value})} />
                </div>
            </div>
            
            <div className={styles.inputGroup}>
                <label>Duración Estimada (min)</label>
                <input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
            </div>

            <div className={styles.buttonContainer}>
                <button type="button" onClick={() => setView('list')} className={styles.cancelButton}>Cancelar</button>
                <button type="submit" className={styles.submitButton}>Publicar Evento</button>
            </div>
          </form>
        )}

      </div>
    </Modal>
  );
}