export const translations = {
  en: {
    dashboard: {
      title: "Minecraft Server Dashboard",
      newServer: "New Server",
      logout: "Logout",
      myServers: "My Servers",
      noServers: "You haven't created any servers yet. Click on \"New Server\" to create one.",
      server: {
        version: "Version",
        ip: "IP",
        status: "Status",
        online: "Online",
        offline: "Offline",
        loading: "Loading",
        player: "Player",
        players: "Players",
        start: "Start",
        stop: "Stop",
        console: "Console",
        settings: "Server Settings",
        delete: "Delete Server"
      },
      modals: {
        newServer: {
          title: "New Minecraft Server",
          name: "Server Name",
          version: "Version",
          ipAddress: "IP Address",
          port: "Port",
          cancel: "Cancel",
          create: "Create Server"
        },
        delete: {
          title: "Delete Server",
          confirm: "Are you sure you want to delete the server {name}? This action cannot be undone.",
          cancel: "Cancel",
          confirmButton: "Delete"
        },
        stop: {
          title: "Stop Server",
          playersOnline: "There {is} currently {count} player{plural} online:",
          confirm: "Are you sure you want to stop the server? This will disconnect all players.",
          cancel: "Cancel",
          confirmButton: "Stop Server"
        }
      },
      onlineServers: "Online servers",
      offlineServers: "Offline servers",
      noOnlineServers: "No online servers",
      noOfflineServers: "No offline servers"
    }
  },
  nl: {
    dashboard: {
      title: "Minecraft Server Dashboard",
      newServer: "Nieuwe Server",
      logout: "Uitloggen",
      myServers: "Mijn Servers",
      noServers: "Je hebt nog geen servers aangemaakt. Klik op \"Nieuwe Server\" om er een aan te maken.",
      server: {
        version: "Versie",
        ip: "IP",
        status: "Status",
        online: "Online",
        offline: "Offline",
        loading: "Laden",
        player: "Speler",
        players: "Spelers",
        start: "Starten",
        stop: "Stoppen",
        console: "Console",
        settings: "Server Instellingen",
        delete: "Server Verwijderen"
      },
      modals: {
        newServer: {
          title: "Nieuwe Minecraft Server",
          name: "Server Naam",
          version: "Versie",
          ipAddress: "IP Adres",
          port: "Poort",
          cancel: "Annuleren",
          create: "Server Aanmaken"
        },
        delete: {
          title: "Server Verwijderen",
          confirm: "Weet je zeker dat je de server {name} wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.",
          cancel: "Annuleren",
          confirmButton: "Verwijderen"
        },
        stop: {
          title: "Server Stoppen",
          playersOnline: "Er {is} momenteel {count} speler{plural} online:",
          confirm: "Weet je zeker dat je de server wilt stoppen? Dit zal alle spelers verbreken.",
          cancel: "Annuleren",
          confirmButton: "Server Stoppen"
        }
      },
      onlineServers: "Online servers",
      offlineServers: "Offline servers",
      noOnlineServers: "Geen online servers",
      noOfflineServers: "Geen offline servers"
    }
  }
};

export const getCurrentLanguage = () => {
  return localStorage.getItem('language') || 'nl';
};

export const setLanguage = (lang) => {
  localStorage.setItem('language', lang);
};

export const t = (key) => {
  const lang = getCurrentLanguage();
  const keys = key.split('.');
  let value = translations[lang];
  
  for (const k of keys) {
    if (value && value[k] !== undefined) {
      value = value[k];
    } else {
      return key; // Return the key if translation is not found
    }
  }
  
  return value;
}; 