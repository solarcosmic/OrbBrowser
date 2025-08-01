console.log("preload")
window.addEventListener("mouseup", () => {
    window.parent.postMessage({type: "webview-mouseup"}, "*");
});