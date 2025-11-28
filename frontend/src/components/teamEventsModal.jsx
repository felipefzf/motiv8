import React, { useState, useEffect } from 'react';
import Modal from './modal';
import { useAuth } from '../context/authContext';
import styles from './teamEventsModal.module.css'; 
import API_URL from '../config';

export default function TeamEventsModal({ isOpen, onClose, teamId, canCreate }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [view, setView] = useState('list');

  const [formData, setFormData] = useState({
    title: '',
    type: 'training',
    date: '',
    route: '',
    distance: '',
    speed: '',
    duration: ''
  });

  const toggleAttendees = (eventId) => {
    setExpandedEventId(prev => prev === eventId ? null : eventId);
  };

  useEffect(() => {
    if (isOpen && teamId) {
      fetchEvents();
      setView('list');
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

  const handleEditClick = (event) => {
    setEditingEventId(event.id);
    setFormData({
      title: event.title,
      type: event.type,
      date: event.date,
      route: event.route,
      distance: event.distance,
      speed: event.speed,
      duration: event.duration
    });
    setView('create');
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm("¿Estás seguro de eliminar este evento?")) return;
    
    const token = localStorage.getItem('firebaseToken');
    try {
      await fetch(`${API_URL}/api/teams/${teamId}/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEvents();
    } catch (error) {
      console.error(error);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('firebaseToken');
    
    const method = editingEventId ? 'PUT' : 'POST';
    const url = editingEventId 
      ? `${API_URL}/api/teams/${teamId}/events/${editingEventId}`
      : `${API_URL}/api/teams/${teamId}/events`;

    try {
      const response = await fetch(url, {
        method,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Error en la operación');

      alert(editingEventId ? "Evento actualizado" : "Evento creado");
      
      setFormData({ title: '', type: 'training', date: '', route: '', distance: '', speed: '', duration: '' });
      setEditingEventId(null);
      setView('list');
      fetchEvents();

    } catch (error) {
      alert(error.message);
    }
  };

  const handleBackToList = () => {
    setFormData({ title: '', type: 'training', date: '', route: '', distance: '', speed: '', duration: '' });
    setEditingEventId(null);
    setView('list');
  };

  const handleJoinToggle = async (eventId) => {
    const token = localStorage.getItem('firebaseToken');
    try {
        await fetch(`${API_URL}/api/events/${teamId}/${eventId}/toggle-join`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchEvents();
    } catch (error) {
        console.error(error);
    }
  };

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
        
        {/* CABECERA */}
        <div className={styles.eventsHeader}>
            <h2 className={`${styles.title} ${styles.eventsTitle}`}>
                {view === 'create' ? (editingEventId ? 'Editar Evento' : 'Nuevo Evento') : 'Eventos del Equipo'}
            </h2>
            {view === 'create' && (
                <button 
                  onClick={handleBackToList} 
                  className={styles.backButton}
                >
                    Volver a lista
                </button>
            )}
        </div>

        {/* LISTA */}
        {view === 'list' && (
          <>
            {canCreate && (
              <button 
                onClick={() => { setEditingEventId(null); setView('create'); }}
                className={` ${styles.createEventButton}`}
              >
                + Crear Nuevo Evento
              </button>
            )}
            
            <div className={styles.eventsList}>
              {loading ? (
                <p className={styles.loadingText}>Cargando...</p>
              ) : events.length === 0 ? (
                  <p className={styles.emptyText}>No hay eventos próximos.</p>
              ) : (
                  events.map(evt => {
                    const isJoined = evt.attendees?.includes(user.uid);
                    const isExpanded = expandedEventId === evt.id;
                    const canManage = canCreate || evt.createdBy === user.uid;
                    return (
                      <div key={evt.id} className={styles.eventCard}>
                        <div className={styles.eventCardHeader}>
                            <div className={styles.eventMainInfo}>
                                <h4 className={styles.eventTitle}>{evt.title}</h4>
                                <span className={styles.eventTypeBadge}>
                                    {getTypeLabel(evt.type)}
                                </span>
                            </div>
                            <div className={styles.eventDateBlock}>
                                <div>📅 {new Date(evt.date).toLocaleDateString()}</div>
                                <div>⏰ {new Date(evt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            </div>
                        </div>

                        <div className={styles.eventBody}>
                            <p className={styles.eventRoute}>
                              📍 <strong>Lugar de encuentro:</strong> {evt.route}
                            </p>

                            <div className={styles.eventStatsRow}>
                                <span>📏 {evt.distance} km</span>
                                <span>⚡ {evt.speed} km/h</span>
                                <span>⏱ {evt.duration} min</span>

                                {canManage && (
                                  <div className={styles.manageButtons}>
                                    <button 
                                      onClick={() => handleEditClick(evt)} 
                                      className={styles.iconButtonEdit}
                                    >
                                      ✏️
                                    </button>
                                    <button 
                                      onClick={() => handleDelete(evt.id)} 
                                      className={styles.iconButtonDelete}
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                )}
                            </div>
                        </div>
                        
                        <div className={styles.eventFooter}>
                            <button 
                              onClick={() => toggleAttendees(evt.id)}
                              className={styles.attendeesButton}
                            >
                              👥 {evt.attendees?.length || 0} confirmados {isExpanded ? '▲' : '▼'}
                            </button>

                            <button 
                              onClick={() => handleJoinToggle(evt.id)}
                              className={
                                isJoined 
                                  ? `${styles.joinButton} ${styles.joinButtonCancel}`
                                  : `${styles.joinButton} ${styles.joinButtonJoin}`
                              }
                            >
                              {isJoined ? 'Cancelar Asistencia' : 'Asistir'}
                            </button>
                        </div>

                        {isExpanded && (
                          <div className={styles.attendeesListWrapper}>
                              {(!evt.attendeesDetails || evt.attendeesDetails.length === 0) ? (
                                  <p className={styles.noAttendeesText}>Aún no hay asistentes.</p>
                              ) : (
                                  <ul className={styles.attendeesList}>
                                    {evt.attendeesDetails.map(att => (
                                      <li key={att.uid} className={styles.attendeeItem}>
                                          <span className={styles.attendeeName}>{att.name}</span>
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

        {/* FORMULARIO */}
        {view === 'create' && (
          <form onSubmit={handleFormSubmit} className={styles.eventsForm}>
            
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
                    className={styles.select}
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

            <div className={styles.row}>
                <div className={`${styles.inputGroup} ${styles.flex1}`}>
                    <label>Distancia (km)</label>
                    <input 
                      type="number" 
                      value={formData.distance} 
                      onChange={e => setFormData({...formData, distance: e.target.value})} 
                    />
                </div>
                <div className={`${styles.inputGroup} ${styles.flex1}`}>
                    <label>Vel. Prom. (km/h)</label>
                    <input 
                      type="number" 
                      value={formData.speed} 
                      onChange={e => setFormData({...formData, speed: e.target.value})} 
                    />
                </div>
            </div>
            
            <div className={styles.inputGroup}>
                <label>Duración Estimada (min)</label>
                <input 
                  type="number" 
                  value={formData.duration} 
                  onChange={e => setFormData({...formData, duration: e.target.value})} 
                />
            </div>

            <div className={styles.buttonContainer}>
                <button 
                  type="button" 
                  onClick={handleBackToList} 
                  className={styles.cancelButton}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={styles.submitButton}
                >
                  Publicar Evento
                </button>
            </div>
          </form>
        )}

      </div>
    </Modal>
  );
}
