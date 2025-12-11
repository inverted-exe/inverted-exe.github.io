// Hybrid Database System
// Uses localStorage for offline access + syncs with remote database
// Supports both Firebase and GitHub options

const STORAGE_KEY = 'inverted_admin_data';
const STORAGE_LAST_SYNC = 'inverted_last_sync';

// Main database interface
const DatabaseSync = {
  // Initialize database
  init: async (useFirebase = false) => {
    console.log('Initializing database system...');
    
    // Load from localStorage first
    const localData = localStorage.getItem(STORAGE_KEY);
    
    if (useFirebase && typeof firebase !== 'undefined') {
      // Use Firebase
      await DatabaseSync.syncFromFirebase();
    } else {
      // Use GitHub or local
      await DatabaseSync.syncFromGitHub();
    }
  },

  // Sync from Firebase
  syncFromFirebase: async () => {
    try {
      if (typeof firebase === 'undefined') {
        console.warn('Firebase not initialized');
        return;
      }
      
      const db = firebase.database();
      db.ref('content').once('value').then((snapshot) => {
        const data = snapshot.val() || { shop: [], archive: [], gallery: [] };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(STORAGE_LAST_SYNC, new Date().toISOString());
        console.log('Data synced from Firebase');
      });
    } catch (error) {
      console.error('Error syncing from Firebase:', error);
    }
  },

  // Sync from GitHub
  syncFromGitHub: async () => {
    try {
      const response = await fetch('data/content.json');
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(STORAGE_LAST_SYNC, new Date().toISOString());
        console.log('Data synced from GitHub');
      }
    } catch (error) {
      console.error('Error syncing from GitHub:', error);
    }
  },

  // Load data from localStorage (always use this for page views)
  load: () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { shop: [], archive: [], gallery: [] };
  },

  // Save data (to localStorage + remote)
  save: async (data, useFirebase = false) => {
    // Save to localStorage first
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    // Then sync to remote
    if (useFirebase && typeof firebase !== 'undefined') {
      await DatabaseSync.saveToFirebase(data);
    } else {
      await DatabaseSync.saveToGitHub(data);
    }
  },

  // Save to Firebase
  saveToFirebase: async (data) => {
    try {
      if (typeof firebase === 'undefined') {
        console.warn('Firebase not initialized');
        return false;
      }
      
      const db = firebase.database();
      await db.ref('content').set(data);
      console.log('Data saved to Firebase');
      return true;
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      return false;
    }
  },

  // Save to GitHub
  saveToGitHub: async (data) => {
    try {
      // This is a fallback - in production, use proper GitHub API with authentication
      console.log('Note: To save to GitHub, use GitHub API with proper authentication');
      return false;
    } catch (error) {
      console.error('Error saving to GitHub:', error);
      return false;
    }
  },

  // Check if data is outdated (more than 1 hour)
  isOutdated: () => {
    const lastSync = localStorage.getItem(STORAGE_LAST_SYNC);
    if (!lastSync) return true;
    
    const lastSyncTime = new Date(lastSync).getTime();
    const currentTime = new Date().getTime();
    const oneHour = 60 * 60 * 1000;
    
    return (currentTime - lastSyncTime) > oneHour;
  },

  // Force sync with remote
  forceSync: async (useFirebase = false) => {
    if (useFirebase) {
      await DatabaseSync.syncFromFirebase();
    } else {
      await DatabaseSync.syncFromGitHub();
    }
  }
};

// Simple fallback: Load from JSON file directly
const DatabaseJSON = {
  loadFromJSON: async () => {
    try {
      const response = await fetch('data/content.json');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error loading JSON:', error);
    }
    return { shop: [], archive: [], gallery: [] };
  }
};
