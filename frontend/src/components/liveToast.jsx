import { useEffect, useRef } from 'react';
import "./LiveToast.css";

export default function LiveToast({ message }) {
  const toastRef = useRef(null);

  useEffect(() => {
    if (message && toastRef.current) {
      const toast = new window.bootstrap.Toast(toastRef.current, { delay: 5000 });
      toast.show();
    }
  }, [message]);

  return (
    <div className="toast-container">
      <div
        ref={toastRef}
        className="toast"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="toast-header">
          <strong className="me-auto">Notificación</strong>
          <small>Ahora</small>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="toast"
            aria-label="Cerrar"
          ></button>
        </div>
        <div className="toast-body">
          {message}
        </div>
      </div>
    </div>
  );
}
