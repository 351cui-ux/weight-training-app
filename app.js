// Weight Training App - Bootstrap
(function() {
  'use strict';

  const modules = [];

  /**
   * Initialize all modules
   */
  function initializeModules() {
    // Initialize WTCore
    if (window.WTCore) {
      WTCore.initializeFromStorage();
      modules.push('WTCore');
      console.log('WTCore initialized');
    }

    // Initialize WTTabs
    if (window.WTTabs) {
      WTTabs.init();
      modules.push('WTTabs');
      console.log('WTTabs initialized');
    }

    // Initialize record module
    if (window.WTRecord) {
      WTRecord.init();
      modules.push('WTRecord');
      console.log('WTRecord initialized');
    }

    // Initialize history module
    if (window.WTHistory) {
      WTHistory.init();
      modules.push('WTHistory');
      console.log('WTHistory initialized');
    }

    // Initialize analysis module
    if (window.WTAnalysis) {
      WTAnalysis.init();
      modules.push('WTAnalysis');
      console.log('WTAnalysis initialized');
    }

    // Initialize AI module
    if (window.WTAI) {
      WTAI.init();
      modules.push('WTAI');
      console.log('WTAI initialized');
    }

    // Initialize settings module
    if (window.WTSettings) {
      WTSettings.init();
      modules.push('WTSettings');
      console.log('WTSettings initialized');
    }

    console.log('All modules initialized:', modules);
  }

  /**
   * Connect all modules when DOM is loaded
   */
  function connectModules() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeModules);
    } else {
      initializeModules();
    }
  }

  // Bootstrap the app
  connectModules();

})();