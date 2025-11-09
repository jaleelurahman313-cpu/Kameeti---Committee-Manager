import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-base-200 rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 transform transition-all duration-300 scale-95 hover:scale-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-base-300 pb-3 mb-4">
          <h2 className="text-xl font-semibold text-primary">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
