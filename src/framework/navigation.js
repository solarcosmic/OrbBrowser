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

export function checkNavigation(tab) {
    if (!tab.view) return log("Error: No valid tab provided for checkNavigation!");
    var currentTab = getActiveTab();
    if (!currentTab?.id == tab?.id) return;
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
export function navigate(tab = getActiveTab(), direction) {
    if (!tab.view) return;
    if (direction == "back") tab.view.goBack();
    if (direction == "forward") tab.view.goForward();
    if (direction == "refresh") tab.view.reload();
    if (direction == "refreshNoCache") tab.view.reloadIgnoringCache();
}