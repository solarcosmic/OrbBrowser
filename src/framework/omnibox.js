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
import {utils, customLinks} from "framework/linkman";
const log = utils.createLogger("net.solarcosmic.orbbrowser.omnibox");
export function updateOmniboxHostname(hostname, url) {
    const omniboxtxt = document.getElementById("url-txt");
    omniboxtxt.textContent = hostname || url || "" //truncateString((hostname || url || ""), truncateAmount);
    utils.checkOmniFlow();
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
    } else if (url.startsWith("chrome-extension:")) {
        omniSecure.src = "../assets/chrome-brands-solid-full.svg";
        omniSecure.classList.add("svg-grey");
    }
    for (const [protocol, protoItems] of Object.entries(customLinks.list)) {
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