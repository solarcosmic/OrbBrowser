const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    createNewTab: (url) => ipcRenderer.send("new-tab", url),
    onTabsUpdated: (callback) => ipcRenderer.on("tabs-updated", (evt, tabs) => callback(tabs)),
    activateTab: (index) => ipcRenderer.send("activate-tab", index),
    tablist_setTabTitle: (callback) => ipcRenderer.on("tablist_set-tab-title", (evt, tab, title) => callback(tab, title)),
})