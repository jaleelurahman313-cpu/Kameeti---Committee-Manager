import React, { useState } from 'react';
import { Committee } from '../types';
import CreateCommitteeModal from './modals/CreateCommitteeModal';
import Button from './shared/Button';
import ConfirmationModal from './shared/ConfirmationModal';
import { useTranslation } from '../contexts/LanguageContext';

interface DashboardProps {
  committees: Committee[];
  onSelectCommittee: (id: string) => void;
  addCommittee: (committee: Omit<Committee, 'id' | 'durationMonths'>) => void;
  updateCommittee: (committee: Omit<Committee, 'id' | 'durationMonths'> & { id: string }) => void;
  deleteCommittee: (id: string) => void;
}

const EditButton: React.FC<{ onClick: (e: React.MouseEvent) => void; ariaLabel: string; }> = ({ onClick, ariaLabel }) => (
    <button onClick={onClick} className="text-gray-500 hover:text-primary" aria-label={ariaLabel}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
        </svg>
    </button>
);

const parseDateAsUTC = (dateString: string): Date => {
    if (!dateString) return new Date(0);
    const [year, month, day] = dateString.split('-').map(Number);
    // Create a date in UTC to prevent timezone shifts.
    return new Date(Date.UTC(year, month - 1, day));
};

const Dashboard: React.FC<DashboardProps> = ({ committees, onSelectCommittee, addCommittee, updateCommittee, deleteCommittee }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [committeeToDelete, setCommitteeToDelete] = useState<Committee | null>(null);
  const [committeeToEdit, setCommitteeToEdit] = useState<Committee | null>(null);
  const { t } = useTranslation();

  const handleDeleteClick = (e: React.MouseEvent, committee: Committee) => {
    e.stopPropagation();
    setCommitteeToDelete(committee);
  };
  
  const handleEditClick = (e: React.MouseEvent, committee: Committee) => {
    e.stopPropagation();
    setCommitteeToEdit(committee);
    setIsModalOpen(true);
  };
  
  const handleCreateClick = () => {
    setCommitteeToEdit(null);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setCommitteeToEdit(null);
  };
  
  const handleSaveCommittee = (committeeData: Omit<Committee, 'id' | 'durationMonths'> | (Omit<Committee, 'id' | 'durationMonths'> & { id: string })) => {
    if ('id' in committeeData) {
      updateCommittee(committeeData);
    } else {
      addCommittee(committeeData);
    }
  };

  const confirmDeletion = () => {
    if (committeeToDelete) {
      deleteCommittee(committeeToDelete.id);
      setCommitteeToDelete(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">{t('committees')}</h2>
        <Button onClick={handleCreateClick}>{t('createCommittee')}</Button>
      </div>
      
      {committees.length === 0 ? (
        <div className="text-center py-12 bg-base-200 rounded-lg">
          <p className="text-gray-400">{t('noCommittees')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {committees.map((committee) => {
            const startDate = parseDateAsUTC(committee.startDate);
            const now = new Date();
            
            const monthsPassed = Math.max(0, (now.getUTCFullYear() - startDate.getUTCFullYear()) * 12 + (now.getUTCMonth() - startDate.getUTCMonth()));
            const progress = committee.durationMonths > 0 ? Math.min(100, (monthsPassed / committee.durationMonths) * 100) : 0;
            const isComplete = committee.durationMonths > 0 && monthsPassed >= committee.durationMonths;
            const status = isComplete ? t('statusComplete') : t('statusActive');

            return (
              <div 
                key={committee.id}
                className="bg-base-200 p-6 rounded-lg shadow-lg hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group"
                onClick={() => onSelectCommittee(committee.id)}
              >
                <div className="absolute top-3 end-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <EditButton onClick={(e) => handleEditClick(e, committee)} ariaLabel={t('editCommitteeAria', { committeeName: committee.name })} />
                    <button 
                        onClick={(e) => handleDeleteClick(e, committee)}
                        className="text-gray-500 hover:text-error"
                        aria-label={t('deleteCommitteeAria', { committeeName: committee.name })}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
                 
                <div className="cursor-pointer">
                  <div className="flex justify-between items-start mb-2 pe-12">
                    <h3 className="text-xl font-semibold text-primary truncate">{committee.name}</h3>
                     <span className={`flex-shrink-0 ms-2 px-2 py-1 text-xs font-bold rounded-full ${isComplete ? 'bg-base-300 text-gray-300' : 'bg-success text-black'}`}>
                        {status}
                     </span>
                  </div>
                  <p className="text-gray-400 mt-2">{t('amount')}: <span className="font-medium text-white">PKR {committee.monthlyAmount.toLocaleString()}</span></p>
                  <p className="text-gray-400">{t('duration')}: <span className="font-medium text-white">{committee.durationMonths} {t('months')}</span></p>
                  <p className="text-gray-400">{t('totalPayout')}: <span className="font-medium text-white">PKR {(committee.monthlyAmount * committee.durationMonths).toLocaleString()}</span></p>
                </div>

                <div className="mt-4 cursor-pointer">
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                        <span>{t('progress')}</span>
                        <span>{Math.min(monthsPassed, committee.durationMonths)} / {committee.durationMonths} {t('monthsCounter')}</span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateCommitteeModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveCommittee}
        editingCommittee={committeeToEdit}
      />
      
      <ConfirmationModal
        isOpen={!!committeeToDelete}
        onClose={() => setCommitteeToDelete(null)}
        onConfirm={confirmDeletion}
        title={t('deleteCommitteeConfirm')}
        message={<span dangerouslySetInnerHTML={{ __html: t('deleteCommitteeMessage', { committeeName: committeeToDelete?.name || '' }) }} />}
      />
    </div>
  );
};

export default Dashboard;