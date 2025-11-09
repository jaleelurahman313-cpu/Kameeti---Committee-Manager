import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { Committee } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';

type CommitteeFormData = Omit<Committee, 'id' | 'durationMonths'>;

interface CreateCommitteeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (committee: CommitteeFormData | (CommitteeFormData & { id: string })) => void;
  editingCommittee?: Committee | null;
}

const CreateCommitteeModal: React.FC<CreateCommitteeModalProps> = ({ isOpen, onClose, onSave, editingCommittee }) => {
  const [name, setName] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [allowHalfShare, setAllowHalfShare] = useState(false);
  const { t } = useTranslation();
  
  const resetForm = () => {
    setName('');
    setMonthlyAmount('');
    setStartDate('');
    setAllowHalfShare(false);
  };

  useEffect(() => {
    if (isOpen) {
        if (editingCommittee) {
            setName(editingCommittee.name);
            setMonthlyAmount(editingCommittee.monthlyAmount.toString());
            setStartDate(editingCommittee.startDate);
            setAllowHalfShare(editingCommittee.allowHalfShare);
        } else {
            resetForm();
        }
    }
  }, [editingCommittee, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !monthlyAmount || !startDate) {
      alert(t('pleaseFillAllFields'));
      return;
    }
    const committeeData: CommitteeFormData = {
      name,
      monthlyAmount: parseFloat(monthlyAmount),
      startDate,
      allowHalfShare,
    };
    
    if (editingCommittee) {
      onSave({ ...committeeData, id: editingCommittee.id });
    } else {
      onSave(committeeData);
    }
    
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingCommittee ? t('editCommitteeTitle') : t('createCommitteeTitle')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1 text-start">{t('committeeName')}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-base-300 rounded-md border border-gray-600 px-3 py-2 focus:ring-primary focus:border-primary" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1 text-start">{t('monthlyAmount')}</label>
          <input type="number" value={monthlyAmount} onChange={(e) => setMonthlyAmount(e.target.value)} className="w-full bg-base-300 rounded-md border border-gray-600 px-3 py-2 focus:ring-primary focus:border-primary" required />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 text-start">{t('startDate')}</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-base-300 rounded-md border border-gray-600 px-3 py-2 focus:ring-primary focus:border-primary" required />
        </div>
        <div className="flex items-center">
            <input type="checkbox" id="half-share" checked={allowHalfShare} onChange={(e) => setAllowHalfShare(e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-base-300 text-primary focus:ring-primary"/>
            <label htmlFor="half-share" className="ms-2 block text-sm text-gray-300">{t('allowHalfShare')}</label>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
          <Button type="submit">{editingCommittee ? t('saveChanges') : t('createCommittee')}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateCommitteeModal;