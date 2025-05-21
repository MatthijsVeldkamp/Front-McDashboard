import React, { useState, useEffect, useRef } from 'react';
import { showToast } from '../utils/toast';

const Console = ({ isOpen, onClose, serverId }) => {
  const [logs, setLogs] = useState([]);
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [filter, setFilter] = useState('');
  const [players, setPlayers] = useState([]);
  const logEndRef = useRef(null);
  const inputRef = useRef(null);
  const logContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

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
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}><i className="fas fa-times"></i></button>
      </form>
    </dialog>
  );
};

export default Console; 