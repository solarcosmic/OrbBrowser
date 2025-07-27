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

const views = document.getElementById("webviews");

function createTab(url = "https://www.google.com") {
    const tab = {
        id: crypto.randomUUID(),
        view: document.createElement("webview"),
    }
    tab.view.classList.add("tab-view");
    tab.view.style.display = "none";
    views.appendChild(tab.view);
    tab.view.src = url;
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

function hideAllTabs() {
    Array.from(document.getElementById("webviews").childNodes).forEach((item) => {
        item.style.display = "none";
    });
}

function removeAllActiveTabs() {
    Array.from(document.getElementById("tab-buttons").childNodes).forEach((item) => {
        item.classList.remove("active-tab");
    });
}

function activateTab(tab) {
    if (!(tab.view || tab.id || tab.button)) return console.error("Missing tab view and/or ID, button! Cannot activate tab.");
    removeAllActiveTabs();
    hideAllTabs();
    requestAnimationFrame(() => { // for some reason THIS WORKS. requestAnimationFrame is needed for it to function correctly
        tab.button.classList.add("active-tab");
        tab.view.style.display = "flex";
    });
}

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

function getActiveTab() {
    const active = document.querySelector(".active-tab");
    if (!active) return;
    const sliced = active.id.slice(11);
    for (const tab of tabs) {
        if (tab.id == sliced) return tab;
    }
    return;
}

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

function createTabInstance(url = "https://google.com") {
    const tab = createTab(url);
    const btn = createTabButton(tab);
    const urlObj = new URL(url);
    var lastFavicon = null;

    btn.text.textContent = truncateString(url, 25);
    btn.icon.src = "../assets/loading.gif";
    tab.view.addEventListener("page-title-updated", (event) => {
        if (event.title?.trim()) {
            btn.text.textContent = truncateString(event.title, 25);
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