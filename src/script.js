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
import * as utils from "./framework/utils.js";
import * as customLinks from "./framework/customLinks.js";
import * as tabs from "./framework/tabs.js";
import * as navigation from "./framework/navigation.js";
import * as misc from "./framework/misc.js";
import * as omnibox from "./framework/omnibox.js";

const truncateAmount = 25;
const log = utils.createLogger("net.solarcosmic.orbbrowser.renderer");

const views = document.getElementById("webviews");

const left_nav = document.getElementById("left-nav");
const right_nav = document.getElementById("right-nav");
const refresh_nav = document.getElementById("refresh-nav");
const main_dropdown = document.getElementById("main-dropdown");
left_nav.addEventListener("click", () => {
    if (!left_nav.classList.contains("greyed-out")) navigation.navigate(tabs.getActiveTab(), "back");
});
right_nav.addEventListener("click", () => {
    if (!right_nav.classList.contains("greyed-out")) navigation.navigate(tabs.getActiveTab(), "forward");
});
refresh_nav.addEventListener("click", () => {
    if (!refresh_nav.classList.contains("greyed-out")) navigation.navigate(tabs.getActiveTab(), "refresh");
});
main_dropdown.addEventListener("click", () => {
    if (!main_dropdown.classList.contains("greyed-out")) window.electronAPI.showMainDropdown();
});

document.getElementById("create-tab").addEventListener("click", () => {
    const tab = tabs.createTabInstance();
    tabs.activateTab(tab);
});

window.addEventListener("keyup", (event) => {
    if (event.ctrlKey && event.key.toLowerCase() == "t") return tabs.activateTab(tabs.createTabInstance());
    if (event.ctrlKey && event.key.toLowerCase() == "w") return closeTab(tabs.getActiveTab());
    if (event.ctrlKey && event.key.toLowerCase() == "f") return findInPage("Charlie");
})
document.getElementById("url-box").addEventListener("keyup", (event) => {
    if (event.key == "Enter") {
        goToLink(document.getElementById("url-box").value);
    }
})
document.getElementById("omnibox-entry").addEventListener("click", () => {
    if (document.getElementById("omnibox").style.display == "block") return;
    document.getElementById("omnibox").style.display = "block";
    searchSuggestions();
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
    misc.ipcLinkOpen(url);
});

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

function goToLink(txt, activeTab = tabs.getActiveTab()) {
    var pattern = /^((http|https|chrome|chrome-extension):\/\/)/; /* https://stackoverflow.com/a/11300963 */
    var dm_regex = /^(?:(?:(?:[a-zA-z\-]+):\/{1,3})?(?:[a-zA-Z0-9])(?:[a-zA-Z0-9\-\.]){1,61}(?:\.[a-zA-Z]{2,})+|\[(?:(?:(?:[a-fA-F0-9]){1,4})(?::(?:[a-fA-F0-9]){1,4}){7}|::1|::)\]|(?:(?:[0-9]{1,3})(?:\.[0-9]{1,3}){3}))(?:\:[0-9]{1,5})?$/; /* https://stackoverflow.com/a/38578855 */

    var formedProtocol;
    var protocolItems;
    for (const [protocol, protoItems] of Object.entries(customLinks.list)) {
        for (const [linkName, linkItem] of Object.entries(protoItems)) {
            const exampleProtocol = `${protocol.toLowerCase()}://${linkName.toLowerCase()}`;
            if (txt == exampleProtocol) {
                formedProtocol = exampleProtocol;
                protocolItems = linkItem;
                break;
            }
        }
    }
    if (txt == formedProtocol && protocolItems?.file != null) {
        const tab = tabs.createTabInstance(protocolItems.file);
        tab.displayURL = formedProtocol;
        tabs.activateTab(tab);
        tab.button.querySelector(".page-title").textContent = formedProtocol;
        omnibox.updateOmniboxHostname(formedProtocol, formedProtocol);
        tab.button.querySelector("img").src = "../assets/star-solid-full.svg";
    } else if (pattern.test(txt)) {
        if (!activeTab) return tabs.activateTab(tabs.createTabInstance(txt));
        tabs.getActiveTab().view.loadURL(txt);
    } else if (dm_regex.test(txt)) {
        if (!activeTab) return tabs.activateTab(tabs.createTabInstance("http://" + txt));
        tabs.getActiveTab().view.loadURL("http://" + txt);
    } else {
        if (!activeTab) return tabs.activateTab(tabs.createTabInstance("https://google.com/search?client=orb&q=" + txt));
        tabs.getActiveTab().view.loadURL("https://google.com/search?client=orb&q=" + txt);
    }
    document.getElementById("omnibox").style.display = "none";
}

async function searchSuggestions() {
    console.log(urlBox.value);
    try {
        /*if ((urlBox.value == "" || document.getElementById("omnibox-search-list").childElementCount == 0) && trend_results) {
            clearSearchSuggestionButtons();
            for (const item of trend_results) {
                addSearchSuggestionButton(item);
            }
            return;
        }*/
        /*if (urlBox.value.toLowerCase().startsWith("fav")) {
            addSearchSuggestionButton("Favorite Tab", "../assets/star-solid-full.svg", "Quick Action");
        }
        if (urlBox.value.toLowerCase().startsWith("chat")) {
            addSearchSuggestionButton("Ask ChatGPT", "../assets/star-solid-full.svg", "Quick Action");
        }*/
        await fetch("https://google.com/complete/search?output=toolbar&q=" + urlBox.value)
            .then(res => {
                if (!res.ok) throw new Error("Fetching suggestion error: " + res.status);
                return res.text();
            })
            .then(data => {
                const res = xmlToJSON.parseString(data);
                if (!res) throw new Error("Did not return JSON response!");
                clearSearchSuggestionButtons();
                for (var step = 0; step < 5; step++) {
                    try {
                        addSearchSuggestionButton(res["toplevel"][0]["CompleteSuggestion"][step]["suggestion"][0]["_attr"]["data"]["_value"]);
                    } catch (e) {
                        log("Couldn't find search suggestion #" + step + ". Possible it doesn't exist? Error: " + e);
                    }
                }
            })
        if (urlBox.value.toLowerCase().startsWith("hist")) {
            addSearchSuggestionButton("Browsing History", "../assets/gear-solid-full.svg", "Quick Action", true);
        } // to move
    } catch (err) {
        console.error(err.message);
    }
}
function clearSearchSuggestionButtons() {
    document.getElementById("omnibox-search-list").innerHTML = "";
}
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
            activateTab(createTabInstance("https://chatgpt.com"));
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
function addSearchSuggestionButton(txt, icon = "../assets/magnifying-glass-solid-full.svg", action, prepend = false) {
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
    if (prepend) {
        document.getElementById("omnibox-search-list").prepend(btn);
        document.querySelector("#omnibox-search-list > button:last-of-type").remove();
    } else {
        document.getElementById("omnibox-search-list").appendChild(btn);
    }
    
    return btn;
}
document.getElementById("url-box").spellcheck = false;
/* https://stackoverflow.com/a/56159793 */
/*const observer = new MutationObserver(list => {
    document.getElementById("omnibox-search-list").innerHTML = "";
});
observer.observe(document.getElementById("url-box"), {
    attributes: true,
    childList: false,
    subtree: false
});*/
document.getElementById("url-box").addEventListener("input", () => {
    console.log("value: " + urlBox.value);
    if (urlBox.value == "") {
            clearSearchSuggestionButtons();
            for (const item of trend_results) {
                addSearchSuggestionButton(item);
            }
    }
})
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
    tabs.saveTabs();
})

document.addEventListener("DOMContentLoaded", async () => {
    let restored = false;
    const savedTabs = localStorage.getItem("orb:tabs_list");
    if (!savedTabs) return;
    try {
        const items = JSON.parse(savedTabs);
        if (Array.isArray(items) && items.length > 0) {
            items.forEach((item) => {
                console.log(item);
                const tab = tabs.createTabInstance(item.url);
                if (item.pinned) {
                    console.log("pinned: " + tab);
                    tabs.pinTab(tab.id);
                }
                console.log("URL: " + item.url);
                for (const [protocol, protoItems] of Object.entries(customLinks.list)) {
                    for (const [linkName, linkItem] of Object.entries(protoItems)) {
                        if (item.url.replace(/^.*[\\/]/, '') == linkItem.file) {
                            tab.displayURL = `${protocol.toLowerCase()}://${linkName.toLowerCase()}`;
                        }
                    }
                }
            });
            
            restored = true;
        }
    } catch (e) {}
    if (!restored) {
        var newTab = tabs.createTabInstance();
        tabs.activateTab(newTab);
    }
    utils.checkTabTitleFlow();
})
window.electronAPI.sendToRenderer((data) => {
    const json = JSON.parse(data);
    if (json.action == "clear-browsing-data") {
        browseHistory = [];
        localStorage.setItem("orb:browsing_history", JSON.stringify(browseHistory));
    } else if (json.action == "pin-tab") {
        if (!json.tabId) return log("Missing tab ID on pin tab!");
        tabs.pinTab(json.tabId);
    } else if (json.action == "unpin-tab") {
        if (!json.tabId) return log("Missing tab ID on pin tab!");
        tabs.unpinTab(json.tabId);
    } else if (json.action.startsWith("menu-")) {
        doMenuAction(json.action.slice(5));
    }
});

function findInPage(txt) {
    const tab = tabs.getActiveTab();
    const view = tab.view;
}

function doMenuAction(action) {
    if (action == "print") {
        const currentTab = tabs.getActiveTab();
        if (!currentTab) return;
        const wvId = currentTab.view.getWebContentsId();
        if (wvId) window.electronAPI.printTab(wvId);
    } else if (action == "quit") {
        window.electronAPI.quitOrb();
    } else if (action == "history") {
        misc.ipcLinkOpen("orb://history");
    } else if (action == "new-tab") {
        misc.ipcLinkOpen("https://google.com");
    } else if (action == "about") {
        misc.ipcLinkOpen("orb://about");
    } else if (action == "settings") {
        misc.ipcLinkOpen("orb://settings");
    }
}
window.addEventListener("resize", utils.checkOmniFlow);
window.addEventListener("resize", utils.checkTabTitleFlow);

var trend_results;
async function getSearchTrends(country) {
    try {
        const trends = await window.electronAPI.getTrendingSearches(country);
        const res = xmlToJSON.parseString(trends);
        if (!res) throw new Error("Did not return JSON response!");
        var items = [];
        for (var step = 0; step < 5; step++) {
            try {
                items.push(res["rss"][0]["channel"][0]["item"][step]["title"][0]["_text"]);
                //addSearchSuggestionButton(res["toplevel"][0]["CompleteSuggestion"][step]["suggestion"][0]["_attr"]["data"]["_value"]);
            } catch (e) {
                log("Couldn't find search suggestion #" + step + ". Possible it doesn't exist? Error: " + e);
            }
        }
        return items;
    } catch (e) {
        log("Error while searching via Google Trends: " + e.message);
    }
}
async function getSearchTrendsCountry() {
    const country = await window.electronAPI.getCountryCode();
    getSearchTrends(country.id).then(items => {
        trend_results = items;
    })
};

document.getElementById("close-btn").addEventListener("click", () => {
    window.electronAPI.quitOrb();
})

document.getElementById("minimise-btn").addEventListener("click", () => {
    window.electronAPI.minimiseOrb();
})

document.getElementById("maximise-btn").addEventListener("click", () => {
    window.electronAPI.maximiseOrb();
})

getSearchTrendsCountry();