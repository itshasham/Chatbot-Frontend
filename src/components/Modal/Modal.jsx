import React from 'react';
import './Modal.css';

const Modal = ({ onConfirm, onCancel }) => {
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h4>Clear chat</h4>
        <p>After clearing history you won't be able to access previous chats.</p>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-confirm" onClick={onConfirm}>Clear chat</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;