import { useState, useEffect } from "react";

interface Settings {
  pushNotifications: boolean;
  darkMode: boolean;
  autoCapture: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  pushNotifications: false,
  darkMode: true,
  autoCapture: true,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('kudiscan-settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('kudiscan-settings', JSON.stringify(settings));
  }, [settings]);

  // Apply dark mode class to document
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [settings.darkMode]);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const togglePushNotifications = async () => {
    const newValue = !settings.pushNotifications;
    
    // If enabling notifications, check for browser support and request permission
    if (newValue && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          updateSetting('pushNotifications', true);
          return true;
        } else {
          updateSetting('pushNotifications', false);
          return false;
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        updateSetting('pushNotifications', false);
        return false;
      }
    } else if (!newValue) {
      // Disabling notifications
      updateSetting('pushNotifications', false);
      return true;
    } else {
      // Browser doesn't support notifications
      updateSetting('pushNotifications', false);
      return false;
    }
  };

  const toggleDarkMode = () => {
    updateSetting('darkMode', !settings.darkMode);
  };

  const toggleAutoCapture = () => {
    updateSetting('autoCapture', !settings.autoCapture);
  };

  return {
    settings,
    togglePushNotifications,
    toggleDarkMode,
    toggleAutoCapture,
  };
}