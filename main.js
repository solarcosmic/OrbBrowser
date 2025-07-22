const { app, BrowserWindow, WebContentsView, session, ipcMain } = require("electron");
const { ElectronChromeExtensions } = require("electron-chrome-extensions");
const { buildChromeContextMenu } = require("electron-chrome-context-menu");
const { installChromeWebStore } = require("electron-chrome-web-store");
const path = require("node:path");

var win;
var mainView;
var browserSession;
var extensions;
const createMainWindow = async () => {
    extensions = new ElectronChromeExtensions({license: "GPL-3.0"});
    browserSession = session.defaultSession;
    win = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            session: browserSession,
            preload: path.join(__dirname, "preload.js")
        },
        //backgroundColor: "#0f0f0f"
    });
    win.setMenu(null);
    await installChromeWebStore({session: browserSession});
    mainView = new WebContentsView({session: browserSession});
    //mainView.webContents.setUserAgent(session.defaultSession.getUserAgent());
    extensions.addTab(mainView.webContents, win);
    win.contentView.addChildView(mainView);
    //win.loadFile("index.html");
    var bounds = win.getBounds();
    win.webContents.loadFile("index.html");
    mainView.webContents.loadURL("https://chrome.google.com/webstore/category/extensions");
    mainView.setBounds({x: 0, y: 0, width: 500, height: 500});
    mainView.setBorderRadius(5);
    win.on("resize", () => {
        bounds = win.getBounds();
        mainView.setBounds({x: 250, y: 10, width: bounds.width - 260, height: bounds.height - 20});
    });
    mainView.webContents.on("context-menu", (e, params) => {
        const menu = buildChromeContextMenu({
            params,
            webContents: mainView.webContents,
            openLink: (url, disposition) => {
                console.log("Link requested: " + url);
            }
        });
        menu.popup();
    });
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
        view: new WebContentsView({session: browserSession}),
        lastActive: Date.now(),
        timeoutId: null
    };
    tab.view.webContents.loadURL(url);
    extensions.addTab(tab.view.webContents, win);
    win.contentView.addChildView(tab.view);
    tabs.push(tab);
    return tab;
}

function activateTab(tab) {
    tab.lastActive = Date.now();
    if (!tab.view) {
        tab.view = new WebContentsView({session: browserSession});
        tab.view.webContents.loadURL(tab.url);
        extensions.addTab(tab.view.webContents, win);
        win.contentView.addChildView(tab.view);
    }
    tabs.forEach(t => {
        if (t != tab && t.view) {
            win.contentView.removeChildView(t.view);
        }
    });
    var bounds = win.getBounds();
    tab.view.setBounds({x: 250, y: 10, width: bounds.width - 260, height: bounds.height - 20});
}

function createTabIPC(event, url) {
    console.log("url received: " + url);
    const tab = createTab(url);
    activateTab(tab);
    console.log("activated tab with url: " + url);
}