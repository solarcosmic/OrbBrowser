import * as utils from "./utils.js";
import * as customLinks from "./customLinks.js";
import * as omnibox from "./omnibox.js";
const views = document.getElementById("webviews");
export var tabs = [];

/*
 * Creates a tab and loads a URL.
*/
export function createTab(url = "https://www.google.com", preloadPath = null) {
    const tab = {
        id: crypto.randomUUID(),
        view: document.createElement("webview"),
        pinned: false
    }
    tab.view.classList.add("tab-view");
    //tab.view.setAttribute("partition", "persist:default");
    tab.view.style.display = "none";
    tab.view.src = url;
    if (preloadPath) {
        console.log("preload path!");
        tab.view.setAttribute("preload", preloadPath);
    }
    views.appendChild(tab.view);
    tabs.push(tab);
    console.log("tab created!!");
    window.electronAPI.sendConsoleLog("tab created");
    return tab;
}

/*
 * Creates a tab button.
 * [tab]: A tab object (one that consists of id and view).
*/
export function createTabButton(tab) {
    if (!tab.view || !tab.id) console.error("Missing tab view and/or ID! Cannot create a tab button.");
    const btn = document.createElement("button");
    btn.classList.add("fade-in-element");
    btn.setAttribute("id", "tab-button-" + tab.id);
    btn.addEventListener("click", () => {
        activateTab(tab);
    });
    btn.setAttribute("draggable", true);
    const favicon = document.createElement("img");
    favicon.setAttribute("id", "tab-icon-" + tab.id);
    favicon.src = "../assets/loading.gif";
    btn.appendChild(favicon);
    const txt = document.createElement("span");
    txt.classList.add("page-title");
    txt.textContent = tab.view.src || "Loading...";
    btn.appendChild(txt);
    const closeBtn = document.createElement("img");
    closeBtn.src = "../assets/xmark-solid-full.svg";
    closeBtn.classList.add("tab-close");
    closeBtn.classList.add("svg-white");
    closeBtn.addEventListener("click", () => {
        closeTab(tab);
    });
    btn.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("tabId", tab.id);
        btn.classList.add("dragging");
    });
    btn.addEventListener("dragend", () => {
        btn.classList.remove("dragging");
    });
    btn.addEventListener("dragover", (e) => {
        e.preventDefault();
        btn.classList.add("drag-over");
    })
    btn.addEventListener("dragleave", () => {
        btn.classList.remove("drag-over");
    });
    btn.addEventListener("drop", (e) => {
        e.preventDefault();
        btn.classList.remove("drag-over");
        const dragIdThing = e.dataTransfer.getData("tabId");
        if (dragIdThing && dragIdThing != tab.id) {
            reorderTabs(dragIdThing, tab.id);
        }
    });
    btn.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        window.electronAPI.contextMenuShow("right-click-button", {tabId: tab.id, isPinned: tab.pinned});
    })
    btn.appendChild(closeBtn);
    const containerId = tab.pinned ? "pinned-tab-buttons" : "tab-buttons";
    document.getElementById(containerId).appendChild(btn);
    tab.button = btn;
    return {
        button: btn,
        icon: favicon,
        text: txt
    };
};

/*
 * A function to rewrite tabs.
 * I'll admit I don't know what I'm looking at, thanks AI
*/
export function reorderTabs(dragId, targetId) {
    const tabButtons = document.getElementById("tab-buttons");
    const dragIdx = tabs.findIndex(t => t.id == dragId);
    const targetIdx = tabs.findIndex(t => t.id == targetId);
    if (dragIdx == -1 || targetIdx == -1) return;
    const [dragTab] = tabs.splice(dragIdx, 1);
    tabs.splice(targetIdx, 0, dragTab);
    const dragBtn = document.getElementById("tab-button-" + dragId);
    const targetBtn = document.getElementById("tab-button-" + targetId);
    tabButtons.insertBefore(dragBtn, targetIdx > dragIdx ? targetBtn.nextSibling : targetBtn);
}

//* tab helpers *//

export function getTabButtonByTabId(tabId) {
    return document.getElementById("tab-button-" + tabId);
}

export function pinTab(tabId) {
    const button = getTabButtonByTabId(tabId);
    if (!button) return utils.log("No button!");
    const tabObject = getTabObjectFromId(tabId);
    if (!tabObject) return utils.log("No tab!");
    tabObject["pinned"] = true;
    document.getElementById("pinned-tab-buttons").appendChild(button);
}

export function unpinTab(tabId) {
    const button = getTabButtonByTabId(tabId);
    if (!button) return utils.log("No button!");
    const tabObject = getTabObjectFromId(tabId);
    if (!tabObject) return utils.log("No tab!");
    tabObject["pinned"] = false;
    document.getElementById("tab-buttons").prepend(button);
}

export function getTabObjectFromId(tabId) {
    for (const item of tabs) {
        if (item.id == tabId) return item;
    }
    return null;
}

/*
 * Hides all of the tabs from view.
*/
function hideAllTabs() {
    Array.from(document.getElementById("webviews").childNodes).forEach((item) => {
        item.style.display = "none";
    });
}

/*
 * Removes all of the tabs from being active.
*/
function removeAllActiveTabs() {
    Array.from(document.querySelectorAll("[id^=tab-button-]")).forEach((item) => {
        item.classList.remove("active-tab");
    });
}

/*
 * Activates a tab and sets its tab button to be active.
 * [tab]: A tab object (one that consists of id and view).
*/
export function activateTab(tab) {
    if (!(tab.view || tab.id || tab.button)) return console.error("Missing tab view and/or ID, button! Cannot activate tab.");
    removeAllActiveTabs();
    hideAllTabs();
    requestAnimationFrame(() => { // for some reason THIS WORKS. requestAnimationFrame is needed for it to function correctly
        tab.button.classList.add("active-tab");
        tab.view.style.display = "flex";
        var hostname;
        var url;
        if (tab.displayURL) {
            hostname = tab.displayURL;
            url = tab.displayURL;
        } else {
            try {
                hostname = createHostname(tab.view.getURL()).hostname;
                url = tab.view.getURL();
            } catch (e) {
                hostname = tab.view.getURL();
                url = tab.view.getURL();
            }
        }
        omnibox.updateOmniboxHostname(hostname, url);
        document.getElementById("url-box").value = url;
        const webContentsId = tab.view.getWebContentsId ? tab.view.getWebContentsId() : tab.view.getAttribute("data-webcontents-id");
        if (tab.view && webContentsId) {
            window.electronAPI.sendTabActivated(webContentsId);
        }
    });
    try {
        changeWindowTitle(tab.view.getTitle());
    } catch (e) {
        //log("Failed to change window title: " + e);
    }
}

/*
 * Closes a tab and removes it from the tabs array.
 * [tab]: A tab object (one that consists of id and view).
*/
export function closeTab(tab) {
    const idx = tabs.indexOf(tab);
    console.log(`idx: ${idx}, tab url: ${tabs[idx].url}, tab displayURL: ${tabs[idx].displayURL}, current tab: ${tabs[idx]}, tab advance: ${tabs[idx + 1]}, tab before: ${tabs[idx - 1]}, tab as string: ${tabs[idx].toString()}`)
    for (const item in tab) {
        console.log(item);
    }
    if (tabs[idx - 1] != null) {
        const hostTab = tabs[idx - 1];
        omnibox.updateOmniboxHostname(hostTab.displayURL || createHostname(hostTab.view.getURL()).hostname, hostTab.displayURL || hostTab.view.getURL());
    }
    if (idx !== -1) {
        tabs.splice(idx, 1);
    }
    tab.view.remove();
    tab.button.remove();
    switchToNextTab(idx);
}

/*
 * Returns the currently active tab, dependent on the active button.
*/
export function getActiveTab() {
    const active = document.querySelector(".active-tab");
    if (!active) return;
    const sliced = active.id.slice(11);
    for (const tab of tabs) {
        if (tab.id == sliced) return tab;
    }
    return;
}

/*
 * Switches to the next tab according to the index you give it.
*/
export function switchToNextTab(idx) {
    if (tabs.length === 0) return;
    let nextTab = tabs[idx] || tabs[idx - 1] || tabs[0];
    if (nextTab) {
        activateTab(nextTab);
    }
}

/*
 * The main function for creating tab instances.
 * Sets up the tab, button, and other event listeners.
*/
export function createTabInstance(url = "https://google.com") {
    var preloadPath = null;
    var resolvedUrl = url;

    for (const [protocol, protoItems] of Object.entries(customLinks.list)) {
        for (const [linkName, linkItem] of Object.entries(protoItems)) {
            const exampleProtocol = `${protocol.toLowerCase()}://${linkName.toLowerCase()}`;
            if (url == exampleProtocol) {
                resolvedUrl = linkItem.file;
                break;
            }
            if (url.replace(/^.*[\\/]/, "") == linkItem.file) {
                resolvedUrl = linkItem.file;
                break;
            }
        }
    }
    for (const [protocol, protoItems] of Object.entries(customLinks.list)) {
        for (const [linkName, linkItem] of Object.entries(protoItems)) {
            if (resolvedUrl.replace(/^.*[\\/]/, '') == linkItem.file) {
                preloadPath = "../preload.js";
            }
        }
    }
    const tab = createTab(resolvedUrl, preloadPath);
    const btn = createTabButton(tab);
    var urlObj;
    try {
        urlObj = createHostname(url);
    } catch (e) {
        utils.log(e);
        urlObj = null;
    }
    var lastFavicon = null;
    // probably inefficient implementation with 2 for loops, but it works for now (i think)
    for (const [protocol, protoItems] of Object.entries(customLinks.list)) {
        for (const [linkName, linkItem] of Object.entries(protoItems)) {
            if (resolvedUrl == linkItem.file) {
                tab.displayURL = `${protocol.toLowerCase()}://${linkName.toLowerCase()}`;
                btn.text.textContent = tab.displayURL;
                btn.icon.src = "../assets/star-solid-full.svg";
            }
        }
    }

    btn.text.textContent = utils.truncateString(url, utils.truncateAmount); //url; 
    btn.icon.src = "../assets/loading.gif";
    tab.view.addEventListener("page-title-updated", (event) => {
        console.log(url);
        document.getElementById("url-box").setAttribute("value", tab.view.getURL());
        document.getElementById("url-box").value = tab.view.getURL();
        if (event.title?.trim()) {
            btn.text.textContent = utils.truncateString(event.title, 25); //event.title;
            if (getActiveTab()?.id == tab.id) {
                changeWindowTitle(event.title);
            }
        }
    });
    tab.view.addEventListener("did-navigate", (event) => {
        checkNavigation(tab);
        console.log(tab.displayURL);
        omnibox.updateOmniboxHostname(tab.displayURL || createHostname(tab.view.getURL()).hostname, tab.displayURL || tab.view.getURL());
        document.getElementById("url-box").value = tab.displayURL || tab.view.getURL();
        browseHistory.push({
            url: tab.displayURL || tab.view?.getURL() || "about:blank",
            title: tab.view?.getTitle() || "Webpage",
            timestamp: Date.now(),
        })
        localStorage.setItem("orb:browsing_history", JSON.stringify(browseHistory));
        console.log(browseHistory);
    })
    tab.view.addEventListener("page-favicon-updated", (event) => {
        if (tab.view.getURL().startsWith("chrome-extension://")) {
            btn.icon.src = "../assets/chrome-brands-solid-full.svg";
            lastFavicon = btn.icon.src;
        } else {
            const favicon = event.favicons[0];
            if (favicon) {
                lastFavicon = favicon;
                btn.icon.src = lastFavicon;
                localStorage.setItem(`favicon:${urlObj?.hostname}`, lastFavicon);
            }
        }
    });
    tab.view.addEventListener("did-start-loading", () => {
        btn.icon.src = "../assets/loading.gif";
    });
    tab.view.addEventListener("did-stop-loading", () => {
        if (tab.view.getURL().startsWith("chrome-extension://")) {
            btn.icon.src = "../assets/chrome-brands-solid-full.svg";
        } else if (lastFavicon) {
            btn.icon.src = lastFavicon;
        } else {
            const cached = localStorage.getItem(`favicon:${urlObj?.hostname}`);
            btn.icon.src = cached || "";
        }
        
    });
    tab.view.addEventListener("did-fail-load", (evt) => {
        goToLink("orb://404", tab);
    })
    /*tab.view.addEventListener("dom-ready", () => {
        tab.view.insertCSS(`        html {
            scroll-behavior: smooth;
        }  
        `);
    }) */
    utils.checkTabTitleFlow();
    return tab;
}