import { useState, useEffect, useCallback } from 'react';
import { Committee, Member, Payment, Draw, ShareType } from '../types';
import { v4 as uuidv4 } from 'uuid';

const LOCAL_STORAGE_KEY = 'kameeti-data';
const MAX_HISTORY_SIZE = 20;

interface AppState {
  committees: Committee[];
  members: Member[];
  payments: Payment[];
  draws: Draw[];
}

const getInitialState = (): AppState => {
  try {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      // Basic validation
      if (parsed.committees && parsed.members && parsed.payments && parsed.draws) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to parse from localStorage", error);
  }
  return { committees: [], members: [], payments: [], draws: [] };
};

const calculateDuration = (committeeId: string, members: Member[]): number => {
    const committeeMembers = members.filter(m => m.committeeId === committeeId);
    const fullShareCount = committeeMembers.filter(m => m.shareType === ShareType.FULL).length;
    const halfShareMembers = committeeMembers.filter(m => m.shareType === ShareType.HALF);

    if (halfShareMembers.length < 2) {
        return fullShareCount;
    }
    
    // Group members by their pairId
    const membersByPairId = halfShareMembers.reduce((acc, member) => {
        if (member.pairId) {
            if (!acc[member.pairId]) {
                acc[member.pairId] = [];
            }
            acc[member.pairId].push(member);
        }
        return acc;
    }, {} as Record<string, Member[]>);

    // Count how many of those groups represent a valid pair (i.e., have 2 members)
    const pairCount = Object.values(membersByPairId).filter(group => group.length === 2).length;
    
    return fullShareCount + pairCount;
};

const parseDateAsUTC = (dateString: string): Date => {
    if (!dateString) return new Date(0);
    const [year, month, day] = dateString.split('-').map(Number);
    // Create a date in UTC to prevent timezone shifts.
    return new Date(Date.UTC(year, month - 1, day));
};

export const useCommitteeData = () => {
  const [state, setState] = useState<AppState>(getInitialState);
  const [history, setHistory] = useState<AppState[]>([]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updateStateAndHistory = useCallback((newState: AppState | ((prevState: AppState) => AppState)) => {
    setState(prevState => {
      const oldState = prevState;
      const updatedState = typeof newState === 'function' ? newState(oldState) : newState;

      setHistory(prevHistory => {
        const newHistory = [oldState, ...prevHistory];
        if (newHistory.length > MAX_HISTORY_SIZE) {
          return newHistory.slice(0, MAX_HISTORY_SIZE);
        }
        return newHistory;
      });
      return updatedState;
    });
  }, []);

  const undo = () => {
    if (history.length > 0) {
      const [lastState, ...rest] = history;
      setState(lastState);
      setHistory(rest);
    }
  };

  const addCommittee = (committee: Omit<Committee, 'id' | 'durationMonths'>) => {
    const newCommittee = { ...committee, id: uuidv4(), durationMonths: 0 };
    updateStateAndHistory(prev => ({
      ...prev,
      committees: [...prev.committees, newCommittee],
    }));
  };

  const updateCommittee = (committeeUpdate: Omit<Committee, 'id' | 'durationMonths'> & { id: string }) => {
    updateStateAndHistory(prev => {
      const existingCommittee = prev.committees.find(c => c.id === committeeUpdate.id);
      if (!existingCommittee) return prev;

      if (!committeeUpdate.allowHalfShare) {
        const hasHalfShareMembers = prev.members.some(m => m.committeeId === committeeUpdate.id && m.shareType === ShareType.HALF);
        if (hasHalfShareMembers) {
          alert("Cannot disable half-shares when half-share members exist.");
          return prev;
        }
      }
      
      const updatedCommittee = { ...existingCommittee, ...committeeUpdate };

      return {
        ...prev,
        committees: prev.committees.map(c => c.id === updatedCommittee.id ? updatedCommittee : c),
      };
    });
  };

  const deleteCommittee = (id: string) => {
    updateStateAndHistory(prev => ({
      ...prev,
      committees: prev.committees.filter(c => c.id !== id),
      members: prev.members.filter(m => m.committeeId !== id),
      payments: prev.payments.filter(p => p.committeeId !== id),
      draws: prev.draws.filter(d => d.committeeId !== id),
    }));
  };

  const addMember = (member: Omit<Member, 'id'>) => {
    const newMember: Member = { ...member, id: uuidv4() };

    updateStateAndHistory(prev => {
        let updatedMembers = [...prev.members];
        
        if (newMember.shareType === ShareType.HALF) {
            const partnerId = newMember.pairId;
            if (partnerId) {
                 const partnerIndex = updatedMembers.findIndex(m => m.id === partnerId);
                 if (partnerIndex > -1) {
                     const commonPairId = newMember.id < partnerId ? newMember.id : partnerId;
                     newMember.pairId = commonPairId;
                     updatedMembers[partnerIndex] = { ...updatedMembers[partnerIndex], pairId: commonPairId };
                 } else {
                    newMember.pairId = newMember.id;
                 }
            } else {
                newMember.pairId = newMember.id;
            }
        }
        updatedMembers.push(newMember);

        const newDuration = calculateDuration(newMember.committeeId, updatedMembers);
        const updatedCommittees = prev.committees.map(c => 
            c.id === newMember.committeeId ? { ...c, durationMonths: newDuration } : c
        );

        return {
            ...prev,
            members: updatedMembers,
            committees: updatedCommittees,
        };
    });
  };

  const updateMember = (updatedMember: Member) => {
    updateStateAndHistory(prev => {
        const originalMember = prev.members.find(m => m.id === updatedMember.id);
        if (!originalMember) return prev;

        const newPartnerIdFromModal = updatedMember.pairId || '';
        const originalPartner = (originalMember.shareType === ShareType.HALF)
            ? prev.members.find(m => m.pairId === originalMember.pairId && m.id !== originalMember.id)
            : undefined;

        let membersAfterUpdate = [...prev.members];

        if (originalPartner) {
            const originalPartnerIndex = membersAfterUpdate.findIndex(m => m.id === originalPartner.id);
            if(originalPartnerIndex > -1) {
                membersAfterUpdate[originalPartnerIndex] = {...membersAfterUpdate[originalPartnerIndex], pairId: originalPartner.id };
            }
        }

        if (newPartnerIdFromModal) {
            const newPartnerIndex = membersAfterUpdate.findIndex(m => m.id === newPartnerIdFromModal);
            if (newPartnerIndex > -1) {
                const commonPairId = updatedMember.id < newPartnerIdFromModal ? updatedMember.id : newPartnerIdFromModal;
                updatedMember.pairId = commonPairId;
                membersAfterUpdate[newPartnerIndex] = { ...membersAfterUpdate[newPartnerIndex], pairId: commonPairId };
            } else {
                updatedMember.pairId = updatedMember.id;
            }
        } else {
            updatedMember.pairId = updatedMember.id;
        }
        
        const finalMemberIndex = membersAfterUpdate.findIndex(m => m.id === updatedMember.id);
        if (finalMemberIndex > -1) {
            membersAfterUpdate[finalMemberIndex] = updatedMember;
        }
        
        const newDuration = calculateDuration(updatedMember.committeeId, membersAfterUpdate);
        const updatedCommittees = prev.committees.map(c => 
            c.id === updatedMember.committeeId ? { ...c, durationMonths: newDuration } : c
        );

        return { ...prev, members: membersAfterUpdate, committees: updatedCommittees };
    });
  };

  const deleteMember = (id: string) => {
    updateStateAndHistory(prev => {
        const memberToDelete = prev.members.find(m => m.id === id);
        if (!memberToDelete) return prev;
        
        const partner = (memberToDelete.shareType === ShareType.HALF) 
            ? prev.members.find(m => m.pairId === memberToDelete.pairId && m.id !== memberToDelete.id)
            : undefined;

        let newMembers = prev.members.filter(m => m.id !== id);

        if (partner) {
            const partnerIndex = newMembers.findIndex(m => m.id === partner.id);
            if (partnerIndex > -1) {
                newMembers[partnerIndex] = { ...newMembers[partnerIndex], pairId: partner.id };
            }
        }
        
        const newDuration = calculateDuration(memberToDelete.committeeId, newMembers);
        const committeeDraws = prev.draws.filter(d => d.committeeId === memberToDelete.committeeId);
        
        if (newDuration < committeeDraws.length) {
            alert("Cannot delete member. This would make the committee duration shorter than the number of completed draws.");
            return prev; // Abort state update
        }

        const updatedCommittees = prev.committees.map(c => 
            c.id === memberToDelete.committeeId ? { ...c, durationMonths: newDuration } : c
        );

        return {
            ...prev,
            members: newMembers,
            committees: updatedCommittees,
        };
    });
  };
  
  const calculateDemerits = (payment: Omit<Payment, 'id' | 'lateDays' | 'demeritPoints'>) => {
      const paidDate = parseDateAsUTC(payment.datePaid);
      const [year, month] = payment.monthYear.split('-').map(Number);
      const dueDate = new Date(Date.UTC(year, month - 1, 10)); // Due on the 10th, UTC.

      const timeDiff = paidDate.getTime() - dueDate.getTime();
      // Only count days if paid *after* the due date.
      const lateDays = timeDiff > 0 ? Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) : 0;
      const demeritPoints = lateDays;

      return { lateDays, demeritPoints };
  }

  const handleAddPayment = (payment: Omit<Payment, 'id' | 'lateDays' | 'demeritPoints'>) => {
    const { lateDays, demeritPoints } = calculateDemerits(payment);
    const newPayment = { ...payment, id: uuidv4(), lateDays, demeritPoints };
    updateStateAndHistory(prev => ({
      ...prev,
      payments: [...prev.payments, newPayment],
    }));
  };
  
  const handleUpdatePayment = (updatedPayment: Omit<Payment, 'id' | 'lateDays' | 'demeritPoints'>, paymentId: string) => {
      const { lateDays, demeritPoints } = calculateDemerits(updatedPayment);
      const fullPaymentData = { ...updatedPayment, id: paymentId, lateDays, demeritPoints };
      updateStateAndHistory(prev => ({
        ...prev,
        payments: prev.payments.map(p => p.id === paymentId ? fullPaymentData : p),
      }));
  };

  const deletePayment = (id: string) => {
    updateStateAndHistory(prev => ({
      ...prev,
      payments: prev.payments.filter(p => p.id !== id),
    }));
  };

  const handleAddDraw = (draw: Omit<Draw, 'id'>) => {
    const newDraw = { ...draw, id: uuidv4() };
    updateStateAndHistory(prev => ({
      ...prev,
      draws: [...prev.draws, newDraw],
    }));
  };

  const handleUpdateDraw = (updatedDraw: Omit<Draw, 'id'>, drawId: string) => {
    const fullDrawData = { ...updatedDraw, id: drawId };
    updateStateAndHistory(prev => ({
        ...prev,
        draws: prev.draws.map(d => d.id === drawId ? fullDrawData : d),
    }));
  };

  const deleteDraw = (id: string) => {
    updateStateAndHistory(prev => ({
      ...prev,
      draws: prev.draws.filter(d => d.id !== id),
    }));
  };

  return {
    ...state,
    addCommittee,
    updateCommittee,
    deleteCommittee,
    addMember,
    updateMember,
    deleteMember,
    addPayment: (payment: Omit<Payment, 'id' | 'lateDays' | 'demeritPoints'>, paymentId?: string) => paymentId ? handleUpdatePayment(payment, paymentId) : handleAddPayment(payment),
    deletePayment,
    addDraw: (draw: Omit<Draw, 'id'>, drawId?: string) => drawId ? handleUpdateDraw(draw, drawId) : handleAddDraw(draw),
    deleteDraw,
    undo,
    canUndo: history.length > 0,
  };
};