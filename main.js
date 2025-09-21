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

const { app, BrowserWindow, WebContentsView, session, ipcMain, globalShortcut, components, Menu, webContents } = require("electron");
const { default: buildChromeContextMenu } = require("electron-chrome-context-menu");
const {ElectronChromeExtensions} = require("electron-chrome-extensions");
const {installChromeWebStore} = require("electron-chrome-web-store");
const {ElectronBlocker} = require("@ghostery/adblocker-electron");
const path = require("node:path");
const moment = require("moment-timezone");
const ct = require("countries-and-timezones");

var win;
var extensions;
var browserSession;
var sentinel;
function createMainWindow() {
    browserSession = session.defaultSession;
    ElectronChromeExtensions.handleCRXProtocol(browserSession);
    extensions = new ElectronChromeExtensions({
        license: "GPL-3.0",
        session: browserSession,
        createTab(details) {
            if (win) win.webContents.send("open-link", details.url);
        },
        selectTab(tab, browserWindow) {
            //console.log("SELECT TAB CALLED: ", tab, browserWindow);
        },
        removeTab(tab, browserWindow) {
            //console.log("REMOVE TAB CALLED: ", tab, browserWindow);
        },
        createWindow(details) {
            if (win) {
                win.webContents.send("open-link", details.url)
                handleRendererLog(null, "A chrome extension attempted to open a new window, Orb opened a new tab instead.");
                //console.log(details);
            };
        },
        removeWindow(browserWindow) {
            //console.log("REMOVE WINDOW CALLED: ", browserWindow);
        },
        requestPermissions(extension, permissions) {
            console.log(null, "Permissions requested: ", extension, permissions);
        }
    });
    /*ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
        sentinel = blocker;
        blocker.enableBlockingInSession(session.defaultSession);
    })*/
    win = new BrowserWindow({
        width: 1280,
        height: 720,
        show: false,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, "dist/preload.bundle.js"),
            webviewTag: true,
            session: browserSession,
            nativeWindowOpen: true,
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
    /* https://github.com/electron/electron/issues/40613 */
    /* https://github.com/solarcosmic/CascadeBrowser/blob/main/main.js */
    app.on('web-contents-created', (e, contents) => {
        if (contents.getType() == 'webview') {
        contents.setWindowOpenHandler((details) => {
            console.log(details.url);
            win.webContents.send("open-link", details.url);
        })
        }
    });
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
    ipcMain.on("main:tab-activated", onTabActivated);
    ipcMain.on("renderer:toggle-main-dropdown", showMainDropdown);
    ipcMain.on("renderer:print-tab", printTab);
    ipcMain.on("main:quit-orb", quitOrb);
    ipcMain.handle("misc:get-trending-searches", getTrendingSearches);
});
app.on("web-contents-created", (evt, webContents) => {
    onTabCreate(webContents);
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
function onTabActivated(evt, wvId) {
    const wc = webContents.fromId(wvId);
    if (wc && extensions) {
        extensions.selectTab(wc);
    }
}
function showMainDropdown() {
    curmenu = Menu.buildFromTemplate([
        {
            label: "New Tab",
            click: () => {
                if (win) win.webContents.send("send-to-renderer", JSON.stringify({
                    action: "menu-new-tab",
                    success: true,
                    //tabId: args["tabId"]
                }));
            }
        },
        {
            label: "History",
            click: () => {
                if (win) win.webContents.send("send-to-renderer", JSON.stringify({
                    action: "menu-history",
                    success: true,
                    //tabId: args["tabId"]
                }));
            }
        },
        {
            label: "Print",
            click: () => {
                if (win) win.webContents.send("send-to-renderer", JSON.stringify({
                    action: "menu-print",
                    success: true,
                    //tabId: args["tabId"]
                }));
            }
        },
        {
            type: "separator"
        },
        {
            label: "About",
            click: () => {
                if (win) win.webContents.send("send-to-renderer", JSON.stringify({
                    action: "menu-about",
                    success: true,
                    //tabId: args["tabId"]
                }));
            }
        },
        {
            label: "Help",
            click: () => {
                if (win) win.webContents.send("send-to-renderer", JSON.stringify({
                    action: "menu-help",
                    success: true,
                    //tabId: args["tabId"]
                }));
            }
        },
        {
            type: "separator"
        },
        {
            label: "Quit Orb",
            click: () => {
                if (win) win.webContents.send("send-to-renderer", JSON.stringify({
                    action: "menu-quit",
                    success: true,
                    //tabId: args["tabId"]
                }));
            }
        },
    ]);
    if (curmenu) curmenu.popup();
}
function printTab(evt, wvId) {
    const wc = webContents.fromId(wvId);
    if (wc) wc.print();
}
function quitOrb() {
    app.quit();
}
/* from https://github.com/vireshshah/js-user-country/blob/master/src/index.js */
function getCountryCode() {
    return ct.getCountryForTimezone(moment.tz.guess());
}
async function getTrendingSearches(evt, country) {
    const res = await fetch("https://trends.google.com/trending/rss?geo=" + country, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36"
        }
    });
    if (!res.ok) console.log("Error while fetching trending searches: " + res.status);
    return await res.text();
}