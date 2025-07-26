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
    if (!tab.view || !tab.id) error("Missing tab view and/or ID! Cannot create a tab button.");
    const btn = document.createElement("button");
    btn.setAttribute("id", "tab-button-" + tab.id);
    btn.onclick = () => {
        activateTab(tab);
    }
    const favicon = document.createElement("img");
    favicon.setAttribute("id", "tab-icon-" + tab.id);
    btn.appendChild(favicon);
    const txt = document.createElement("span");
    console.log(tab.view);
    //txt.textContent = tab.view.getTitle() || tab.view.getURL();
    txt.classList.add("page-title");
    btn.appendChild(txt);
    document.getElementById("tab-buttons").appendChild(btn);
}

function getTabButtonByID(id) {

}

createTabButton(createTab());