// Weight Training Core Module
(function() {
  'use strict';

  const STORAGE_KEY = 'wt_app';

  // Data structure
  let appState = {
    categories: [],
    exercises: [],
    records: [],
    settings: {}
  };

  /**
   * Initialize app state from localStorage
   */
  function initializeFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        appState = {
          categories: parsed.categories || [],
          exercises: parsed.exercises || [],
          records: parsed.records || [],
          settings: parsed.settings || {}
        };
      }
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
    }
  }

  /**
   * Save app state to localStorage
   */
  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  /**
   * Get safe state (copy)
   * @returns {Object} Current app state
   */
  function safeGetState() {
    return JSON.parse(JSON.stringify(appState));
  }

  /**
   * Set state safely and persist to localStorage
   * @param {Object} newState - New state to set
   */
  function safeSetState(newState) {
    appState = {
      categories: newState.categories || appState.categories,
      exercises: newState.exercises || appState.exercises,
      records: newState.records || appState.records,
      settings: newState.settings || appState.settings
    };
    saveToStorage();
  }

  // Export to global scope
  window.WTCore = {
    initializeFromStorage: initializeFromStorage,
    saveToStorage: saveToStorage,
    safeGetState: safeGetState,
    safeSetState: safeSetState
  };

})();