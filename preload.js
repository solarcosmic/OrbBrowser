const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    createNewTab: (url) => ipcRenderer.send("new-tab", url)
})