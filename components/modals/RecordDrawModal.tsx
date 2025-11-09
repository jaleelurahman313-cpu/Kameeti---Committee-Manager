import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { Committee, Member, Draw, ShareType } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';

interface RecordDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (draw: Omit<Draw, 'id'>, drawId?: string) => void;
  committee: Committee;
  members: Member[];
  draws: Draw[];
  editingDraw?: Draw | null;
}

const parseDateAsUTC = (dateString: string): Date => {
    if (!dateString) return new Date(0);
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
};

const RecordDrawModal: React.FC<RecordDrawModalProps> = ({ isOpen, onClose, onSave, committee, members, draws, editingDraw }) => {
  const { t, language } = useTranslation();
  const locale = language === 'ur' ? 'ur-PK' : 'en-US';

  const eligibleWinners = useMemo(() => {
    const wonIds = new Set(draws.filter(d => d.committeeId === committee.id).map(d => d.winnerIdOrPairId));
    const fullMembers = members.filter(m => m.shareType === ShareType.FULL && !wonIds.has(m.id));
    const pairs = Object.values(members.reduce((acc, m) => {
        if (m.shareType === ShareType.HALF && m.pairId && !wonIds.has(m.pairId)) {
            if (!acc[m.pairId]) acc[m.pairId] = { id: m.pairId, name: '', members: [] };
            acc[m.pairId].members.push(m);
            acc[m.pairId].name = acc[m.pairId].members.map(mem => mem.name).join(' & ');
        }
        return acc;
    }, {} as { [key: string]: { id: string; name: string, members: Member[] } }));
    
    if (editingDraw) {
        const winnerId = editingDraw.winnerIdOrPairId;
        const winnerInMembers = members.find(m => m.id === winnerId)
        const pairMembers = members.filter(m => m.pairId === winnerId);
        
        if (winnerInMembers) {
            return [{ id: winnerId, name: winnerInMembers.name }, ...fullMembers, ...pairs];
        }
        if (pairMembers.length > 0) {
             return [{ id: winnerId, name: pairMembers.map(m => m.name).join(' & ') }, ...fullMembers, ...pairs];
        }
    }
    
    return [...fullMembers, ...pairs];
  }, [members, draws, committee.id, editingDraw]);
  
  const currentMonthYear = useMemo(() => {
    if (editingDraw) return editingDraw.monthYear;
    const startDate = parseDateAsUTC(committee.startDate);
    const committeeDrawsCount = draws.filter(d => d.committeeId === committee.id).length;
    const date = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + committeeDrawsCount, 1));
    return date.toISOString().slice(0, 7); // YYYY-MM
  }, [committee, draws, editingDraw]);

  const [winnerId, setWinnerId] = useState('');
  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (isOpen) {
        if (editingDraw) {
            setWinnerId(editingDraw.winnerIdOrPairId);
            setPayoutDate(editingDraw.payoutDate);
        } else {
            setWinnerId(eligibleWinners[0]?.id || '');
            setPayoutDate(new Date().toISOString().slice(0, 10));
        }
    }
  }, [isOpen, editingDraw, eligibleWinners]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!winnerId) {
        alert(t('pleaseFillAllFields'));
        return;
    }
    const drawData = {
      committeeId: committee.id,
      monthYear: currentMonthYear,
      winnerIdOrPairId: winnerId,
      payoutDate,
      amount: committee.monthlyAmount * committee.durationMonths,
    };
    
    onSave(drawData, editingDraw?.id);
    onClose();
  };

  const isEditing = !!editingDraw;
  const modalTitle = isEditing ? t('editDrawTitle') : t('recordDrawFor', {
    monthYear: (() => {
        if (!currentMonthYear) return '';
        const [y, m] = currentMonthYear.split('-').map(Number);
        return new Date(Date.UTC(y, m - 1, 2)).toLocaleString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
    })()
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1 text-start">{t('selectWinner')}</label>
          <select value={winnerId} onChange={(e) => setWinnerId(e.target.value)} className="w-full bg-base-300 rounded-md border border-gray-600 px-3 py-2 focus:ring-primary focus:border-primary disabled:bg-base-300/50 disabled:cursor-not-allowed" required disabled={isEditing}>
            <option value="" disabled>{t('selectMemberOrPair')}</option>
            {eligibleWinners.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 text-start">{t('payoutAmount')}</label>
              <input type="text" value={`PKR ${(committee.monthlyAmount * committee.durationMonths).toLocaleString(locale)}`} className="w-full bg-base-300 rounded-md border border-gray-600 px-3 py-2" readOnly />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 text-start">{t('payoutDate')}</label>
                <input type="date" value={payoutDate} onChange={e => setPayoutDate(e.target.value)} className="w-full bg-base-300 rounded-md border border-gray-600 px-3 py-2 focus:ring-primary focus:border-primary" required />
            </div>
        </div>
        {!isEditing && eligibleWinners.length === 0 && (
            <p className="text-center text-yellow-400">{t('noEligibleWinners')}</p>
        )}
         <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
          <Button type="submit" disabled={!isEditing && eligibleWinners.length === 0}>{isEditing ? t('saveChanges') : t('recordDraw')}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default RecordDrawModal;