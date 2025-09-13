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

export function updateOmniboxHostname(hostname, url) {
    const omniboxtxt = document.getElementById("url-txt");
    omniboxtxt.textContent = hostname || url || "";
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
    for (const [protocol, protoItems] of Object.entries(customLinks)) {
        for (const [linkName, linkItem] of Object.entries(protoItems)) {
            const exampleProtocol = `${protocol.toLowerCase()}://${linkName.toLowerCase()}`;
            if (hostname == exampleProtocol) {
                omniSecure.src = "../assets/star-solid-full.svg";
                omniSecure.classList.remove("svg-grey");
                omniboxtxt.textContent = hostname || url || "";
                break;
            }
        }
    }
    document.getElementById("omnibox-entry").prepend(omniSecure);
}

export function goToLink(txt, activeTab = getActiveTab()) {
    var pattern = /^((http|https|chrome):\/\/)/; /* https://stackoverflow.com/a/11300963 */
    var dm_regex = /^(?:(?:(?:[a-zA-z\-]+):\/{1,3})?(?:[a-zA-Z0-9])(?:[a-zA-Z0-9\-\.]){1,61}(?:\.[a-zA-Z]{2,})+|\[(?:(?:(?:[a-fA-F0-9]){1,4})(?::(?:[a-fA-F0-9]){1,4}){7}|::1|::)\]|(?:(?:[0-9]{1,3})(?:\.[0-9]{1,3}){3}))(?:\:[0-9]{1,5})?$/; /* https://stackoverflow.com/a/38578855 */

    var formedProtocol;
    var protocolItems;
    for (const [protocol, protoItems] of Object.entries(customLinks)) {
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
        const tab = createTabInstance(protocolItems.file);
        tab.displayURL = formedProtocol;
        Tabs.activateTab(tab);
        tab.button.querySelector(".page-title").textContent = formedProtocol;
        updateOmniboxHostname(formedProtocol, formedProtocol);
        tab.button.querySelector("img").src = "../assets/star-solid-full.svg";
    } else if (pattern.test(txt)) {
        if (!activeTab) return Tabs.activateTab(createTabInstance(txt));
        getActiveTab().view.loadURL(txt);
    } else if (dm_regex.test(txt)) {
        if (!activeTab) return Tabs.activateTab(createTabInstance("http://" + txt));
        getActiveTab().view.loadURL("http://" + txt);
    } else {
        if (!activeTab) return Tabs.activateTab(createTabInstance("https://google.com/search?client=orb&q=" + txt));
        getActiveTab().view.loadURL("https://google.com/search?client=orb&q=" + txt);
    }
    document.getElementById("omnibox").style.display = "none";
}

export async function searchSuggestions() {
    try {
        clearSearchSuggestionButtons();
        if (urlBox.value.trim() == "") {
            clearSearchSuggestionButtons();
            return;
        }
        /*if (urlBox.value.toLowerCase().startsWith("fav")) {
            addSearchSuggestionButton("Favorite Tab", "../assets/star-solid-full.svg", "Quick Action");
        }
        if (urlBox.value.toLowerCase().startsWith("chat")) {
            addSearchSuggestionButton("Ask ChatGPT", "../assets/star-solid-full.svg", "Quick Action");
        }*/
        if (urlBox.value.toLowerCase().startsWith("hist")) {
            addSearchSuggestionButton("Browsing History", "../assets/gear-solid-full.svg", "Quick Action");
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

export function clearSearchSuggestionButtons() {
    document.getElementById("omnibox-search-list").innerHTML = "";
}

export function addSearchSuggestionButton(txt, icon = "../assets/magnifying-glass-solid-full.svg") {
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