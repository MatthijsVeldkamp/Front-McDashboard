import React from 'react';
import { t, setLanguage, getCurrentLanguage } from '../utils/languages';

const SettingsModal = ({ isOpen, onClose }) => {
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    window.location.reload(); // Reload to apply new language
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-2xl bg-base-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl">Instellingen</h3>
          <button 
            onClick={onClose} 
            className="btn btn-sm btn-circle btn-ghost"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body p-4">
              <div className="flex flex-col gap-4 w-full">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Taal / Language</span>
                  </label>
                  <select 
                    className="select select-bordered w-full"
                    value={getCurrentLanguage()}
                    onChange={handleLanguageChange}
                  >
                    <option value="nl">Nederlands</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-action mt-6 flex justify-end">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {t('dashboard.modals.newServer.cancel')}
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}><i className="fas fa-times"></i></button>
      </form>
    </dialog>
  );
};

export default SettingsModal; 