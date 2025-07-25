const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    createNewTab: (url) => ipcRenderer.send("new-tab", url),
    onTabsUpdated: (callback) => ipcRenderer.on("tabs-updated", (evt, tabs) => callback(tabs)),
    activateTab: (index) => ipcRenderer.send("activate-tab", index),
    tablist_setTabTitle: (callback) => ipcRenderer.on("tablist_set-tab-title", (evt, tab, title) => callback(tab, title)),
    setActiveTab: (callback) => ipcRenderer.on("set-active-tab", (evt, index) => callback(index)),
    tablist_setTabIcon: (callback) => ipcRenderer.on("tablist_set-tab-icon", (evt, tab, icon) => callback(tab, icon)),
})