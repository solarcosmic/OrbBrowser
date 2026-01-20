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

import {utils, customLinks, tabs} from "framework/linkman";
const log = utils.createLogger("net.solarcosmic.orbbrowser.misc");

export var browseHistory = JSON.parse(localStorage.getItem("orb:browsing_history") || "[]");
export var bookmarks = JSON.parse(localStorage.getItem("orb:bookmarks") || "[]");

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

export function createPinDivider() {
    if (!document.getElementById("pinned-tab-divider")) {
        console.log("pinned tab divider!");
        const divider = document.createElement("hr");
        divider.setAttribute("id", "pinned-tab-divider");
        document.getElementById("pinned-tab-buttons").parentNode.insertBefore(divider, document.getElementById("pinned-tab-buttons").nextSibling);
    }
}

export function removePinDivider() {
    if (document.getElementById("pinned-tab-divider")) document.getElementById("pinned-tab-divider").remove();
}

export function getPinnedTabCount() {
    return document.getElementById("pinned-tab-buttons").childElementCount;
}