import React from "react";
import Modal from "./modal"; // Asegúrate de que la ruta sea correcta
import styles from "./teamDetailModal.module.css"; // Reutilizamos estilos existentes

function ProfileRewardModal({ isOpen, onClose, onClaim }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.container}>
        <h2>🎁 Elige tu recompensa</h2>

        <div className={styles.description}>
          <button
            onClick={() => onClaim("coins")}
            className={`${styles.button} ${styles.joinButton}`}
            style={{ marginBottom: "8px" }}
          >
            Coins
          </button>
          <p style={{ fontSize: "0.85em", color: "#555" }}>
            Recibe una cantidad aleatoria de monedas entre 50 y 800 (múltiplos de 50).
          </p>
        </div>

        <div className={styles.description}>
          <button
            onClick={() => onClaim("xp")}
            className={`${styles.button} ${styles.joinButton}`}
            style={{ marginBottom: "8px" }}
          >
            Boost XP
          </button>
          <p style={{ fontSize: "0.85em", color: "#555" }}>
            Obtén un multiplicador aleatorio (x1.5, x3 o x5) para tus próximas 3 misiones.
          </p>
        </div>

        <div className={styles.description}>
          <button
            onClick={() => onClaim("cupon")}
            className={`${styles.button} ${styles.joinButton}`}
            style={{ marginBottom: "8px" }}
          >
            Cupón Premium
          </button>
          <p style={{ fontSize: "0.85em", color: "#555" }}>
            Tienes un 20% de probabilidad de recibir un cupón de 20% de descuento en tiendas deportivas o compras en OXXO.
          </p>
        </div>

        <div className={styles.actions}>
          <button
            onClick={onClose}
            className={`${styles.button} ${styles.cancelButton}`}
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ProfileRewardModal;
