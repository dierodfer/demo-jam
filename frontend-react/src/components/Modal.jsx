import { useEffect } from 'react';

export default function Modal({ onClose, children, className = '', ...props }) {
  useEffect(() => {
    const alPulsar = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [onClose]);

  return (
    <div className="modal-overlay">
      <button type="button" className="modal-fondo" aria-label="Cerrar" tabIndex={-1} onClick={onClose} />
      <dialog className={`modal ${className}`.trim()} open aria-modal="true" {...props}>{children}</dialog>
    </div>
  );
}
