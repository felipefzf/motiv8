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
    return <p className={styles.error}>No estás autenticado.</p>;
  }

  return (
    <div className={styles.teamsContainer}>
      <h1 className={styles.teamsTitle}>MOTIV8</h1>
      <h2 className={styles.teamsSubtitle}>Equipos</h2>

      {user.team_member === true ? (
        <MyTeamInfo />
      ) : (
        <JoinTeamView />
      )}
    </div>
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
    </div>
>>>>>>> Stashed changes
=======
    </div>
>>>>>>> Stashed changes
=======
    </div>
>>>>>>> Stashed changes
  );
}

export default Teams;
