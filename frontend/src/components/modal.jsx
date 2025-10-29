import React from 'react';
import styles from './Modal.module.css'; // We'll create this CSS file

function Modal({ isOpen, onClose, children }) {
  if (!isOpen) {
    return null;
  }

  // Prevents closing modal when clicking inside the content
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    // Backdrop overlay
    <div className={styles.modalBackdrop} onClick={onClose}>
      {/* Modal content */}
      <div className={styles.modalContent} onClick={handleContentClick}>
        {/* Close button */}
        <button className={styles.closeButton} onClick={onClose}>&times;</button>
        {/* The actual form or content goes here */}
        {children}
      </div>
    </div>
  );
}

export default Modal;