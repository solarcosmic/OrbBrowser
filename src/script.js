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
var tabs = [];
const truncateAmount = 25;

const views = document.getElementById("webviews");

/*
 * Creates a tab and loads a URL.
*/
function createTab(url = "https://www.google.com") {
    const tab = {
        id: crypto.randomUUID(),
        view: document.createElement("webview"),
    }
    tab.view.classList.add("tab-view");
    tab.view.style.display = "none";
    tab.view.src = url;
    views.appendChild(tab.view);
    tabs.push(tab);
    return tab;
}

/*
 * Creates a tab button.
 * [tab]: A tab object (one that consists of id and view).
*/
function createTabButton(tab) {
    if (!tab.view || !tab.id) console.error("Missing tab view and/or ID! Cannot create a tab button.");
    const btn = document.createElement("button");
    btn.setAttribute("id", "tab-button-" + tab.id);
    btn.addEventListener("click", () => {
        activateTab(tab);
    });
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
    })
    btn.appendChild(closeBtn);
    document.getElementById("tab-buttons").appendChild(btn);
    tab.button = btn;
    return {
        button: btn,
        icon: favicon,
        text: txt
    };
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
    Array.from(document.getElementById("tab-buttons").childNodes).forEach((item) => {
        item.classList.remove("active-tab");
    });
}

/*
 * Activates a tab and sets its tab button to be active.
 * [tab]: A tab object (one that consists of id and view).
*/
function activateTab(tab) {
    if (!(tab.view || tab.id || tab.button)) return console.error("Missing tab view and/or ID, button! Cannot activate tab.");
    removeAllActiveTabs();
    hideAllTabs();
    requestAnimationFrame(() => { // for some reason THIS WORKS. requestAnimationFrame is needed for it to function correctly
        tab.button.classList.add("active-tab");
        tab.view.style.display = "flex";
    });
    try {
        changeWindowTitle(tab.view.getTitle());
    } catch (e) {
        console.log("Failed to change window title: " + e);
    }
}

/*
 * Changes the title of the window.
 * [title]: string
*/
function changeWindowTitle(title) {
    const tr = truncateString(title, truncateAmount + 10);
    document.title = (tr + " ⎯ Orb Browser") || "Orb Browser";
}

/*
 * Closes a tab and removes it from the tabs array.
 * [tab]: A tab object (one that consists of id and view).
*/
function closeTab(tab) {
    const idx = tabs.indexOf(tab);
    if (idx !== -1) {
        tabs.splice(idx, 1);
    }
    tab.view.remove();
    tab.button.remove();
    console.log(idx);
    switchToNextTab(idx);
}

/*
 * Returns the currently active tab, dependent on the active button.
*/
function getActiveTab() {
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
function switchToNextTab(idx) {
    if (tabs.length === 0) return;
    let nextTab = tabs[idx] || tabs[idx - 1] || tabs[0];
    console.log(nextTab);
    if (nextTab) {
        activateTab(nextTab);
    }
}

/* https://stackoverflow.com/a/53637828 */
function truncateString(str, num) {
    if (str.length > num) {
        return str.slice(0, num) + "...";
    } else {
        return str;
    }
}

function updateOmniboxHostname(hostname, url) {
    const omniboxtxt = document.getElementById("url-txt");
    omniboxtxt.textContent = hostname;
    const omniSecure = document.getElementById("omniSecure") || document.createElement("img");
    omniSecure.style.width = "16px";
    omniSecure.style.height = "16px";
    omniSecure.classList.add("svg-white");
    omniSecure.setAttribute("id", "omniSecure");
    if (url.startsWith("https:")) {
        omniSecure.src = "../assets/lock-solid-full.svg";
        omniSecure.classList.remove("svg-grey");
    } else if (url.startsWith("http:")) {
        omniSecure.src = "../assets/unlock-solid-full.svg";
        omniSecure.classList.add("svg-grey");
    }
    document.getElementById("omnibox-entry").prepend(omniSecure);
}

/*
 * The main function for creating tab instances.
 * Sets up the tab, button, and other event listeners.
*/
function createTabInstance(url = "https://google.com") {
    const tab = createTab(url);
    const btn = createTabButton(tab);
    const urlObj = new URL(url);
    var lastFavicon = null;

    btn.text.textContent = truncateString(url, truncateAmount);
    btn.icon.src = "../assets/loading.gif";
    tab.view.addEventListener("page-title-updated", (event) => {
        document.getElementById("url-box").value = tab.view.getURL();
        if (event.title?.trim()) {
            btn.text.textContent = truncateString(event.title, 25);
            if (getActiveTab()?.id == tab.id) {
                changeWindowTitle(event.title);
                updateOmniboxHostname(new URL(tab.view.getURL()).hostname, tab.view.getURL());
            }
        }
    });
    tab.view.addEventListener("page-favicon-updated", (event) => {
        const favicon = event.favicons[0];
        if (favicon) {
            lastFavicon = favicon;
            btn.icon.src = lastFavicon;
            localStorage.setItem(`favicon:${urlObj.hostname}`, lastFavicon);
        }
    });
    tab.view.addEventListener("did-start-loading", () => {
        btn.icon.src = "../assets/loading.gif";
    });
    tab.view.addEventListener("did-stop-loading", () => {
        if (lastFavicon) {
            btn.icon.src = lastFavicon;
        } else {
            const cached = localStorage.getItem(`favicon:${urlObj.hostname}`);
            btn.icon.src = cached || "";
        }
    });
    /*tab.view.addEventListener("dom-ready", () => {
        tab.view.insertCSS(`        html {
            scroll-behavior: smooth;
        }  
        `);
    }) */
    return tab;
}
document.getElementById("create-tab").addEventListener("click", () => {
    const tab = createTabInstance();
    activateTab(tab);
});
activateTab(createTabInstance());

window.addEventListener("keyup", (event) => {
    if (event.ctrlKey && event.key.toLowerCase() == "t") return activateTab(createTabInstance());
    if (event.ctrlKey && event.key.toLowerCase() == "w") return closeTab(getActiveTab());
})
document.getElementById("url-box").addEventListener("keyup", (event) => {
    if (event.key == "Enter") {
        var pattern = /^((http|https|chrome):\/\/)/; /* https://stackoverflow.com/a/11300963 */
        if (pattern.test(document.getElementById("url-box").value)) {
            getActiveTab().view.loadURL(document.getElementById("url-box").value);
        } else {
            getActiveTab().view.loadURL("https://google.com/search?client=orb&q=" + document.getElementById("url-box").value);
        }
        document.getElementById("omnibox").style.display = "none";
    }
})
document.getElementById("omnibox-entry").addEventListener("click", () => {
    document.getElementById("omnibox").style.display = "block";
});
window.electronAPI.onMouseClick((x, y) => {
    const omnibox = document.getElementById("omnibox");
    const element = document.elementFromPoint(x, y);
    console.log(element?.parentElement.id)
    console.log(element);
    if (element?.id != "omnibox") {
        if (element?.parentElement.id == "omnibox") return;
        if (omnibox.style.display == "block") omnibox.style.display = "none";
    }
})