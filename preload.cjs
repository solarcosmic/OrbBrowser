/*
 * Orb Browser
 * Copyright (c) 2025 solarcosmic.

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
const { contextBridge, ipcRenderer } = require("electron");

if (location.pathname.endsWith("index.html")) {
    const { injectBrowserAction } = require("electron-chrome-extensions/browser-action");
    injectBrowserAction();
}

/*
reminder:
* renderer to main: ipcRenderer.send()
* main to renderer: ipcRenderer.on()
* renderer to main (two-way): ipcRenderer.invoke()
*/

contextBridge.exposeInMainWorld("electronAPI", {
    onMouseClick: (callback) => ipcRenderer.on("mouse-click", (_evt, x, y) => callback(x, y)),
    onLinkOpen: (callback) => ipcRenderer.on("open-link", (_evt, url) => callback(url)),
    sendConsoleLog: (txt) => ipcRenderer.send("renderer:console-log", txt),
    onAppBlur: (callback) => ipcRenderer.on("app-blur", (_evt) => callback()),
    onAppFocus: (callback) => ipcRenderer.on("app-focus", (_evt) => callback()),
    requestTabOpen: (url) => ipcRenderer.send("renderer:open-new-tab", url),
    clearBrowsingHistory: () => ipcRenderer.send("renderer:clear-browsing-history"),
    sendToRenderer: (callback) => ipcRenderer.on("send-to-renderer", (_evt, data) => callback(data)),
    contextMenuShow: (menu, args) => ipcRenderer.send("menu:context-menu-show", menu, args),
    sendTabActivated: (wvId) => ipcRenderer.send("main:tab-activated", wvId),
    showMainDropdown: (wvId) => ipcRenderer.send("renderer:toggle-main-dropdown"),
    printTab: (wvId) => ipcRenderer.send("renderer:print-tab", wvId),
    quitOrb: () => ipcRenderer.send("main:quit-orb"),
    getTrendingSearches: (country) => ipcRenderer.invoke("misc:get-trending-searches", country),
    minimiseOrb: () => ipcRenderer.send("main:minimise-orb"),
    maximiseOrb: () => ipcRenderer.send("main:maximise-orb"),
    getCountryCode: () => ipcRenderer.invoke("misc:get-country-code"),
    quitOrbSetup: (args) => ipcRenderer.send("main:quit-orb-setup", args),
    toggleOrbSentinel: () => ipcRenderer.invoke("misc:orb-sentinel-enabled"),
    getOrbSentinelStatus: () => ipcRenderer.invoke("misc:get-orb-sentinel-status"),
    toggleOrbTheme: () => ipcRenderer.invoke("misc:orb-theme-enabled"),
    getOrbThemeStatus: () => ipcRenderer.invoke("misc:get-orb-theme-status")
});