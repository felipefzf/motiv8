import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { canvasPreview, getCanvasBlob } from '../utils/canvasPreview';
import { useAuth } from '../context/authContext';
import Modal from './modal'; // Tu componente Modal genérico
import styles from './CreateTeamForm.module.css'; // Reutilizamos estilos del form
import API_URL from '../config';

// Centrar el crop inicial
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth, mediaHeight
  );
}

function EditAvatarModal({ isOpen, onClose , showToast}) {
  const { refreshUser } = useAuth(); // Para actualizar la UI al terminar
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result.toString()));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const newCrop = centerAspectCrop(width, height, 1);
    setCrop(newCrop);
    setCompletedCrop(newCrop);
  };

  const handleUpload = async () => {
    if (!imgSrc || !completedCrop || !imgRef.current || !canvasRef.current) return;

    setIsLoading(true);
    try {
      // 1. Generar el Blob recortado
      canvasPreview(imgRef.current, canvasRef.current, completedCrop);
      const blob = await getCanvasBlob(canvasRef.current);

      // 2. Preparar FormData
      const formData = new FormData();
      // La llave debe coincidir con backend: 'profileImageFile'
      formData.append('profileImageFile', blob, 'avatar.jpg'); 

      // 3. Enviar al Backend
      const token = localStorage.getItem('firebaseToken');
      const response = await fetch(`${API_URL}/api/users/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error('Error al subir imagen');

      // 4. Éxito
      
      await refreshUser(); // Actualiza el contexto para mostrar la nueva foto
      onClose(); // Cierra el modal
      showToast('Foto de perfil actualizada!');
      setImgSrc(''); // Limpia

    } catch (error) {
      console.error(error);
      showToast('Error al actualizar la foto.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.form} style={{textAlign: 'center'}}>
        <h2 className={styles.title}>Cambiar Foto de Perfil</h2>
        
        <div className={styles.inputGroup}>
          <input type="file" accept="image/*" onChange={onSelectFile} />
        </div>

        {!!imgSrc && (
          <div className={styles.cropContainer}>
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
            >
              <img ref={imgRef} alt="Upload" src={imgSrc} onLoad={onImageLoad} style={{ maxHeight: '300px' }} />
            </ReactCrop>
          </div>
        )}

        {/* Canvas oculto para procesamiento */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div className={styles.buttonContainer} style={{marginTop: 20, justifyContent: 'center'}}>
          <button onClick={onClose} className={styles.cancelButton} disabled={isLoading}>Cancelar</button>
          <button onClick={handleUpload} className={styles.submitButton} disabled={!imgSrc || isLoading}>
            {isLoading ? 'Subiendo...' : 'Guardar Foto'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default EditAvatarModal;