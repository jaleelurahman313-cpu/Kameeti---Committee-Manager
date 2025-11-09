import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { Committee, Member, Payment, ShareType } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: Omit<Payment, 'id' | 'lateDays' | 'demeritPoints'>, paymentId?: string) => void;
  committee: Committee;
  members: Member[];
  memberIdOrPairId?: string;
  monthYear?: string;
  editingPayment?: Payment | null;
}

const parseDateAsUTC = (dateString: string): Date => {
    if (!dateString) return new Date(0);
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
};

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, onSave, committee, members, memberIdOrPairId, monthYear, editingPayment }) => {
  const [selectedMemberId, setSelectedMemberId] = useState(memberIdOrPairId || '');
  const [selectedMonth, setSelectedMonth] = useState(monthYear || '');
  const [datePaid, setDatePaid] = useState(new Date().toISOString().slice(0, 10));
  const { t, language } = useTranslation();
  const locale = language === 'ur' ? 'ur-PK' : 'en-US';
  
  const amount = committee.monthlyAmount;

  useEffect(() => {
    if (isOpen) {
      if (editingPayment) {
        setSelectedMemberId(editingPayment.memberIdOrPairId);
        setSelectedMonth(editingPayment.monthYear);
        setDatePaid(editingPayment.datePaid);
      } else {
        setSelectedMemberId(memberIdOrPairId || '');
        setSelectedMonth(monthYear || '');
        setDatePaid(new Date().toISOString().slice(0, 10));
      }
    }
  }, [isOpen, memberIdOrPairId, monthYear, editingPayment]);

  const memberRows = useMemo(() => {
    const full = members.filter(m => m.shareType === ShareType.FULL);
    const pairs = Object.values(members.reduce((acc, m) => {
        if (m.shareType === ShareType.HALF && m.pairId) {
            if (!acc[m.pairId]) acc[m.pairId] = { id: m.pairId, name: '', members: [] };
            acc[m.pairId].members.push(m);
            acc[m.pairId].name = acc[m.pairId].members.map(mem => mem.name).join(' & ');
        }
        return acc;
    }, {} as { [key: string]: { id: string; name: string, members: Member[] } }));
    return [...full, ...pairs];
  }, [members]);

  const months = useMemo(() => {
    const start = parseDateAsUTC(committee.startDate);
    return Array.from({ length: committee.durationMonths }, (_, i) => {
        const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
        return date.toISOString().slice(0, 7); // YYYY-MM
    });
  }, [committee.startDate, committee.durationMonths]);

  const memberName = useMemo(() => {
    const member = memberRows.find(m => m.id === selectedMemberId);
    return member ? member.name : "N/A";
  }, [memberRows, selectedMemberId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
     if (!selectedMemberId || !selectedMonth) {
        alert(t('pleaseFillAllFields'));
        return;
    }
    const paymentData = {
      committeeId: committee.id,
      monthYear: selectedMonth,
      memberIdOrPairId: selectedMemberId,
      amount,
      datePaid,
    };

    onSave(paymentData, editingPayment?.id);
    onClose();
  };

  const isEditing = !!editingPayment;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? t('editPaymentTitle') : t('recordPaymentTitle')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1 text-start">{t('memberPair')}</label>
          {memberIdOrPairId || isEditing ? (
            <input type="text" value={memberName} className="w-full bg-base-300 rounded-md border border-gray-600 px-3 py-2" readOnly />
          ) : (
            <select value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)} className="w-full bg-base-300 rounded-md border border-gray-600 px-3 py-2 focus:ring-primary focus:border-primary" required>
              <option value="" disabled>{t('selectMemberPair')}</option>
              {memberRows.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1 text-start">{t('month')}</label>
          {monthYear || isEditing ? (
              <input type="text" value={(() => {
                  if (!selectedMonth) return '';
                  const [y, m] = selectedMonth.split('-').map(Number);
                  return new Date(Date.UTC(y, m - 1, 2)).toLocaleString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
              })()} className="w-full bg-base-300 rounded-md border border-gray-600 px-3 py-2" readOnly />
          ) : (
             <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full bg-base-300 rounded-md border border-gray-600 px-3 py-2 focus:ring-primary focus:border-primary" required>
                <option value="" disabled>{t('selectMonth')}</option>
                {months.map(m => <option key={m} value={m}>{(() => {
                    const [y, mon] = m.split('-').map(Number);
                    return new Date(Date.UTC(y, mon - 1, 2)).toLocaleString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
                })()}</option>)}
            </select>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 text-start">{t('amount')}</label>
              <input type="text" value={`PKR ${amount.toLocaleString(locale)}`} className="w-full bg-base-300 rounded-md border border-gray-600 px-3 py-2" readOnly />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 text-start">{t('datePaid')}</label>
                <input type="date" value={datePaid} onChange={e => setDatePaid(e.target.value)} className="w-full bg-base-300 rounded-md border border-gray-600 px-3 py-2 focus:ring-primary focus:border-primary" required />
            </div>
        </div>
         <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
          <Button type="submit">{isEditing ? t('saveChanges') : t('recordPayment')}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default RecordPaymentModal;