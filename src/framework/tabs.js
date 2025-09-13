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

import * as Globals from "./globals.js";
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
    tab.view.style.display = "none";
    tab.view.src = url;
    if (preloadPath) {
        console.log("preload path!");
        tab.view.setAttribute("preload", preloadPath);
    }
    Globals.views.appendChild(tab.view);
    tabs.push(tab);
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
        Tabs.activateTab(tab);
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

export function getTabButtonByTabId(tabId) {
    return document.getElementById("tab-button-" + tabId);
}

export function pinTab(tabId) {
    const button = getTabButtonByTabId(tabId);
    if (!button) return log("No button!");
    const tabObject = getTabObjectFromId(tabId);
    if (!tabObject) return log("No tab!");
    tabObject["pinned"] = true;
    document.getElementById("pinned-tab-buttons").appendChild(button);
}

export function unpinTab(tabId) {
    const button = getTabButtonByTabId(tabId);
    if (!button) return log("No button!");
    const tabObject = getTabObjectFromId(tabId);
    if (!tabObject) return log("No tab!");
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
export function hideAllTabs() {
    Array.from(document.getElementById("webviews").childNodes).forEach((item) => {
        item.style.display = "none";
    });
}

/*
 * Removes all of the tabs from being active.
*/
export function removeAllActiveTabs() {
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
                hostname = new URL(tab.view.getURL()).hostname;
                url = tab.view.getURL();
            } catch (e) {
                hostname = tab.view.getURL();
                url = tab.view.getURL();
            }
        }
        updateOmniboxHostname(hostname, url);
        document.getElementById("url-box").value = url;
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
        updateOmniboxHostname(hostTab.displayURL || new URL(hostTab.view.getURL()).hostname, hostTab.displayURL || hostTab.view.getURL());
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
        Tabs.activateTab(nextTab);
    }
}