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

const { app, BrowserWindow, WebContentsView, session, ipcMain, globalShortcut, components, Menu } = require("electron");
const { default: buildChromeContextMenu } = require("electron-chrome-context-menu");
const path = require("node:path");

var win;
function createMainWindow() {
    win = new BrowserWindow({
        width: 1280,
        height: 720,
        show: false,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            webviewTag: true
        }
    })
    win.setMenu(null);
    win.setBackgroundColor("#000000");
    win.loadFile("src/index.html");
    win.webContents.openDevTools();
    /*win.webContents.on("did-finish-load", function() {
        win.show();
    })*/
    win.show();
    win.on("focus", () => {
        if (win) win.webContents.send("app-focus");
    });
    win.on("blur", () => {
        if (win) win.webContents.send("app-blur");
    });
}
app.whenReady().then(async () => {
    if (process.platform != "linux") await components.whenReady();
    createMainWindow();
    ipcMain.on("renderer:console-log", handleRendererLog);
    ipcMain.on("renderer:open-new-tab", openLinkInNewTab);
    ipcMain.on("renderer:clear-browsing-history", clearBrowsingHistory);
    ipcMain.on("menu:context-menu-show", contextMenuShow);
});
app.on("web-contents-created", (evt, webContents) => {
    webContents.on("context-menu", (e, params) => {
        const isWebView = webContents.getType && webContents.getType() == "webview";
        if (!isWebView) return;
        buildChromeContextMenu({
            params,
            webContents,
            openLink: (url, dis) => {
                if (win) win.webContents.send("open-link", url);
            }
        }).popup();
    });
    webContents.on("before-mouse-event", (evt, mouse) => { // TODO: check to make sure this won't memory leak?
        if (mouse.type == "mouseDown") {
            if (win) win.webContents.send("mouse-click", mouse.x, mouse.y); // can add x and y args later
        }
    });
});
function handleRendererLog(evt, txt) {
    console.log("[net.solarcosmic.orbbrowser.main]: " + txt);
}
function openLinkInNewTab(evt, url) {
    win.webContents.send("open-link", url);
}
function clearBrowsingHistory() {
    if (win) win.webContents.send("send-to-renderer", JSON.stringify({
        action: "clear-browsing-data",
        success: true
    }));
}
function contextMenuShow(evt, menu, args) {
    console.log(menu, args);
    const built = Menu.buildFromTemplate([
        {
            label: "Pin Tab",
            click: () => {
                if (win) win.webContents.send("send-to-renderer", JSON.stringify({
                    action: "pin-tab",
                    success: true,
                    tabId: args["tabId"]
                }));
            }
        }
    ]);
    built.popup();
}