const WTTabs = {
  _currentTab: null,
  _tabContents: new Map(),
  init() {
    const go = () => {
      this._renderTabContents();
      this._setupEventListeners();
      this._switchTab("today");
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", go);
    } else {
      go();
    }
  },
  _renderTabContents() {
    ["today","analysis","ai","history","settings"].forEach(name => {
      const el = document.getElementById("tab-content-" + name);
      if (el) this._tabContents.set(name, el);
    });
  },
  _setupEventListeners() {
    document.querySelectorAll(".tab-bar__tab").forEach(item => {
      item.addEventListener("click", (e) => {
        const t = e.currentTarget.dataset.tab;
        if (t) this._switchTab(t);
      });
    });
  },
  _switchTab(tabName) {
    if (this._currentTab === tabName) return;
    const prev = this._tabContents.get(this._currentTab);
    if (prev) prev.classList.remove("active");
    this._currentTab = tabName;
    const next = this._tabContents.get(tabName);
    if (next) next.classList.add("active");
    if (tabName === 'ai' && window.WTAI) WTAI.startTimer();
    if (tabName === 'history' && window.WTHistory) WTHistory._render();
    document.querySelectorAll(".tab-bar__tab").forEach(item => {
      item.classList.toggle("active", item.dataset.tab === tabName);
    });
  },
  setActiveTab(tabName) { this._switchTab(tabName); }
};
window.WTTabs = WTTabs;
WTTabs.init();
