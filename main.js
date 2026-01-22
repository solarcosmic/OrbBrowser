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

import { app, BrowserWindow, WebContentsView, session, ipcMain, globalShortcut, Menu, webContents, components } from "electron";
import { buildChromeContextMenu } from "electron-chrome-context-menu";
import { ElectronChromeExtensions } from "electron-chrome-extensions";
import { installChromeWebStore } from "electron-chrome-web-store";
import { ElectronBlocker } from "@ghostery/adblocker-electron";
import path from "node:path";
import moment from "moment-timezone";
import ct from "countries-and-timezones";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Store from "electron-store";

// for Arch Linux installs, only enable when testing on Arch Linux or a Linux distro that doesn't let Orb start
/*app.commandLine.appendSwitch("no-sandbox");
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-gpu-sandbox");
app.commandLine.appendSwitch("disable-software-rasterizer");*/

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const store = new Store();

var win;
var extensions;
var browserSession;
var sentinel;
var theme;
var curmenu;
var appSetup;
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
    /*store.set("orb_setup_data", JSON.stringify({
        complete_setup: false,
        orb_sentinel: false
    }));*/
    const newTabShortcut = globalShortcut.register("CommandOrControl+T", () => {
        if (win && win.isFocused()) openLinkInNewTab(null, "https://google.com");
    })
    if (!newTabShortcut) console.error("New tab shortcut registration failed.");
    registerShortcut("CommandOrControl+W", "renderer:close-active-tab");
    registerShortcut("CommandOrControl+=", "renderer:zoom-in-active-tab");
    registerShortcut("CommandOrControl+-", "renderer:zoom-out-active-tab");
    registerShortcut("F5", "renderer:refresh-active-tab");
    registerShortcut("CommandOrControl+F", "renderer:find-in-page-toggle"); // initial
    registerShortcut("CommandOrControl+L", "renderer:switch-to-omnibox");
    registerShortcut("F6", "renderer:switch-to-omnibox");
    registerShortcut("CommandOrControl+Shift+F5", "renderer:cache-refresh");
    registerShortcut("CommandOrControl+R", "renderer:refresh-active-tab");
    const result = JSON.parse(store.get("orb_setup_data") || "{}");
    if (result) {
        if (result["complete_setup"] == true) {
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
            win.webContents.openDevTools();
            win.setBackgroundColor("#000000");
            win.loadFile("src/index.html");
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
            ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
                sentinel = blocker;
                if (result["orb_sentinel"] == true) {
                    blocker.enableBlockingInSession(session.defaultSession);
                } else {
                    blocker.disableBlockingInSession(session.defaultSession);
                }
            });
        } else {
            appSetup = new BrowserWindow({
                width: 640,
                height: 480,
                show: true,
                frame: false,
                backgroundColor: "#000000",
                webPreferences: {
                    preload: path.join(__dirname, "dist/preload.bundle.js"),
                    webviewTag: true,
                    session: browserSession,
                    nativeWindowOpen: true,
                },
            });
            appSetup.loadFile("src/welcome.html");
        }
    }
}

app.on("will-quit", () => {
    globalShortcut.unregister("CommandOrControl+T");
})

function registerShortcut(keybind, pointTo) {
    const shortcut = globalShortcut.register(keybind, () => {
        if (win && win.isFocused()) win.webContents.send(pointTo);
    });
    if (!shortcut) console.error(`Shortcut registration for ${keybind} (${pointTo}) failed.`);
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
    ipcMain.on("main:minimise-orb", minimiseOrb);
    ipcMain.on("main:maximise-orb", maximiseOrb);
    ipcMain.handle("misc:get-country-code", getCountryCode);
    ipcMain.on("main:quit-orb-setup", quitOrbSetup)
    ipcMain.handle("misc:orb-sentinel-enabled", toggleOrbSentinel);
    ipcMain.handle("misc:get-orb-sentinel-status", getOrbSentinelStatus);
    ipcMain.handle("misc:orb-theme-enabled", toggleOrbTheme);
    ipcMain.handle("misc:get-orb-theme-status", getOrbThemeStatus);
    ipcMain.handle("misc:orb-sidebar-lr-toggle", toggleOrbSidebarPosition);
    ipcMain.handle("misc:get-orb-sidebar-lr-status", getOrbSidebarPositionStatus);
    ipcMain.on("renderer:clear-bookmarks", clearBookmarks);
    ipcMain.on("main:zoom-in-with-tab-id", zoomInTab);
    ipcMain.on("main:zoom-out-with-tab-id", zoomOutTab);
});
app.on("web-contents-created", (evt, webContents) => {
    if (extensions && webContents && webContents.getType && webContents.getType() == "webview" && win && typeof win.id != "undefined") {
        extensions.addTab(webContents, win);
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
    }
});
function handleRendererLog(evt, txt) {
    console.log(txt);
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
function clearBookmarks() {
    if (win) win.webContents.send("send-to-renderer", JSON.stringify({
        action: "clear-bookmarks",
        success: true
    }));
}
function contextMenuShow(evt, menu, args) {
    console.log(menu, args);
    // right-click-button is the name
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
            },
            {
                label: "Close Tab",
                click: () => {
                    if (win) win.webContents.send("send-to-renderer", JSON.stringify({
                        action: "close-tab",
                        success: true,
                        tabId: args["tabId"]
                    }));
                }
            },
            {
                label: "Duplicate Tab",
                click: () => {
                    if (win) win.webContents.send("send-to-renderer", JSON.stringify({
                        action: "duplicate-tab",
                        success: true,
                        tabId: args["tabId"]
                    }));
                }
            },
            {
                label: "Add to Bookmarks",
                click: () => {
                    if (win) win.webContents.send("send-to-renderer", JSON.stringify({
                        action: "create-bookmark",
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
            label: "Bookmarks",
            click: () => {
                if (win) win.webContents.send("send-to-renderer", JSON.stringify({
                    action: "menu-bookmarks",
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
            label: "Settings",
            click: () => {
                if (win) win.webContents.send("send-to-renderer", JSON.stringify({
                    action: "menu-settings",
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
    const code = ct.getCountryForTimezone(moment.tz.guess());
    console.log(code);
    return code;
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
function minimiseOrb() {
    if (win) win.minimize();
}
function maximiseOrb() {
    if (win) {
        if (!win.isMaximized()) {
            win.maximize();
        } else {
            win.unmaximize();
        }
    }
}
function quitOrbSetup(evt, args) {
    if (appSetup) {
        store.set("orb_setup_data", args);
        app.relaunch();
        app.exit(0);
    }
}
function toggleOrbSentinel(evt) {
    const result = JSON.parse(store.get("orb_setup_data"));
    if (result) {
        if (result["orb_sentinel"] == true) {
            console.log("[net.solarcosmic.orbbrowser.main:sentinel] Orb Sentinel is currently true - disabling now!");
            sentinel.disableBlockingInSession(session.defaultSession);
            store.set("orb_setup_data", JSON.stringify({
                complete_setup: true,
                orb_sentinel: false,
                orb_theme: result["orb_theme"] || true
            }));
            return false;
        } else {
            console.log("[net.solarcosmic.orbbrowser.main:sentinel] Orb Sentinel is currently false - enabling now!");
            sentinel.enableBlockingInSession(session.defaultSession);
            store.set("orb_setup_data", JSON.stringify({
                complete_setup: true,
                orb_sentinel: true,
                orb_theme: result["orb_theme"] || true
            }));
            return true;
        }
    }
    return false;
}
function toggleOrbTheme(evt) {
    const result = JSON.parse(store.get("orb_setup_data"));
    if (result) {
        if (result["orb_theme"] == "dark") {
            console.log("[net.solarcosmic.orbbrowser.main:theme] Orb Theme is currently dark - changing to light now!");
            theme = "light";
            store.set("orb_setup_data", JSON.stringify({
                complete_setup: true,
                orb_sentinel: result["orb_sentinel"] || false,
                orb_theme: "light"
            }));
        } else {
            console.log("[net.solarcosmic.orbbrowser.main:theme] Orb Theme is currently light - changing to dark now!");
            theme = "dark";
            store.set("orb_setup_data", JSON.stringify({
                complete_setup: true,
                orb_sentinel: result["orb_sentinel"] || false,
                orb_theme: "dark"
            }));
        }
        if (win) win.webContents.send("theme-update-immediately", theme);
        return theme;
    }
    return false;
}
function getOrbThemeStatus(evt) {
    const result = JSON.parse(store.get("orb_setup_data"));
    if (result) {
        return result["orb_theme"];
    }
}
function getOrbSentinelStatus(evt) {
    const result = JSON.parse(store.get("orb_setup_data"));
    if (result) {
        return result["orb_sentinel"];
    }
}
function toggleOrbSidebarPosition(evt) {
    const result = JSON.parse(store.get("orb_setup_data"));
    const newPos = result["orb_sidebar_position"] == "Left" ? "Right" : "Left";
    store.set("orb_setup_data", JSON.stringify({
        complete_setup: true,
        orb_sentinel: result["orb_sentinel"] || false,
        orb_theme: result["orb_theme"] || "dark",
        orb_sidebar_position: newPos
    }));
    if (win) win.webContents.send("send-to-renderer", JSON.stringify({
        action: "change-sidebar-position",
        success: true,
        position: newPos
    }));
    if (win) win.webContents.send("toggle-sidebar-lr-immediately", newPos);
    return newPos;
}
function getOrbSidebarPositionStatus(evt) {
    const result = JSON.parse(store.get("orb_setup_data"));
    return result["orb_sidebar_position"] || "Left";
}
function zoomInTab(evt, tabId) {
    const wc = webContents.fromId(tabId);
    if (!wc) return;
    const newFactor = clamp(wc.getZoomFactor() + 0.1, 0.1, 5);
    wc.setZoomFactor(newFactor);
}
function zoomOutTab(evt, tabId) {
    const wc = webContents.fromId(tabId);
    if (!wc) return;
    const newFactor = clamp(wc.getZoomFactor() - 0.1, 0.1, 5);
    wc.setZoomFactor(newFactor);
}
function clamp(num, min, max) {
    return Math.min(max, Math.max(num, min)); // https://stackoverflow.com/a/11409944
}