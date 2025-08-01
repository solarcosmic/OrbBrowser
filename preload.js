const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    onMouseClick: (callback) => ipcRenderer.on("mouse-click", (_evt, x, y) => callback(x, y))
});