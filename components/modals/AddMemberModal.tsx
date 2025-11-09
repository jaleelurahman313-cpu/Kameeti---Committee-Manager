import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { Committee, Member, ShareType } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<Member, 'id'> | Member) => void;
  committee: Committee;
  members: Member[];
  editingMember?: Member | null;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, onSave, committee, members, editingMember }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [shareType, setShareType] = useState<ShareType>(ShareType.FULL);
  const [partnerId, setPartnerId] = useState('');
  const { t } = useTranslation();

  const resetForm = () => {
    setName('');
    setPhone('');
    setShareType(ShareType.FULL);
    setPartnerId('');
  };

  const unpairedHalfShareMembers = useMemo(() => {
    return members.filter(m => 
        m.committeeId === committee.id &&
        m.shareType === ShareType.HALF &&
        m.pairId === m.id && // They are not paired with anyone else
        (!editingMember || m.id !== editingMember.id) // Exclude the member being edited
    );
  }, [members, committee.id, editingMember]);

  useEffect(() => {
    if (isOpen) {
        if (editingMember) {
            setName(editingMember.name);
            setPhone(editingMember.phone);
            setShareType(editingMember.shareType);
            if (editingMember.shareType === ShareType.HALF && editingMember.pairId !== editingMember.id) {
                setPartnerId(editingMember.pairId || '');
            } else {
                setPartnerId('');
            }
        } else {
            resetForm();
        }
    }
  }, [editingMember, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
        alert(t('pleaseFillAllFields'));
        return;
    }
    
    let memberData: Omit<Member, 'id' | 'pairId'> & { pairId?: string } = {
        name,
        phone,
        shareType,
        committeeId: committee.id,
    };

    if (shareType === ShareType.HALF) {
        memberData.pairId = partnerId; // Pass partnerId (or empty string for unpairing) to the hook
    }

    if (editingMember) {
      onSave({ ...memberData, id: editingMember.id });
    } else {
      onSave(memberData as Omit<Member, 'id'>);
    }
    
    onClose();
  };
  
  const handleShareTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newType = e.target.value as ShareType;
      setShareType(newType);
      if (newType === ShareType.FULL) {
          setPartnerId('');
      }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingMember ? t('editMemberTitle') : t('addMemberTitle')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1 text-start">{t('memberName')}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-base-300 rounded-md border border-gray-600 px-3 py-2 focus:ring-primary focus:border-primary" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1 text-start">{t('phone')}</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-base-300 rounded-md border border-gray-600 px-3 py-2 focus:ring-primary focus:border-primary" required />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 text-start">{t('shareType')}</label>
            <select value={shareType} onChange={handleShareTypeChange} className="w-full bg-base-300 rounded-md border border-gray-600 px-3 py-2 focus:ring-primary focus:border-primary disabled:bg-base-300/50 disabled:cursor-not-allowed" disabled={!!editingMember}>
                <option value={ShareType.FULL}>{t('fullShare')}</option>
                {committee.allowHalfShare && <option value={ShareType.HALF}>{t('halfShare')}</option>}
            </select>
        </div>
        
        {shareType === ShareType.HALF && (
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 text-start">{t('pairWith')}</label>
                <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="w-full bg-base-300 rounded-md border border-gray-600 px-3 py-2 focus:ring-primary focus:border-primary">
                    <option value="">{t('selectPartner')}</option>
                    {unpairedHalfShareMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                {unpairedHalfShareMembers.length === 0 && !partnerId && <p className="text-xs text-gray-400 mt-1">{t('noPartnerAvailable')}</p>}
            </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
          <Button type="submit">{editingMember ? t('saveChanges') : t('addMember')}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddMemberModal;