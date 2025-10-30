import React from 'react';
import { useAuth } from '../context/authContext'; 
import MyTeamInfo from '../components/teamInfo';
import JoinTeamView from '../components/joinTeam';
import styles from './teams.module.css';

function Teams() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <p className={styles.loading}>Cargando...</p>;
  }
  if (!user) {
    // Esto no debería pasar si la ruta está protegida, pero por si acaso
    return <p className={styles.error}>No estás autenticado.</p>; 
  }

  return (
    <div className="teams-container" style={{padding: '20px'}}>
      <h1 style={{color:'#ffd000ff'}}>MOTIV8</h1>
      <h2 style={{color:'#ffff'}}>Equipos</h2>

      {/* Condicional basado en el campo 'teamMember' del usuario */}
      {user.team_member === true ? (
        <MyTeamInfo /> 
      ) : (
        <JoinTeamView /> 
      )}
    </div>
  );
}

export default Teams;