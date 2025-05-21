import React, { useState, useEffect, useRef } from 'react';
import { showToast } from '../utils/toast';

const PRESET_COMMANDS = [
  { label: 'Time: Day', command: '/time set day' },
  { label: 'Time: Night', command: '/time set night' },
  { label: 'Weather: Clear', command: '/weather clear' },
  { label: 'Weather: Rain', command: '/weather rain' },
  { label: 'Gamemode: Creative', command: '/gamemode creative @p' },
  { label: 'Gamemode: Survival', command: '/gamemode survival @p' },
];

const PLAYER_ACTIONS = [
  { label: 'Kick', getCommand: (name) => `/kick ${name}` },
  { label: 'Ban', getCommand: (name) => `/ban ${name}` },
  { label: 'IP-Ban', getCommand: (name) => `/ban-ip ${name}` },
  { label: 'OP', getCommand: (name) => `/op ${name}` },
  { label: 'Deop', getCommand: (name) => `/deop ${name}` },
];

const Console = ({ isOpen, onClose, serverId }) => {
  const [logs, setLogs] = useState([]);
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [filter, setFilter] = useState('');
  const [players, setPlayers] = useState([]);
  const [actionPlayer, setActionPlayer] = useState(null); // For player action modal
  const logEndRef = useRef(null);
  const inputRef = useRef(null);
  const logContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [banReason, setBanReason] = useState('');
  const [banType, setBanType] = useState(null); // 'ban' or 'ip-ban'
  const [bannedPlayers, setBannedPlayers] = useState([]);
  const [unbanPlayer, setUnbanPlayer] = useState(null); // For unban modal
  const [kickReason, setKickReason] = useState('');
  const [kickPlayer, setKickPlayer] = useState(null); // For kick modal
  const [kickHistory, setKickHistory] = useState(null); // For kick modal
  const [banHistory, setBanHistory] = useState(null); // For ban modal

  // Load command history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(`commandHistory_${serverId}`);
    if (savedHistory) {
      setCommandHistory(JSON.parse(savedHistory));
    }
  }, [serverId]);

  // Save command history to localStorage
  const saveCommandHistory = (newCommand) => {
    const newHistory = [newCommand, ...commandHistory.slice(0, 4)];
    setCommandHistory(newHistory);
    localStorage.setItem(`commandHistory_${serverId}`, JSON.stringify(newHistory));
  };

  // Fetch players every 5 seconds
  useEffect(() => {
    if (!isOpen) return;

    const fetchPlayers = async () => {
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
          if (data.players && Array.isArray(data.players)) {
            setPlayers(data.players);
          }
        }
      } catch (error) {
        console.error('Error fetching players:', error);
      }
    };

    fetchPlayers();
    const interval = setInterval(fetchPlayers, 5000);

    return () => clearInterval(interval);
  }, [isOpen, serverId]);

  // Fetch banned players every 5 seconds
  useEffect(() => {
    if (!isOpen) return;

    const fetchBannedPlayers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://127.0.0.1:8000/api/server/${serverId}/banned`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.banned_players && Array.isArray(data.banned_players)) {
            setBannedPlayers(data.banned_players);
          }
        }
      } catch (error) {
        console.error('Error fetching banned players:', error);
      }
    };

    fetchBannedPlayers();
    const interval = setInterval(fetchBannedPlayers, 5000);
    return () => clearInterval(interval);
  }, [isOpen, serverId]);

  // Handle scroll events
  const handleScroll = () => {
    if (!logContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
    setShouldAutoScroll(isAtBottom);
  };

  // Fetch logs every 3 seconds
  useEffect(() => {
    if (!isOpen) return;

    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://127.0.0.1:8000/api/server/${serverId}/log`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.log) {
            // Split the log string into an array of lines and filter out empty lines
            const logLines = data.log.split('\n').filter(line => line.trim());
            setLogs(prevLogs => {
              if (JSON.stringify(prevLogs) !== JSON.stringify(logLines)) {
                return logLines;
              }
              return prevLogs;
            });
          }
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);

    return () => clearInterval(interval);
  }, [isOpen, serverId]);

  // Scroll to bottom when new logs arrive and shouldAutoScroll is true
  useEffect(() => {
    if (shouldAutoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, shouldAutoScroll]);

  // Helper to execute a command directly (used by preset and player actions)
  const executeCommand = async (cmd) => {
    if (!cmd.trim()) return;
    const cleanCmd = cmd.startsWith('/') ? cmd.slice(1) : cmd;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/server/${serverId}/command/${encodeURIComponent(cleanCmd)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        saveCommandHistory(cmd);
        showToast('Command executed', 'success');
      } else {
        throw new Error('Failed to execute command');
      }
    } catch (error) {
      console.error('Error executing command:', error);
      showToast('Failed to execute command', 'error');
    }
  };

  const handleCommandSubmit = async (e) => {
    e.preventDefault();
    if (!command.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/server/${serverId}/command/${encodeURIComponent(command)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        saveCommandHistory(command);
        setCommand('');
        showToast('Command executed', 'success');
      } else {
        throw new Error('Failed to execute command');
      }
    } catch (error) {
      console.error('Error executing command:', error);
      showToast('Failed to execute command', 'error');
    }
  };

  const handleHistoryClick = (cmd) => {
    setCommand(cmd);
    inputRef.current?.focus();
  };

  // Parse log line to separate timestamp and message
  const parseLogLine = (line) => {
    // First try to match the standard format with timestamp
    const timestampMatch = line.match(/^\[(.*?)\]/);
    if (timestampMatch) {
      const timestamp = timestampMatch[1];
      let message = line.slice(timestampMatch[0].length).trim();
      
      // Remove [Server thread/INFO] prefix
      message = message.replace(/^\[Server thread\/INFO\]\s*/, '');
      
      // Clean up any remaining brackets and their contents
      message = message.replace(/\[.*?\]\s*/g, '');
      
      // Clean up any leading colons
      message = message.replace(/^:\s*/, '');
      
      return { timestamp, message };
    }

    // Handle lines that start with a timestamp without brackets
    const timeMatch = line.match(/^(\d{2}:\d{2}:\d{2})/);
    if (timeMatch) {
      const timestamp = timeMatch[1];
      let message = line.slice(timeMatch[0].length).trim();
      
      // Clean up any leading colons
      message = message.replace(/^:\s*/, '');
      
      return { timestamp, message };
    }

    // If no timestamp found, return the whole line as message
    return { timestamp: '', message: line };
  };

  // Filter logs based on the filter text
  const filteredLogs = logs
    .map(log => parseLogLine(log))
    .filter(log => {
      const { message } = log;
      return message.toLowerCase().includes(filter.toLowerCase());
    });

  // Fetch kick history when opening kick modal
  useEffect(() => {
    if (!kickPlayer) return;
    setKickHistory(null);
    const fetchKickHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://127.0.0.1:8000/api/server/${serverId}/kicked`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: kickPlayer.username })
        });
        if (response.ok) {
          const data = await response.json();
          setKickHistory(data.kicked_players || []);
        }
      } catch (error) {
        setKickHistory([]);
      }
    };
    fetchKickHistory();
  }, [kickPlayer, serverId]);

  // Fetch ban history when opening ban modal
  useEffect(() => {
    if (!actionPlayer || !banType) return;
    setBanHistory(null);
    const fetchBanHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://127.0.0.1:8000/api/server/${serverId}/banned`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: actionPlayer.username })
        });
        if (response.ok) {
          const data = await response.json();
          setBanHistory(data.ban_history || []);
        }
      } catch (error) {
        setBanHistory([]);
      }
    };
    fetchBanHistory();
  }, [actionPlayer, banType, serverId]);

  // Helper to format date
  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-4xl bg-base-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl">Server Console</h3>
          <button 
            onClick={onClose} 
            className="btn btn-sm btn-circle btn-ghost"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-[2px] bg-gradient-to-r from-primary to-secondary rounded-lg mb-4">
          <div className="bg-base-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2 flex-1">
                <div className="form-control flex-1">
                  <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filter logs..."
                    className="input input-bordered w-full"
                  />
                </div>
                {filter && (
                  <button
                    onClick={() => setFilter('')}
                    className="btn btn-ghost btn-sm"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <i className="fas fa-users text-primary/70"></i>
                <span className="text-sm font-mono">{players.length} online</span>
              </div>
            </div>

            {players.length > 0 && (
              <div className="mb-4 p-2 bg-base-300/30 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {players.map((player) => (
                    <div 
                      key={player.uuid}
                      className="badge badge-primary gap-2 p-3 flex items-center"
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
                      <button
                        className="ml-2 btn btn-xs btn-ghost"
                        title="Player Actions"
                        onClick={() => setActionPlayer(player)}
                        type="button"
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Banned Players Section */}
            {bannedPlayers.length > 0 && (
              <div className="mb-4 p-2 bg-base-300/30 rounded-lg">
                <div className="font-bold mb-2 text-error flex items-center gap-2">
                  <i className="fas fa-ban"></i> Banned Players
                </div>
                <div className="flex flex-wrap gap-2">
                  {bannedPlayers.map((player, idx) => (
                    <div
                      key={player.uuid || idx}
                      className="badge gap-2 p-3 flex items-center bg-error text-error-content border-error border"
                      title={`Banned: ${player.username || player.uuid}`}
                    >
                      <img
                        src={`https://mc-heads.net/avatar/${player.uuid || 'steve'}/16`}
                        alt={player.username || player.uuid}
                        className="w-4 h-4 rounded-sm"
                        onError={e => {
                          e.target.onerror = null;
                          e.target.src = 'https://mc-heads.net/avatar/steve/16';
                        }}
                      />
                      {player.username || player.uuid}
                      <span className="ml-2 text-xs italic">{player.reason}</span>
                      <button
                        className="ml-2 btn btn-xs btn-ghost text-error-content"
                        title="Unban Actions"
                        onClick={() => setUnbanPlayer(player)}
                        type="button"
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div 
              ref={logContainerRef}
              onScroll={handleScroll}
              className="h-[400px] overflow-y-auto font-mono text-sm"
            >
              <div className="grid grid-cols-[120px_1fr] gap-4">
                {filteredLogs.map((log, index) => {
                  const { timestamp, message } = log;
                  return (
                    <React.Fragment key={index}>
                      <div 
                        className="animate-fade-in text-primary/70 border-r border-base-300 pr-2 border-b border-base-300 pb-1"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {timestamp}
                      </div>
                      <div 
                        className="animate-fade-in whitespace-pre-wrap border-b border-base-300 pb-1"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {message}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
              <div ref={logEndRef} />
            </div>
          </div>
        </div>

        {/* Preset Commands */}
        <div className="mb-4 flex flex-wrap gap-2">
          {PRESET_COMMANDS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className="btn btn-xs btn-outline"
              onClick={() => executeCommand(preset.command)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {commandHistory.map((cmd, index) => (
              <button
                key={index}
                onClick={() => handleHistoryClick(cmd)}
                className="btn btn-sm btn-ghost"
                title={cmd}
              >
                <i className="fas fa-history mr-2"></i>
                {cmd.length > 20 ? cmd.substring(0, 20) + '...' : cmd}
              </button>
            ))}
          </div>

          <form onSubmit={handleCommandSubmit} className="flex gap-2">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Enter command..."
              className="input input-bordered flex-1"
              ref={inputRef}
            />
            <button type="submit" className="btn btn-primary">
              <i className="fas fa-paper-plane mr-2"></i>
              Send
            </button>
          </form>
        </div>
      </div>
      {/* Player Action Modal */}
      {actionPlayer && !banType && !kickPlayer && (
        <dialog className="modal modal-open">
          <div className="modal-box p-[2px] bg-gradient-to-r from-primary to-secondary rounded-lg">
            <div className="bg-base-100 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-4">Player Actions: {actionPlayer.username}</h3>
              <div className="flex flex-col gap-2 mb-4">
                {PLAYER_ACTIONS.map((action, idx) => {
                  if (action.label === 'Ban' || action.label === 'IP-Ban') {
                    return (
                      <button
                        key={idx}
                        className="btn btn-outline"
                        onClick={() => {
                          setBanType(action.label === 'Ban' ? 'ban' : 'ip-ban');
                          setBanReason('');
                        }}
                      >
                        {action.label}
                      </button>
                    );
                  }
                  if (action.label === 'Kick') {
                    return (
                      <button
                        key={idx}
                        className="btn btn-outline"
                        onClick={() => {
                          setKickPlayer(actionPlayer);
                          setKickReason('');
                        }}
                      >
                        {action.label}
                      </button>
                    );
                  }
                  return (
                    <button
                      key={idx}
                      className="btn btn-outline"
                      onClick={() => {
                        executeCommand(action.getCommand(actionPlayer.username));
                        setActionPlayer(null);
                      }}
                    >
                      {action.label}
                    </button>
                  );
                })}
              </div>
              <div className="modal-action">
                <button className="btn btn-ghost" onClick={() => setActionPlayer(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setActionPlayer(null)}><i className="fas fa-times"></i></button>
          </form>
        </dialog>
      )}
      {/* Ban Reason Modal */}
      {actionPlayer && banType && (
        <dialog className="modal modal-open">
          <div className="modal-box p-[2px] bg-gradient-to-r from-primary to-secondary rounded-lg">
            <div className="bg-base-100 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-4">
                {banType === 'ban' ? 'Ban Player' : 'IP-Ban Player'}: {actionPlayer.username}
              </h3>
              <div className="mb-4">
                <label className="label">
                  <span className="label-text">Reason (optional)</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Enter reason (optional)"
                  value={banReason}
                  onChange={e => setBanReason(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                />
              </div>
              <div className="mb-4">
                <label className="label">
                </label>
                {banHistory === null ? (
                  <span className="italic text-base-content/60">Loading...</span>
                ) : banHistory.length === 0 ? (
                  <span className="italic text-base-content/60"></span>
                ) : (
                  <span>
                    <span className="font-mono">{banHistory.length}</span> banned {banHistory.length === 1 ? 'time' : 'times'}
                    <div className="mt-1 text-xs italic text-base-content/60">
                      {banHistory.map((entry, i) => (
                        <div key={i}>
                          <span className="font-mono">{formatDateTime(entry.created_at)}</span>: {entry.reason}
                        </div>
                      ))}
                    </div>
                  </span>
                )}
              </div>
              <div className="modal-action">
                <button
                  className="btn btn-error"
                  onClick={() => {
                    let cmd = '';
                    if (banType === 'ban') {
                      cmd = `/ban ${actionPlayer.username}`;
                    } else {
                      cmd = `/ban-ip ${actionPlayer.username}`;
                    }
                    if (banReason.trim()) {
                      cmd += ` ${banReason.trim()}`;
                    }
                    executeCommand(cmd);
                    setActionPlayer(null);
                    setBanType(null);
                    setBanReason('');
                  }}
                >
                  {banType === 'ban' ? 'Ban' : 'IP-Ban'}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setBanType(null);
                    setBanReason('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => { setBanType(null); setBanReason(''); }}><i className="fas fa-times"></i></button>
          </form>
        </dialog>
      )}
      {/* Unban Modal */}
      {unbanPlayer && (
        <dialog className="modal modal-open">
          <div className="modal-box p-[2px] bg-gradient-to-r from-primary to-secondary rounded-lg">
            <div className="bg-base-100 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-4">Unban Player: {unbanPlayer.username || unbanPlayer.uuid}</h3>
              <div className="flex flex-col gap-2 mb-4">
                <button
                  className="btn btn-outline btn-error"
                  onClick={() => {
                    executeCommand(`/pardon ${unbanPlayer.username || unbanPlayer.uuid}`);
                    setUnbanPlayer(null);
                  }}
                >
                  Unban (pardon)
                </button>
              </div>
              <div className="modal-action">
                <button className="btn btn-ghost" onClick={() => setUnbanPlayer(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setUnbanPlayer(null)}><i className="fas fa-times"></i></button>
          </form>
        </dialog>
      )}
      {/* Kick Reason Modal */}
      {kickPlayer && (
        <dialog className="modal modal-open">
          <div className="modal-box p-[2px] bg-gradient-to-r from-primary to-secondary rounded-lg">
            <div className="bg-base-100 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-4">Kick Player: {kickPlayer.username}</h3>
              <div className="mb-4">
                <label className="label">
                  <span className="label-text">Reason (optional)</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Enter reason (optional)"
                  value={kickReason}
                  onChange={e => setKickReason(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                />
              </div>
              <div className="mb-4">
                <label className="label">
                </label>
                {kickHistory === null ? (
                  <span className="italic text-base-content/60">Loading...</span>
                ) : kickHistory.length === 0 ? (
                  <span className="italic text-base-content/60">You've never kicked this player</span>
                ) : (
                  <span>
                    <span className="font-mono">{kickHistory.length}</span> kicked {kickHistory.length === 1 ? 'time' : 'times'}
                    <div className="mt-1 text-xs italic text-base-content/60">
                      {kickHistory.map((entry, i) => (
                        <div key={i}>
                          <span className="font-mono">{formatDateTime(entry.created_at)}</span>: {entry.reason}
                        </div>
                      ))}
                    </div>
                  </span>
                )}
              </div>
              <div className="modal-action">
                <button
                  className="btn btn-error"
                  onClick={() => {
                    let cmd = `/kick ${kickPlayer.username}`;
                    if (kickReason.trim()) {
                      cmd += ` ${kickReason.trim()}`;
                    }
                    executeCommand(cmd);
                    setKickPlayer(null);
                    setActionPlayer(null);
                    setKickReason('');
                  }}
                >
                  Kick
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setKickPlayer(null);
                    setKickReason('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => { setKickPlayer(null); setKickReason(''); }}><i className="fas fa-times"></i></button>
          </form>
        </dialog>
      )}
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}><i className="fas fa-times"></i></button>
      </form>
    </dialog>
  );
};

export default Console; 