const { app, BrowserWindow, WebContentsView } = require("electron");

var win;
var mainView;
const createMainWindow = () => {
    win = new BrowserWindow({
        width: 1280,
        height: 720
    });
    mainView = new WebContentsView();
    win.contentView.addChildView(mainView);
    mainView.webContents.loadURL("https://google.com")
    console.log(win.getBounds());
    mainView.setBounds({x: 0, y: 0, width: 500, height: 500});
    win.loadFile("index.html");
    var bounds = win.getBounds();
    mainView.setBorderRadius(5);
    win.on("resize", () => {
        bounds = win.getBounds();
        mainView.setBounds({x: 250, y: 50, width: bounds.width - 260, height: bounds.height - 90});
    });
}

app.whenReady().then(() => {
    createMainWindow();
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
})