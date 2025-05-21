import React, { useEffect, useState } from 'react';
import { t } from '../utils/languages';

const AddServerModal = ({ isOpen, onClose, onSubmit }) => {
  const [serverForm, setServerForm] = useState({ 
    name: '', 
    version: '', 
    ip_address: '', 
    port: '' 
  });

  useEffect(() => {
    if (!isOpen) {
      setServerForm({ name: '', version: '', ip_address: '', port: '' });
    }
  }, [isOpen]);

  const handleServerChange = (e) => {
    const { name, value } = e.target;
    setServerForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!serverForm.name || !serverForm.version || !serverForm.ip_address || !serverForm.port) {
      return;
    }
    onSubmit(serverForm);
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-2xl bg-base-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl">{t('dashboard.modals.newServer.title')}</h3>
          <button 
            onClick={onClose} 
            className="btn btn-sm btn-circle btn-ghost"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body p-4">
              <div className="flex flex-col gap-4 w-full">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">{t('dashboard.modals.newServer.name')}</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={serverForm.name}
                    onChange={handleServerChange}
                    className="input input-bordered w-full"
                    placeholder="Mijn Minecraft Server"
                    required
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">{t('dashboard.modals.newServer.version')}</span>
                  </label>
                  <input
                    type="text"
                    name="version"
                    value={serverForm.version}
                    onChange={handleServerChange}
                    className="input input-bordered w-full"
                    placeholder="1.20.4"
                    required
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">{t('dashboard.modals.newServer.ipAddress')}</span>
                  </label>
                  <input
                    type="text"
                    name="ip_address"
                    value={serverForm.ip_address}
                    onChange={handleServerChange}
                    className="input input-bordered w-full"
                    placeholder="127.0.0.1"
                    required
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">{t('dashboard.modals.newServer.port')}</span>
                  </label>
                  <input
                    type="number"
                    name="port"
                    value={serverForm.port}
                    onChange={handleServerChange}
                    className="input input-bordered w-full"
                    placeholder="25565"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-action mt-6 flex justify-end">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {t('dashboard.modals.newServer.cancel')}
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={!serverForm.name || !serverForm.version || !serverForm.ip_address || !serverForm.port}
            >
              {t('dashboard.modals.newServer.create')}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}><i className="fas fa-times"></i></button>
      </form>
    </dialog>
  );
};

export default AddServerModal; 