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

var customLinks = {
    "orb": {
        "history": {
            file: "history.html"
        },
        "settings": {
            file: "settings.html"
        }
    }
}







/*
 * Changes the title of the window.
 * [title]: string
*/
function changeWindowTitle(title) {
    const tr = Utils.truncateString(title, truncateAmount + 10);
    document.title = (tr + " ⎯ Orb Browser") || "Orb Browser";
}



/*
 * The main function for creating tab instances.
 * Sets up the tab, button, and other event listeners.
*/
function createTabInstance(url = "https://google.com") {
    var preloadPath = null;
    var resolvedUrl = url;

    for (const [protocol, protoItems] of Object.entries(customLinks)) {
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
    for (const [protocol, protoItems] of Object.entries(customLinks)) {
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
        urlObj = new URL(url);
    } catch (e) {
        log(e);
        urlObj = null;
    }
    var lastFavicon = null;
    // probably inefficient implementation with 2 for loops, but it works for now (i think)
    for (const [protocol, protoItems] of Object.entries(customLinks)) {
        for (const [linkName, linkItem] of Object.entries(protoItems)) {
            if (resolvedUrl == linkItem.file) {
                tab.displayURL = `${protocol.toLowerCase()}://${linkName.toLowerCase()}`;
                btn.text.textContent = tab.displayURL;
                btn.icon.src = "../assets/star-solid-full.svg";
            }
        }
    }

    btn.text.textContent = Utils.truncateString(url, truncateAmount);
    btn.icon.src = "../assets/loading.gif";
    tab.view.addEventListener("page-title-updated", (event) => {
        console.log(url);
        document.getElementById("url-box").setAttribute("value", tab.view.getURL());
        document.getElementById("url-box").value = tab.view.getURL();
        if (event.title?.trim()) {
            btn.text.textContent = Utils.truncateString(event.title, 25);
            if (getActiveTab()?.id == tab.id) {
                changeWindowTitle(event.title);
            }
        }
    });
    tab.view.addEventListener("did-navigate", (event) => {
        checkNavigation(tab);
        console.log(tab.displayURL);
        updateOmniboxHostname(tab.displayURL || new URL(tab.view.getURL()).hostname, tab.displayURL || tab.view.getURL());
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
        const favicon = event.favicons[0];
        if (favicon) {
            lastFavicon = favicon;
            btn.icon.src = lastFavicon;
            localStorage.setItem(`favicon:${urlObj?.hostname}`, lastFavicon);
        }
    });
    tab.view.addEventListener("did-start-loading", () => {
        btn.icon.src = "../assets/loading.gif";
    });
    tab.view.addEventListener("did-stop-loading", () => {
        if (lastFavicon) {
            btn.icon.src = lastFavicon;
        } else {
            const cached = localStorage.getItem(`favicon:${urlObj?.hostname}`);
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
    Tabs.activateTab(tab);
});

window.addEventListener("keyup", (event) => {
    if (event.ctrlKey && event.key.toLowerCase() == "t") return Tabs.activateTab(createTabInstance());
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
    log("link open: " + url);
    for (const [protocol, protoItems] of Object.entries(customLinks)) {
        for (const [linkName, linkItem] of Object.entries(protoItems)) {
            if (url.replace(/^.*[\\/]/, '') == linkItem.file) {
                log(url);
                goToLink(url);
                return;
            }
        }
    }
    return Tabs.activateTab(createTabInstance(url));
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





var lists = [
    /*{
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
            Tabs.activateTab(createTabInstance("https://chatgpt.com"));
        }
    },*/
    {
        name: "Browsing History",
        icon: "../assets/gear-solid-full.svg",
        action: (table) => {
            log(table);
            goToLink("orb://history");
        }
    }
];

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

function updateHyperlink() {
    
}
window.electronAPI.onAppBlur(() => {
    console.log("app blur");
    document.body.style.backgroundColor = "#191919";
    document.getElementById("sidebar").style.backgroundColor = "#161616";
})
window.electronAPI.onAppFocus(() => {
    console.log("app focus");
    document.body.style.backgroundColor = "#0f0f0f";
    document.getElementById("sidebar").style.backgroundColor = "#0c0c0c";
})

window.addEventListener("beforeunload", () => {
    const collected = [];
    for (const tab of tabs) {
        collected.push(tab.view?.src);
    };
    localStorage.setItem("orb:tabs_list", JSON.stringify(collected));
})
document.addEventListener("DOMContentLoaded", async () => {
    let restored = false;
    const savedTabs = localStorage.getItem("orb:tabs_list");
    if (!savedTabs) return;
    try {
        const urls = JSON.parse(savedTabs);
        if (Array.isArray(urls) && urls.length > 0) {
            urls.forEach((url) => {
                const tab = createTabInstance(url);
                console.log("URL: " + url);
                for (const [protocol, protoItems] of Object.entries(customLinks)) {
                    for (const [linkName, linkItem] of Object.entries(protoItems)) {
                        if (url.replace(/^.*[\\/]/, '') == linkItem.file) {
                            tab.displayURL = `${protocol.toLowerCase()}://${linkName.toLowerCase()}`;
                        }
                    }
                }
            })
            restored = true;
        }
    } catch (e) {}
    if (!restored) {
        var newTab = createTabInstance();
        Tabs.activateTab(newTab);
    }
})
window.electronAPI.sendToRenderer((data) => {
    const json = JSON.parse(data);
    if (json.action == "clear-browsing-data") {
        browseHistory = [];
        localStorage.setItem("orb:browsing_history", JSON.stringify(browseHistory));
    } else if (json.action == "pin-tab") {
        if (!json.tabId) return log("Missing tab ID on pin tab!");
        pinTab(json.tabId);
    } else if (json.action == "unpin-tab") {
        if (!json.tabId) return log("Missing tab ID on pin tab!");
        unpinTab(json.tabId);
    }
});