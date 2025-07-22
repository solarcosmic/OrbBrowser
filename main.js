const { app, BrowserWindow, WebContentsView, webContents, BaseWindow } = require("electron");
const { ElectronChromeExtensions } = require("electron-chrome-extensions");
const { buildChromeContextMenu } = require("electron-chrome-context-menu");

var win;
var mainView;
var overlayView;
const createMainWindow = () => {
    const extensions = new ElectronChromeExtensions({license: "GPL-3.0"});
    win = new BaseWindow({
        width: 1280,
        height: 720,
        backgroundColor: "#0f0f0f"
    });
    win.setMenu(null);
    mainView = new WebContentsView();
    overlayView = new WebContentsView();
    extensions.addTab(mainView.webContents, win);
    win.contentView.addChildView(overlayView);
    win.contentView.addChildView(mainView);
    overlayView.webContents.loadFile("index.html");
    overlayView.webContents.openDevTools();
    //win.loadFile("index.html");
    var bounds = win.getBounds();
    mainView.webContents.loadURL("https://google.com");
    overlayView.setBounds({x: 0, y: 0, width: bounds.width, height: bounds.height});
    mainView.setBounds({x: 0, y: 0, width: 500, height: 500});
    mainView.setBorderRadius(5);
    win.on("resize", () => {
        bounds = win.getBounds();
        overlayView.setBounds({x: 0, y: 0, width: bounds.width, height: bounds.height});
        mainView.setBounds({x: 250, y: 50, width: bounds.width - 260, height: bounds.height - 60});
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
    createMainWindow();
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
})