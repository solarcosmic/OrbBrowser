export var browseHistory = JSON.parse(localStorage.getItem("orb:browsing_history") || "[]");
import {utils, customLinks, tabs} from "./linkman.js";
const log = utils.createLogger("net.solarcosmic.orbbrowser.misc");

export function createHostname(url) {
    if (url.startsWith("chrome-extension://")) return url;
    return new URL(url);
}

export function ipcLinkOpen(url) {
    log("link open: " + url);
    for (const [protocol, protoItems] of Object.entries(customLinks.list)) {
        for (const [linkName, linkItem] of Object.entries(protoItems)) {
            if (url.replace(/^.*[\\/]/, '') == linkItem.file) {
                log(url);
                goToLink(url);
                return;
            }
        }
    }
    return tabs.activateTab(tabs.createTabInstance(url));
}