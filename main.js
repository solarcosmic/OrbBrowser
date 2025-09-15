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
<<<<<<< Updated upstream
const { ElectronChromeExtensions } = require("electron-chrome-extensions");
const { installChromeWebStore } = require("electron-chrome-web-store");
=======
const {ElectronChromeExtensions} = require("electron-chrome-extensions");
const {installChromeWebStore} = require("electron-chrome-web-store");
>>>>>>> Stashed changes
const path = require("node:path");

var win;
var extensions;
<<<<<<< Updated upstream
=======
var browserSession;
>>>>>>> Stashed changes
function createMainWindow() {
    browserSession = session.defaultSession;
    extensions = new ElectronChromeExtensions({
        license: "GPL-3.0",
        session: browserSession,
        createTab(details) {
            if (win) win.webContents.send("open-link", details.url);
        }
    })
    win = new BrowserWindow({
        width: 1280,
        height: 720,
        show: false,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            webviewTag: true,
            session: browserSession
        },
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
<<<<<<< Updated upstream
    const browserSession = session.fromPartition("persist:custom");
    extensions = new ElectronChromeExtensions({
        license: "GPL-3.0",
        session: browserSession,
        createTab(details) {
            console.log("Create tab called:", details);
            for (const key in details) {
                console.log("Create tab key: " + key);
            }
        }
    });
=======
>>>>>>> Stashed changes
    installChromeWebStore({session: browserSession});
}
function onTabCreate(wc) {
    if (extensions && wc && wc.getType && wc.getType() == "webview" && win && typeof win.id != "undefined") {
        extensions.addTab(wc, win);
    }
}

app.whenReady().then(async () => {
    if (process.platform != "linux") await components.whenReady();
    createMainWindow();
    ipcMain.on("renderer:console-log", handleRendererLog);
    ipcMain.on("renderer:open-new-tab", openLinkInNewTab);
    ipcMain.on("renderer:clear-browsing-history", clearBrowsingHistory);
    ipcMain.on("menu:context-menu-show", contextMenuShow);
    ipcMain.handle("extensions:get-extensions", getChromeExtensions);
    ipcMain.on("extensions:activate-extension", activateChromeExtension);
    ipcMain.on("extensions:activate-extension-context-menu", activateChromeExtensionContextMenu);
});
app.on("web-contents-created", (evt, webContents) => {
<<<<<<< Updated upstream
    const isWebView = webContents.getType && webContents.getType() == "webview";
    if (!isWebView) return;
    //console.log(extensions, webContents, win);
    if (extensions) extensions.addTab(webContents, win);
=======
    onTabCreate(webContents);
>>>>>>> Stashed changes
    webContents.on("context-menu", (e, params) => {
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
    // right-click-button is the name
    var curmenu = null;
    if (args["isPinned"] == true) {
        curmenu = Menu.buildFromTemplate([
            {
                label: "Unpin Tab",
                click: () => {
                    if (win) win.webContents.send("send-to-renderer", JSON.stringify({
                        action: "unpin-tab",
                        success: true,
                        tabId: args["tabId"]
                    }));
                }
            }
        ]);
    } else {
        curmenu = Menu.buildFromTemplate([
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
    }
    if (curmenu) curmenu.popup();
}
function getChromeExtensions() {
    console.log(extensions.store);
    return Array.from(extensions.store.extensions.values()).map(ext => ({
        id: ext.id,
        name: ext.name,
        icons: ext.manifest.icons,
        manifest: ext.manifest
    }));
}
function activateChromeExtension(event, extId) {
    console.log("Extension activated DEMO");
}
function activateChromeExtensionContextMenu(event, extId) {
    const menu = Menu.buildFromTemplate([
        {label: "Options", click: () => {}},
        {label: "Remove", click: () => {}},
        {label: "Manage Extension", click: () => {}},
    ])
    menu.popup();
}