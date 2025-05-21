import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../utils/toast';
import { t } from '../utils/languages';
import '../utils/toast.css';
import Console from './Console';
import AddServerModal from './AddServerModal';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatusLoading, setIsStatusLoading] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serverToDelete, setServerToDelete] = useState(null);
  const [servers, setServers] = useState([]);
  const [serverStatuses, setServerStatuses] = useState({});
  const [showConsole, setShowConsole] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState(null);
  const [showStopConfirmModal, setShowStopConfirmModal] = useState(false);
  const [serverToStop, setServerToStop] = useState(null);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [serverPlayers, setServerPlayers] = useState({});
  const [collapsedSections, setCollapsedSections] = useState({
    online: false,
    offline: false
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Kon gebruikersgegevens niet ophalen');
        }

        const data = await response.json();
        setUser(data);
        
        // Fetch user's servers after getting user data
        const serversResponse = await fetch(`http://127.0.0.1:8000/api/servers/${data.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (serversResponse.ok) {
          const serversData = await serversResponse.json();
          setServers(serversData.servers);
        }
      } catch (error) {
        console.error(error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('http://127.0.0.1:8000/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const handleModalOpen = () => {
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleServerSubmit = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/server/new', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Kon server niet aanmaken: ${errorData.message || 'Onbekende fout'}`);
      }

      const newServer = await response.json();
      
      // Add the new server to the list and fetch its status
      setServers(prevServers => [...prevServers, newServer.server]);
      fetchServerStatus(newServer.server.id);
      
      // Close the modal after successful creation
      handleModalClose();
      showToast('Server is aangemaakt', 'success');
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Kon server niet aanmaken', 'error');
    }
  };

  const handleStartServer = async (serverId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/server/${serverId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Kon server niet starten');
      }
      showToast('Server wordt gestart...', 'warning');
    } catch (error) {
      console.error(error);
      showToast('Kon server niet starten', 'error');
    }
  };

  const handleStopServer = async (serverId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/server/${serverId}/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Kon server niet stoppen');
      }
      showToast('Server is gestopt', 'success');
    } catch (error) {
      console.error(error);
      showToast('Kon server niet stoppen', 'error');
    }
  };

  const handleDeleteClick = (server) => {
    setServerToDelete(server);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!serverToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/server/${serverToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Kon server niet verwijderen');
      }

      // Remove server from the list
      setServers(prevServers => prevServers.filter(s => s.id !== serverToDelete.id));
      
      // Remove server status
      setServerStatuses(prev => {
        const newStatuses = { ...prev };
        delete newStatuses[serverToDelete.id];
        return newStatuses;
      });

      // Close the modal
      setShowDeleteModal(false);
      setServerToDelete(null);
      showToast('Server is verwijderd', 'success');
    } catch (error) {
      console.error('Error deleting server:', error);
      showToast('Kon server niet verwijderen', 'error');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setServerToDelete(null);
  };

  // Function to fetch server status
  const fetchServerStatus = async (serverId) => {
    setIsStatusLoading(prev => ({ ...prev, [serverId]: true }));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/server/${serverId}/status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        setServerStatuses(prev => ({
          ...prev,
          [serverId]: data.status
        }));
      }
    } catch (error) {
      console.error(`Error fetching status for server ${serverId}:`, error);
    } finally {
      setIsStatusLoading(prev => ({ ...prev, [serverId]: false }));
    }
  };

  // Poll server statuses every 10 seconds
  useEffect(() => {
    const pollStatuses = () => {
      servers.forEach(server => {
        fetchServerStatus(server.id);
      });
    };

    // Initial fetch
    pollStatuses();

    // Set up polling interval
    const intervalId = setInterval(pollStatuses, 10000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [servers]);

  const handleConsoleOpen = (serverId) => {
    setSelectedServerId(serverId);
    setShowConsole(true);
  };

  const handleConsoleClose = () => {
    setShowConsole(false);
    setSelectedServerId(null);
  };

  const handleStopClick = async (serverId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/server/${serverId}/players`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.players && data.players.length > 0) {
          setOnlinePlayers(data.players);
          setServerToStop(serverId);
          setShowStopConfirmModal(true);
        } else {
          handleStopServer(serverId);
        }
      }
    } catch (error) {
      console.error('Error checking players:', error);
      handleStopServer(serverId);
    }
  };

  const handleStopConfirm = () => {
    if (serverToStop) {
      handleStopServer(serverToStop);
      setShowStopConfirmModal(false);
      setServerToStop(null);
      setOnlinePlayers([]);
    }
  };

  const handleStopCancel = () => {
    setShowStopConfirmModal(false);
    setServerToStop(null);
    setOnlinePlayers([]);
  };

  // Update the useEffect for fetching player counts to run more frequently
  useEffect(() => {
    if (!servers.length) return;

    let isFetching = false;
    let lastFetchTime = 0;

    const fetchPlayerCounts = async () => {
      // Prevent overlapping fetches
      if (isFetching) return;
      
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime;
      
      // If it's been less than 2.5 seconds since the last fetch, skip this one
      if (timeSinceLastFetch < 2500) return;
      
      isFetching = true;
      console.log('Fetching player counts...', new Date().toISOString());
      
      try {
        const token = localStorage.getItem('token');
        const playerCounts = {};

        for (const server of servers) {
          if (serverStatuses[server.id] === 'online') {
            try {
              const response = await fetch(`http://127.0.0.1:8000/api/server/${server.id}/players`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                const data = await response.json();
                playerCounts[server.id] = data.players || [];
              }
            } catch (error) {
              console.error(`Error fetching players for server ${server.id}:`, error);
            }
          }
        }

        setServerPlayers(playerCounts);
        lastFetchTime = Date.now();
      } finally {
        isFetching = false;
      }
    };

    // Initial fetch
    fetchPlayerCounts();

    // Set up interval with a more precise timing
    const intervalId = setInterval(() => {
      fetchPlayerCounts();
    }, 3000);

    // Cleanup
    return () => {
      clearInterval(intervalId);
    };
  }, [servers, serverStatuses]);

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Only show servers with a known status
  const onlineServers = servers.filter(server => serverStatuses[server.id] === 'online');
  const offlineServers = servers.filter(server => serverStatuses[server.id] === 'offline');
  // Servers with status undefined or 'loading' are not shown

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-200 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="p-[2px] bg-gradient-to-r from-primary to-secondary rounded-lg">
            <div className="card bg-base-100 shadow-xl rounded-lg">
              <div className="card-body">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="card-title text-2xl">{t('dashboard.title')}</h2>
                  <div className="flex gap-2">
                    <div className="skeleton h-10 w-32"></div>
                    <div className="skeleton h-10 w-24"></div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Online Servers Skeleton */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="skeleton h-4 w-4 rounded-full"></div>
                        <h3 className="text-xl font-bold">{t('dashboard.onlineServers')} <span className="font-mono">(0)</span></h3>
                      </div>
                      <div className="skeleton h-6 w-6"></div>
                    </div>
                    <div className="grid gap-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="card bg-base-100 shadow border-2 border-base-300">
                          <div className="card-body">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                              <div className="w-full space-y-2">
                                <div className="skeleton h-6 w-48"></div>
                                <div className="skeleton h-4 w-32"></div>
                                <div className="skeleton h-4 w-40"></div>
                                <div className="skeleton h-4 w-24"></div>
                              </div>
                              <div className="w-full sm:w-auto flex justify-center sm:justify-end gap-2">
                                <div className="skeleton h-8 w-32"></div>
                                <div className="skeleton h-8 w-32"></div>
                                <div className="skeleton h-8 w-8"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Offline Servers Skeleton */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="skeleton h-4 w-4 rounded-full"></div>
                        <h3 className="text-xl font-bold">{t('dashboard.offlineServers')} <span className="font-mono">(0)</span></h3>
                      </div>
                      <div className="skeleton h-6 w-6"></div>
                    </div>
                    <div className="grid gap-4">
                      {[1].map((i) => (
                        <div key={i} className="card bg-base-100 shadow border-2 border-base-300">
                          <div className="card-body">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                              <div className="w-full space-y-2">
                                <div className="skeleton h-6 w-48"></div>
                                <div className="skeleton h-4 w-32"></div>
                                <div className="skeleton h-4 w-40"></div>
                                <div className="skeleton h-4 w-24"></div>
                              </div>
                              <div className="w-full sm:w-auto flex justify-center sm:justify-end gap-2">
                                <div className="skeleton h-8 w-32"></div>
                                <div className="skeleton h-8 w-32"></div>
                                <div className="skeleton h-8 w-8"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="p-[2px] bg-gradient-to-r from-primary to-secondary rounded-lg">
          <div className="card bg-base-100 shadow-xl rounded-lg">
            <div className="card-body">
              <div className="flex justify-between items-center mb-6">
                <h2 className="card-title text-2xl">{t('dashboard.title')}</h2>
                <div className="flex gap-2">
                  <button onClick={handleModalOpen} className="btn btn-primary">
                    {t('dashboard.newServer')}
                  </button>
                  <button onClick={handleLogout} className="btn btn-ghost">
                    {t('dashboard.logout')}
                  </button>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Online Servers Section */}
                <div className="space-y-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-base-200/50 p-2 rounded-lg transition-colors"
                    onClick={() => toggleSection('online')}
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="absolute -inset-1 bg-success/20 rounded-full animate-ping online-dot-ping"></div>
                        <div className="relative w-3 h-3 bg-success rounded-full"></div>
                      </div>
                      <h3 className="text-xl font-bold">{t('dashboard.onlineServers')} <span className="font-mono">({onlineServers.length})</span></h3>
                    </div>
                    <button className="btn btn-ghost btn-sm">
                      <i className={`fas fa-chevron-${collapsedSections.online ? 'down' : 'up'} transition-transform duration-200`}></i>
                    </button>
                  </div>
                  
                  {!collapsedSections.online && (
                    <div className="grid gap-4">
                      {onlineServers.length === 0 ? (
                        <div className="alert alert-info border-2 border-info/40">
                          <div className="flex items-center gap-2 w-full">
                            <i className="fas fa-info-circle text-info text-xl opacity-100"></i>
                            <span className="text-info-content text-sm md:text-base">
                              {t('dashboard.noOnlineServers')}
                            </span>
                          </div>
                        </div>
                      ) : (
                        onlineServers.map(server => (
                          <div 
                            key={server.id} 
                            className="card bg-base-100 shadow transition-all duration-300 ease-in-out transform hover:scale-[1.02] border-2 border-base-300"
                          >
                            <div className="card-body">
                              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div className="w-full">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="card-title text-base sm:text-lg break-all">
                                        {server.name}
                                      </h4>
                                      <p className="text-sm text-gray-500 mt-1">
                                        {t('dashboard.server.version')}: {server.version}
                                      </p>
                                      <p className="text-sm text-gray-500 mt-1">
                                        {t('dashboard.server.ip')}: {server.ip_address}:{server.port}
                                      </p>
                                      <p className="text-sm text-gray-500 mt-1">
                                        {t('dashboard.server.status')}: <span className="badge badge-success">
                                          {t('dashboard.server.online')}
                                        </span>
                                      </p>
                                    </div>
                                    <div className="flex flex-col items-center gap-1 bg-base-200/50 rounded-lg p-3 min-w-[80px]">
                                      <i className="fas fa-users text-2xl text-primary/70"></i>
                                      <span className="font-mono text-2xl font-bold transition-all duration-300 ease-in-out">
                                        <span className="countdown">
                                          <span 
                                            style={{ "--value": serverPlayers[server.id]?.length || 0 }} 
                                            className="font-mono"
                                            aria-live="polite"
                                          >
                                            {serverPlayers[server.id]?.length || 0}
                                          </span>
                                        </span>
                                      </span>
                                      <span className="text-xs text-gray-500 font-mono">
                                        {serverPlayers[server.id]?.length === 1 ? t('dashboard.server.player') : t('dashboard.server.players')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="w-full sm:w-auto flex justify-center sm:justify-end gap-2">
                                  <button 
                                    onClick={() => handleStopClick(server.id)}
                                    className="btn btn-error btn-sm w-32 sm:w-auto transition-colors duration-200 hover:bg-error/90 border-2 border-error/40"
                                  >
                                    {t('dashboard.server.stop')}
                                  </button>
                                  <button
                                    onClick={() => handleConsoleOpen(server.id)}
                                    className="btn btn-info btn-sm w-32 sm:w-auto transition-colors duration-200 hover:bg-info/90 border-2 border-info/40"
                                  >
                                    <i className="fas fa-terminal mr-2"></i>
                                    {t('dashboard.server.console')}
                                  </button>
                                  <button
                                    className="btn btn-ghost btn-sm text-warning hover:bg-warning/10 border-2 border-warning/40"
                                    title={t('dashboard.server.settings')}
                                  >
                                    <i className="fas fa-wrench"></i>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(server)}
                                    className="btn btn-ghost btn-sm text-error hover:bg-error/10 border-2 border-error/40 relative z-10"
                                    title={t('dashboard.server.delete')}
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Offline Servers Section */}
                <div className="space-y-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-base-200/50 p-2 rounded-lg transition-colors"
                    onClick={() => toggleSection('offline')}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-error rounded-full"></div>
                      <h3 className="text-xl font-bold">{t('dashboard.offlineServers')} <span className="font-mono">({offlineServers.length})</span></h3>
                    </div>
                    <button className="btn btn-ghost btn-sm">
                      <i className={`fas fa-chevron-${collapsedSections.offline ? 'down' : 'up'} transition-transform duration-200`}></i>
                    </button>
                  </div>
                  
                  {!collapsedSections.offline && (
                    <div className="grid gap-4">
                      {offlineServers.length === 0 ? (
                        <div className="alert alert-info border-2 border-info/40">
                          <div className="flex items-center gap-2 w-full">
                            <i className="fas fa-info-circle text-info text-xl opacity-100"></i>
                            <span className="text-info-content text-sm md:text-base">
                              {t('dashboard.noOfflineServers')}
                            </span>
                          </div>
                        </div>
                      ) : (
                        offlineServers.map(server => (
                          <div 
                            key={server.id} 
                            className="card bg-base-100 shadow transition-all duration-300 ease-in-out transform hover:scale-[1.02] border-2 border-base-300"
                          >
                            <div className="card-body">
                              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div className="w-full">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="card-title text-base sm:text-lg break-all">
                                        {server.name}
                                      </h4>
                                      <p className="text-sm text-gray-500 mt-1">
                                        {t('dashboard.server.version')}: {server.version}
                                      </p>
                                      <p className="text-sm text-gray-500 mt-1">
                                        {t('dashboard.server.ip')}: {server.ip_address}:{server.port}
                                      </p>
                                      <p className="text-sm text-gray-500 mt-1">
                                        {t('dashboard.server.status')}: <span className="badge badge-error">
                                          {t('dashboard.server.offline')}
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="w-full sm:w-auto flex justify-center sm:justify-end gap-2">
                                  <button 
                                    onClick={() => handleStartServer(server.id)}
                                    className="btn btn-primary btn-sm w-32 sm:w-auto transition-colors duration-200 hover:bg-primary/90 border-2 border-primary/40"
                                  >
                                    {t('dashboard.server.start')}
                                  </button>
                                  <button
                                    className="btn btn-ghost btn-sm text-warning hover:bg-warning/10 border-2 border-warning/40"
                                    title={t('dashboard.server.settings')}
                                  >
                                    <i className="fas fa-wrench"></i>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(server)}
                                    className="btn btn-ghost btn-sm text-error hover:bg-error/10 border-2 border-error/40 relative z-10"
                                    title={t('dashboard.server.delete')}
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AddServerModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSubmit={handleServerSubmit}
      />

      {/* Delete Confirmation Modal */}
      <dialog className={`modal ${showDeleteModal ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">{t('dashboard.modals.delete.title')}</h3>
          <p className="py-4">
            {t('dashboard.modals.delete.confirm').replace('{name}', serverToDelete?.name)}
          </p>
          <div className="modal-action">
            <button className="btn btn-ghost" onClick={handleDeleteCancel}>
              {t('dashboard.modals.delete.cancel')}
            </button>
            <button className="btn btn-error" onClick={handleDeleteConfirm}>
              {t('dashboard.modals.delete.confirmButton')}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={handleDeleteCancel}><i className="fas fa-times"></i></button>
        </form>
      </dialog>

      <Console
        isOpen={showConsole}
        onClose={handleConsoleClose}
        serverId={selectedServerId}
      />

      {/* Stop Confirmation Modal */}
      <dialog className={`modal ${showStopConfirmModal ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-2xl p-[2px] bg-gradient-to-r from-primary to-secondary rounded-lg">
          <div className="bg-base-100 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4">{t('dashboard.modals.stop.title')}</h3>
            <p className="py-4">
              {t('dashboard.modals.stop.playersOnline')
                .replace('{is}', onlinePlayers.length === 1 ? t('dashboard.modals.stop.is') : t('dashboard.modals.stop.are'))
                .replace('{count}', onlinePlayers.length)
                .replace('{plural}', onlinePlayers.length !== 1 ? 's' : '')}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {onlinePlayers.map((player) => (
                <div 
                  key={player.uuid}
                  className="badge badge-primary gap-2 p-3"
                  title={`UUID: ${player.uuid}`}
                >
                  <img 
                    src={`https://mc-heads.net/avatar/${player.uuid}/16`}
                    alt={player.username}
                    className="w-4 h-4 rounded-sm"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://mc-heads.net/avatar/steve/16';
                    }}
                  />
                  {player.username}
                </div>
              ))}
            </div>
            <p className="text-warning mb-4">
              {t('dashboard.modals.stop.confirm')}
            </p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={handleStopCancel}>
                {t('dashboard.modals.stop.cancel')}
              </button>
              <button className="btn btn-error" onClick={handleStopConfirm}>
                {t('dashboard.modals.stop.confirmButton')}
              </button>
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={handleStopCancel}><i className="fas fa-times"></i></button>
        </form>
      </dialog>
    </div>
  );
}

export default Dashboard;