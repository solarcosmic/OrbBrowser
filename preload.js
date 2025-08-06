const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    onMouseClick: (callback) => ipcRenderer.on("mouse-click", (_evt, x, y) => callback(x, y)),
    onLinkOpen: (callback) => ipcRenderer.on("open-link", (_evt, url) => callback(url)),
    sendConsoleLog: (txt) => ipcRenderer.send("renderer:console-log", txt),
    onAppBlur: (callback) => ipcRenderer.on("app-blur", (_evt) => callback()),
    onAppFocus: (callback) => ipcRenderer.on("app-focus", (_evt) => callback()),
});