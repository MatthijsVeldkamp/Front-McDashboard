import React, { useState } from 'react';
import { t, setLanguage, getCurrentLanguage } from '../utils/languages';

function SettingsModal({ isOpen, onClose, user, theme, onThemeChange }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAccountDeleteConfirm, setShowAccountDeleteConfirm] = useState(false);
  const [error, setError] = useState(null);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    window.location.reload(); // Reload to apply new language
  };

  const handleDeleteAllSockets = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/sockets/delete-all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Could not delete sockets');
      }

      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      setError(error.message);
      console.error('Error:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Could not delete account');
      }

      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (error) {
      setError(error.message);
      console.error('Error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal" open={isOpen}>
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4 text-center">Account Settings</h3>
        
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}
        
        <div className="flex items-center gap-4 mb-6">
          <div className="avatar">
            <div className="w-16 rounded-full">
              <div className="w-16 h-16 rounded-full bg-neutral text-neutral-content flex items-center justify-center">
                <span className="text-2xl">{user?.username?.charAt(0).toUpperCase()}</span>
              </div>
            </div>
          </div>
          <h4 className="text-xl font-semibold">{user?.username}</h4>
        </div>

        {/* Account Settings Form */}
        <div className="space-y-6 w-3/4 mx-auto">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Username</span>
            </label>
            <input 
              type="text" 
              className="input input-bordered w-full" 
              value={user?.username || ''}
              readOnly
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input 
              type="email" 
              className="input input-bordered w-full" 
              value={user?.email || ''}
              readOnly
            />
          </div>
        </div>

        <div className="divider my-6">Language Settings</div>

        {/* Language Settings */}
        <div className="form-control w-3/4 mx-auto">
          <label className="label">
            <span className="label-text font-bold">Language / Taal:</span>
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

        <div className="divider my-6">Theme Settings</div>

        {/* Theme Settings */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-bold">Theme:</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['light', 'dark', 'dracula', 'retro', 'lofi'].map((themeOption) => (
              <div key={themeOption} className={`border rounded-lg p-2 ${theme === themeOption ? 'border-primary' : ''}`}>
                <button
                  className="btn btn-sm btn-block btn-ghost justify-start transition-colors duration-300"
                  onClick={() => {
                    onThemeChange({ target: { value: themeOption } });
                  }}
                  onMouseEnter={() => {
                    document.documentElement.style.transition = 'all 0.3s ease-in-out';
                    document.documentElement.setAttribute('data-theme', themeOption);
                  }}
                  onMouseLeave={() => {
                    document.documentElement.style.transition = 'all 0.3s ease-in-out';
                    document.documentElement.setAttribute('data-theme', theme);
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span>{themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}</span>
                    {theme === themeOption && (
                      <i className="fas fa-check-circle text-primary text-lg ml-auto"></i>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default SettingsModal;