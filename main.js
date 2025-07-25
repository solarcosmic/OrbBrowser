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

const { app, BrowserWindow, WebContentsView, session, ipcMain } = require("electron");
const { ElectronChromeExtensions } = require("electron-chrome-extensions");
const { buildChromeContextMenu } = require("electron-chrome-context-menu");
const { installChromeWebStore } = require("electron-chrome-web-store");
const path = require("node:path");

var win;
var browserSession;
var extensions;
const createMainWindow = async () => {
    browserSession = session.defaultSession;
    extensions = new ElectronChromeExtensions({
        license: "GPL-3.0",
        session: browserSession,
        createTab(details) {
            console.log("Attempt to create tab: " + details);
            //activateTab(createTab())
        }
    });
    
    win = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            session: browserSession,
            preload: path.join(__dirname, "preload.js")
        },
    });
    win.setMenu(null);
    await installChromeWebStore({session: browserSession});
    //mainView.webContents.setUserAgent(session.defaultSession.getUserAgent());
    //extensions.addTab(mainView.webContents, win);
    //win.contentView.addChildView(mainView);
    win.loadFile("index.html");
    activateTab(createTab());
    //var bounds = win.getBounds();
    //win.webContents.loadFile("index.html");
    //mainView.webContents.loadURL("https://chrome.google.com/webstore/category/extensions");
    //mainView.setBounds({x: 0, y: 0, width: 500, height: 500});
    //mainView.setBorderRadius(5);
    // TODO: REIMPLEMENT BELOW
    /*win.on("resize", () => {
        bounds = win.getBounds();
        mainView.setBounds({x: 250, y: 10, width: bounds.width - 260, height: bounds.height - 20});
    });*/
    win.webContents.openDevTools();
}

app.whenReady().then(() => {
    ipcMain.on("new-tab", createTabIPC);
    createMainWindow();
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
})

var tabs = [];

const tab_timeout = 60000 * 5;
function createTab(url = "https://www.google.com") {
    const tab = {
        url,
        title: url,
        view: new WebContentsView({session: browserSession}),
        lastActive: Date.now(),
        timeoutId: null,
        index: tabs.length
    };
    tab.view.webContents.loadURL(url);
    extensions.addTab(tab.view.webContents, win);
    win.contentView.addChildView(tab.view);
    tab.view.webContents.on("context-menu", (e, params) => {
        const menu = buildChromeContextMenu({
            params,
            webContents: tab.view.webContents,
            openLink: (url, disposition) => {
                console.log("Link requested: " + url);
                activateTab(createTab(url));
            }
        });
        menu.popup();
    });
    tab.view.webContents.on("page-title-updated", (e, title) => {
        tab.title = title;
        win.setTitle(title + " ⎯  Orb Browser");
        tablist_setTabTitle(tab.index, title);
    });
    tabs.push(tab);
    sendTabsUpdate();
    return tab;
}

function activateTab(tab) {
    tab.lastActive = Date.now();
    if (!tab.view) {
        tab.view = new WebContentsView({session: browserSession});
        tab.view.webContents.loadURL(tab.url);
        extensions.addTab(tab.view.webContents, win);
    }
    tabs.forEach(t => {
        if (t != tab && t.view) {
            win.contentView.removeChildView(t.view);
        }
    });
    
    win.contentView.addChildView(tab.view);
    var bounds = win.getBounds();
    tab.view.setBounds({x: 290, y: 10, width: bounds.width - 300, height: bounds.height - 20});
    tab.view.setBorderRadius(10);
    sendTabsUpdate();
}

function createTabIPC(event, url) {
    console.log("url received: " + url);
    const tab = createTab(url);
    activateTab(tab);
    console.log("activated tab with url: " + url);
}

function sendTabsUpdate() {
    if (!win) return;
    win.webContents.send("tabs-updated", tabs.map((tab, idx) => ({
        url: tab.url,
        title: tab.title,
        active: tab.view ? true : false,
        index: idx,
    })));
}

function tablist_setTabTitle(idx, title) {
    win.webContents.send("tablist_set-tab-title", idx, title);
}

ipcMain.on("activate-tab", (_, idx) => {
    if (tabs[idx]) {
        console.log("tab idx: " + idx);
        console.log(tabs[idx]);
        activateTab(tabs[idx]);
        sendTabsUpdate();
    }
})

async function activateTabRenderer(idx) {
    
}