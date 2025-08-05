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
        log("Failed to change window title: " + e);
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
        document.getElementById("url-box").setAttribute("value", tab.view.getURL());
        document.getElementById("url-box").value = tab.view.getURL();
        if (event.title?.trim()) {
            btn.text.textContent = truncateString(event.title, 25);
            if (getActiveTab()?.id == tab.id) {
                changeWindowTitle(event.title);
            }
        }
    });
    tab.view.addEventListener("did-navigate", (event) => {
        checkNavigation(tab);
        updateOmniboxHostname(new URL(tab.view.getURL()).hostname, tab.view.getURL());
    })
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

function checkNavigation(tab) {
    if (!tab.view) return log("Error: No valid tab provided for checkNavigation!");
    var currentTab = getActiveTab();
    if (!currentTab.id == tab.id) return;
    if (tab.view.canGoBack()) {
        document.getElementById("left-nav").classList.remove("greyed-out");
    } else {
        document.getElementById("left-nav").classList.add("greyed-out");
    }
    if (tab.view.canGoForward()) {
        document.getElementById("right-nav").classList.remove("greyed-out");
    } else {
        document.getElementById("right-nav").classList.add("greyed-out");
    }
}

/*
 * Navigates to a specific tab.
 * Defaults to the currently active tab if no tab is provided.
*/
function navigate(tab = getActiveTab(), direction) {
    if (!tab.view) return;
    if (direction == "back") tab.view.goBack();
    if (direction == "forward") tab.view.goForward();
    if (direction == "refresh") tab.view.reload();
    if (direction == "refreshNoCache") tab.view.reloadIgnoringCache();
}

const left_nav = document.getElementById("left-nav");
const right_nav = document.getElementById("right-nav");
const refresh_nav = document.getElementById("refresh-nav");
left_nav.addEventListener("click", () => {
    if (!left_nav.classList.contains("greyed-out")) navigate(getActiveTab(), "back");
});
right_nav.addEventListener("click", () => {
    if (!right_nav.classList.contains("greyed-out")) navigate(getActiveTab(), "forward");
});
refresh_nav.addEventListener("click", () => {
    if (!refresh_nav.classList.contains("greyed-out")) navigate(getActiveTab(), "refresh");
});

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
        goToLink(document.getElementById("url-box").value);
    }
})
document.getElementById("omnibox-entry").addEventListener("click", () => {
    if (document.getElementById("omnibox").style.display == "block") return;
    document.getElementById("omnibox").style.display = "block";
    document.getElementById("url-box").select();
});
window.electronAPI.onMouseClick((x, y) => {
    const omnibox = document.getElementById("omnibox");
    const element = document.elementFromPoint(x, y);
    if (element.parentElement.id == "omnibox-entry") return;
    if (element.id == "omnibox-entry") return;
    if (element?.id != "omnibox") {
        if (element.closest("#omnibox")) return;
        if (omnibox.style.display == "block") omnibox.style.display = "none";
    }
})
window.electronAPI.onLinkOpen((url) => {
    activateTab(createTabInstance(url));
})

/*
KNOWN BUGS:
- Clicking to the right of the box doesn't close it
- Sometimes setting the search box to "" leaves the last suggestion up
*/
var typeTimer;
var typeInterval = 150;
var urlBox = document.getElementById("url-box");

urlBox.addEventListener("keyup", () => {
    clearTimeout(typeTimer);
    if (urlBox.value) typeTimer = setTimeout(searchSuggestions, typeInterval);
})

function goToLink(txt) {
    var pattern = /^((http|https|chrome):\/\/)/; /* https://stackoverflow.com/a/11300963 */
    if (pattern.test(txt)) {
        getActiveTab().view.loadURL(txt);
    } else {
        getActiveTab().view.loadURL("https://google.com/search?client=orb&q=" + txt);
    }
    document.getElementById("omnibox").style.display = "none";
}

async function searchSuggestions() {
    try {
        clearSearchSuggestionButtons();
        if (urlBox.value.trim() == "") {
            clearSearchSuggestionButtons();
            return;
        }
        if (urlBox.value.toLowerCase().startsWith("fav")) {
            addSearchSuggestionButton("Favorite Tab", "../assets/star-solid-full.svg", "Quick Action");
        }
        if (urlBox.value.toLowerCase().startsWith("chat")) {
            addSearchSuggestionButton("Ask ChatGPT", "../assets/star-solid-full.svg", "Quick Action");
        }
        await fetch("https://google.com/complete/search?output=toolbar&q=" + urlBox.value)
            .then(res => {
                if (!res.ok) throw new Error("Fetching suggestion error: " + res.status);
                return res.text();
            })
            .then(data => {
                const res = xmlToJSON.parseString(data);
                if (!res) throw new Error("Did not return JSON response!");
                for (var step = 0; step < 5; step++) {
                    try {
                        addSearchSuggestionButton(res["toplevel"][0]["CompleteSuggestion"][step]["suggestion"][0]["_attr"]["data"]["_value"]);
                    } catch (e) {
                        log("Couldn't find search suggestion #" + step + ". Possible it doesn't exist? Error: " + e);
                    }
                }
            })
    } catch (err) {
        console.error(err.message);
    }
}
function clearSearchSuggestionButtons() {
    document.getElementById("omnibox-search-list").innerHTML = "";
}
var lists = [
    {
        name: "Favorite Tab",
        icon: "../assets/star-solid-full.svg",
        action: (table) => {
            log("Favouriting tab!");
        }
    },
    {
        name: "Ask ChatGPT",
        icon: "../assets/star-solid-full.svg",
        action: (table) => {
            // TODO: maybe add ask prompt within the omnibox itself?
            activateTab(createTabInstance("https://chatgpt.com"));
        }
    },
];
function addSearchSuggestionButton(txt, icon = "../assets/magnifying-glass-solid-full.svg") {
    const btn = document.createElement("button");
    btn.classList.add("suggestion-button");
    const text = document.createElement("p");
    text.classList.add("suggestion-text");
    text.textContent = txt;
    const srcimg = document.createElement("img");
    srcimg.classList.add("svg-grey");
    srcimg.style = "margin-bottom: -3px; width: 16px; height: 16px;";
    srcimg.src = icon;
    /*if (hint_txt) {
        const hint_text = document.createElement("p");
        hint_text.classList.add("suggestion-text-right");
        hint_text.textContent = hint_txt;
        btn.appendChild(hint_text)
    }*/
    
    btn.addEventListener("click", () => {
        var hasItem = false;
        lists.forEach(item => {
            if (item.name == txt) {
                hasItem = true;
                log(`Called quick action \"${item.name}\" at ${new Date().toLocaleString()}.`)
                item.action();
            }
        })
        if (!hasItem) goToLink(txt);
        document.getElementById("omnibox").style.display = "none";
    })
    btn.appendChild(srcimg);
    btn.appendChild(text);
    document.getElementById("omnibox-search-list").appendChild(btn);
    return btn;
}
document.getElementById("url-box").spellcheck = false;
/* https://stackoverflow.com/a/56159793 */
const observer = new MutationObserver(list => {
    document.getElementById("omnibox-search-list").innerHTML = "";
});
observer.observe(document.getElementById("url-box"), {
    attributes: true,
    childList: false,
    subtree: false
});
function log(...args) {
    console.log(...args);
    const format = args.map(arg => typeof arg == "object" ? JSON.stringify(arg) : String(arg)).join(" "); // idk what this is lol
    window.electronAPI.sendConsoleLog(format);
}