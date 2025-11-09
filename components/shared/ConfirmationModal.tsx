import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { useTranslation } from '../../contexts/LanguageContext';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  const { t } = useTranslation();
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="text-gray-300 text-start">{message}</div>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
          <Button type="button" variant="accent" onClick={onConfirm}>{t('delete')}</Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
