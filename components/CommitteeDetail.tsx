import React, { useState, useMemo } from 'react';
import { Committee, Member, Payment, Draw, ShareType } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import Button from './shared/Button';
import AddMemberModal from './modals/AddMemberModal';
import RecordPaymentModal from './modals/RecordPaymentModal';
import RecordDrawModal from './modals/RecordDrawModal';
import ConfirmationModal from './shared/ConfirmationModal';
import { useCommitteeData } from '../hooks/useCommitteeData';

type CommitteeDetailProps = ReturnType<typeof useCommitteeData> & {
    committee: Committee;
};

const parseDateAsUTC = (dateString: string): Date => {
    if (!dateString) return new Date(0);
    const [year, month, day] = dateString.split('-').map(Number);
    // Create a date in UTC to prevent timezone shifts.
    return new Date(Date.UTC(year, month - 1, day));
};

const CommitteeDetail: React.FC<CommitteeDetailProps> = (props) => {
    const { committee, members, payments, draws, addMember, updateMember, deleteMember, addPayment, deletePayment, addDraw, deleteDraw } = props;
    const { t, language } = useTranslation();
    const locale = language === 'ur' ? 'ur-PK' : 'en-US';

    const [isAddMemberModalOpen, setAddMemberModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

    const [isRecordPaymentModalOpen, setRecordPaymentModalOpen] = useState(false);
    const [paymentContext, setPaymentContext] = useState<{ memberIdOrPairId?: string; monthYear?: string }>({});
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

    const [isRecordDrawModalOpen, setRecordDrawModalOpen] = useState(false);
    const [editingDraw, setEditingDraw] = useState<Draw | null>(null);
    const [drawToDelete, setDrawToDelete] = useState<Draw | null>(null);
    
    const committeeMembers = useMemo(() => members.filter(m => m.committeeId === committee.id), [members, committee.id]);
    const committeePayments = useMemo(() => payments.filter(p => p.committeeId === committee.id), [payments, committee.id]);
    const committeeDraws = useMemo(() => draws.filter(d => d.committeeId === committee.id), [draws, committee.id]);

    const handleEditMember = (member: Member) => {
        setEditingMember(member);
        setAddMemberModalOpen(true);
    };

    const handleSaveMember = (memberData: Omit<Member, 'id'> | Member) => {
        if ('id' in memberData) {
            updateMember(memberData as Member);
        } else {
            addMember(memberData as Omit<Member, 'id'>);
        }
    };
    
    const handleRecordPaymentClick = (memberIdOrPairId: string, monthYear: string) => {
        setPaymentContext({ memberIdOrPairId, monthYear });
        setEditingPayment(null);
        setRecordPaymentModalOpen(true);
    }
    
    const handleEditPaymentClick = (payment: Payment) => {
        setEditingPayment(payment);
        setPaymentContext({});
        setRecordPaymentModalOpen(true);
    }

    const MemberCard = ({ member }: { member: Member }) => (
        <div className="bg-base-300 p-3 rounded-lg flex justify-between items-center">
            <div>
                <p className="font-semibold">{member.name}</p>
                <p className="text-sm text-gray-400">{member.phone}</p>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => handleEditMember(member)} className="text-gray-400 hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                <button onClick={() => setMemberToDelete(member)} className="text-gray-400 hover:text-error"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
            </div>
        </div>
    );
    
    const membersByShare = useMemo(() => {
        const full = committeeMembers.filter(m => m.shareType === ShareType.FULL);
        const half = committeeMembers.filter(m => m.shareType === ShareType.HALF);
        const pairs = half.reduce((acc, member) => {
            if (member.pairId) {
                if (!acc[member.pairId]) acc[member.pairId] = [];
                acc[member.pairId].push(member);
            }
            return acc;
        }, {} as Record<string, Member[]>);
        return { full, pairs };
    }, [committeeMembers]);
    
    const paymentsGrid = useMemo(() => {
        const startDate = parseDateAsUTC(committee.startDate);
        const months = Array.from({ length: committee.durationMonths }, (_, i) => {
            const date = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + i, 1));
            return date.toISOString().slice(0, 7); // YYYY-MM
        });

        const memberRows = [
            ...membersByShare.full.map(m => ({ id: m.id, name: m.name })),
            ...Object.entries(membersByShare.pairs).map(([pairId, pairMembers]) => ({
                id: pairId,
                name: pairMembers.map(m => m.name).join(' & '),
            }))
        ];
        
        return { months, memberRows };
    }, [committee.startDate, committee.durationMonths, membersByShare]);

    const paymentsMap = useMemo(() => {
        return committeePayments.reduce((acc, p) => {
            acc[`${p.memberIdOrPairId}-${p.monthYear}`] = p;
            return acc;
        }, {} as Record<string, Payment>);
    }, [committeePayments]);

    const completedMonths = useMemo(() => {
        const { months, memberRows } = paymentsGrid;
        const completed = new Set<string>();

        if (memberRows.length === 0) {
            return completed;
        }

        for (const month of months) {
            const allPaid = memberRows.every(row => !!paymentsMap[`${row.id}-${month}`]);
            if (allPaid) {
                completed.add(month);
            }
        }
        return completed;
    }, [paymentsGrid, paymentsMap]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-base-200 p-6 rounded-lg shadow-lg">
                <h2 className="text-3xl font-bold text-primary">{committee.name}</h2>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-sm text-gray-400">{t('monthlyAmount')}</p>
                        <p className="text-xl font-semibold">PKR {committee.monthlyAmount.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">{t('duration')}</p>
                        <p className="text-xl font-semibold">{committee.durationMonths} {t('months')}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">{t('totalPayout')}</p>
                        <p className="text-xl font-semibold">PKR {(committee.monthlyAmount * committee.durationMonths).toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">{t('startDate')}</p>
                        <p className="text-xl font-semibold">{parseDateAsUTC(committee.startDate).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}</p>
                    </div>
                </div>
            </div>

            {/* Members Section */}
            <div className="bg-base-200 p-6 rounded-lg shadow-lg">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">{t('members')} ({committeeMembers.length})</h3>
                    <Button onClick={() => { setEditingMember(null); setAddMemberModalOpen(true); }}>{t('addMember')}</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {membersByShare.full.map(m => <MemberCard key={m.id} member={m} />)}
                    {Object.entries(membersByShare.pairs).map(([pairId, pairMembers]) => (
                         <div key={pairId} className="bg-base-300 p-3 rounded-lg flex flex-col gap-2">
                             {pairMembers.map(m => <MemberCard key={m.id} member={m} />)}
                         </div>
                    ))}
                </div>
            </div>

            {/* Payments Section */}
            <div className="bg-base-200 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">{t('payments')}</h3>
                    <Button onClick={() => { setEditingPayment(null); setPaymentContext({}); setRecordPaymentModalOpen(true); }}>{t('recordPayment')}</Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left table-auto">
                        <thead className="text-xs text-gray-400 uppercase bg-base-300">
                            <tr>
                                <th scope="col" className="p-3 w-48 sticky left-0 bg-base-300">{t('memberPair')}</th>
                                {paymentsGrid.months.map(month => {
                                    const isMonthComplete = completedMonths.has(month);
                                    return (
                                        <th key={month} scope="col" className={`p-3 w-32 text-center ${isMonthComplete ? 'text-success font-bold' : ''}`}>
                                            {(() => {
                                                const [y, m] = month.split('-').map(Number);
                                                return new Date(Date.UTC(y, m - 1, 2)).toLocaleString(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' });
                                            })()}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {paymentsGrid.memberRows.map(row => (
                                <tr key={row.id} className="border-b border-base-300">
                                    <th scope="row" className="p-3 font-medium truncate sticky left-0 bg-base-200">{row.name}</th>
                                    {paymentsGrid.months.map(month => {
                                        const payment = paymentsMap[`${row.id}-${month}`];
                                        return (
                                            <td key={month} className="p-2 text-center align-middle">
                                                {payment ? (
                                                    <div className={`p-2 rounded-md text-black cursor-pointer ${payment.lateDays > 0 ? 'bg-warning' : 'bg-success'}`} onClick={() => handleEditPaymentClick(payment)}>
                                                        <p className="font-bold">{t('paid')}</p>
                                                        <p className="text-xs">{parseDateAsUTC(payment.datePaid).toLocaleDateString(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' })}</p>
                                                        {payment.lateDays > 0 && <p className="text-xs">{t('late')} {payment.lateDays} {t('days')}</p>}
                                                    </div>
                                                ) : (
                                                    <button onClick={() => handleRecordPaymentClick(row.id, month)} className="w-full h-full text-gray-400 hover:bg-base-300 rounded-md transition-colors">{t('unpaid')}</button>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
             {/* Draws Section */}
            <div className="bg-base-200 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">{t('draws')}</h3>
                    {committeeDraws.length < committee.durationMonths && <Button onClick={() => { setEditingDraw(null); setRecordDrawModalOpen(true); }}>{t('recordDraw')}</Button>}
                </div>
                 <div className="space-y-3">
                    {committeeDraws.sort((a,b) => a.monthYear.localeCompare(b.monthYear)).map(draw => {
                        const winner = paymentsGrid.memberRows.find(r => r.id === draw.winnerIdOrPairId);
                        return (
                            <div key={draw.id} className="bg-base-300 p-3 rounded-lg flex justify-between items-center flex-wrap gap-2">
                                <div className='flex-grow'>
                                    <p className="font-semibold">{winner?.name || 'N/A'}</p>
                                    <p className="text-sm text-gray-400">{t('month')}: {(() => {
                                        const [y, m] = draw.monthYear.split('-').map(Number);
                                        return new Date(Date.UTC(y, m - 1, 2)).toLocaleString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
                                    })()}</p>
                                </div>
                                 <div className="flex items-center gap-4">
                                    <p className="text-sm text-gray-400 text-end">{t('payoutDate')}:<br/> {parseDateAsUTC(draw.payoutDate).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}</p>
                                    <p className="font-semibold text-end">PKR {draw.amount.toLocaleString()}</p>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => {setEditingDraw(draw); setRecordDrawModalOpen(true);}} className="text-gray-400 hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                                        <button onClick={() => setDrawToDelete(draw)} className="text-gray-400 hover:text-error"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modals */}
            <AddMemberModal
                isOpen={isAddMemberModalOpen}
                onClose={() => setAddMemberModalOpen(false)}
                onSave={handleSaveMember}
                committee={committee}
                members={committeeMembers}
                editingMember={editingMember}
            />

            <RecordPaymentModal
                isOpen={isRecordPaymentModalOpen}
                onClose={() => setRecordPaymentModalOpen(false)}
                onSave={addPayment}
                committee={committee}
                members={committeeMembers}
                memberIdOrPairId={paymentContext.memberIdOrPairId}
                monthYear={paymentContext.monthYear}
                editingPayment={editingPayment}
            />

            <RecordDrawModal
                isOpen={isRecordDrawModalOpen}
                onClose={() => setRecordDrawModalOpen(false)}
                onSave={addDraw}
                committee={committee}
                members={committeeMembers}
                draws={committeeDraws}
                editingDraw={editingDraw}
            />
            
            <ConfirmationModal
                isOpen={!!memberToDelete}
                onClose={() => setMemberToDelete(null)}
                onConfirm={() => {
                    if (memberToDelete) deleteMember(memberToDelete.id);
                    setMemberToDelete(null);
                }}
                title={t('deleteMemberConfirm')}
                message={<span dangerouslySetInnerHTML={{ __html: t('deleteMemberMessage', { memberName: memberToDelete?.name || '' }) }} />}
            />

            <ConfirmationModal
                isOpen={!!drawToDelete}
                onClose={() => setDrawToDelete(null)}
                onConfirm={() => {
                    if (drawToDelete) deleteDraw(drawToDelete.id);
                    setDrawToDelete(null);
                }}
                title={t('deleteDrawConfirm')}
                message={t('deleteDrawMessage')}
            />
        </div>
    );
};

export default CommitteeDetail;