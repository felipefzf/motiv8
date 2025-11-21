import React from "react";
import Modal from "./modal"; // Tu componente Modal genérico
import "./InventoryModal.css";


function InventoryModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="inventory-container">
        <h2>Proximamente...</h2>
      </div>
    </Modal>
  );
}

export default InventoryModal;