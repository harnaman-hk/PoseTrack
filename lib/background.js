var app = {};
let stream;
let launchedTabs = {};

app.id = { "main": '', "parent": '' };
app.version = function() { return chrome.runtime.getManifest().version };
app.homepage = function() { return chrome.runtime.getManifest().homepage_url };
app.tab = { "open": function(url) { chrome.tabs.create({ "url": url, "active": true }) } };

if (!navigator.webdriver) {
    chrome.runtime.setUninstallURL(app.homepage() + "?v=" + app.version() + "&type=uninstall", function() {});
    chrome.runtime.onInstalled.addListener(function(e) {
        chrome.management.getSelf(function(result) {
            if (result.installType === "normal") {
                window.setTimeout(function() {
                    var previous = e.previousVersion !== undefined && e.previousVersion !== app.version();
                    if (e.reason === "install" || (e.reason === "update" && previous)) {
                        var parameter = (e.previousVersion ? "&p=" + e.previousVersion : '') + "&type=" + e.reason;
                        app.tab.open(app.homepage() + "?v=" + app.version() + parameter);
                    }
                }, 3000);
            }
        });
    });
}

app.storage = (function() {
    var objs = {};
    window.setTimeout(function() {
        chrome.storage.local.get(null, function(o) { objs = o });
    }, 0);
    /*  */
    return {
        "read": function(id) { return objs[id] },
        "write": function(id, data) {
            var tmp = {};
            tmp[id] = data;
            objs[id] = data;
            chrome.storage.local.set(tmp, function() {});
        }
    }
})();

app.UI = (function() {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.path === "ui-to-background") {
            if (request.method === "tab") {
                app.UI.close();
                window.setTimeout(function() {
                    app.tab.open(chrome.runtime.getURL("data/interface/index.html"));
                }, 300);
            }
        }
    });
    /*  */
    return {
        "close": function() { chrome.windows.remove(app.id.main) },
        "create": function() {
            chrome.storage.local.get({ "width": 970, "height": 650 }, function(storage) {
                chrome.windows.getCurrent(function(win) {
                    app.id.parent = win.id;
                    var width = storage.width;
                    var height = storage.height;
                    var top = win.top + Math.round((win.height - height) / 2);
                    var left = win.left + Math.round((win.width - width) / 2);
                    var url = chrome.runtime.getURL("data/interface/index.html");
                    chrome.windows.create({ "url": url, "type": "popup", "width": width, "height": height, "top": top, "left": left }, function(w) {
                        app.id.main = w.id;
                    });
                });
            });
        }
    }
})();

function notify(message) {
    console.log("background script received message");
    var title = browser.i18n.getMessage("notificationTitle");
    var content = browser.i18n.getMessage("notificationContent", message.text);
    browser.notifications.create({
        "type": "basic",
        "iconUrl": browser.extension.getURL("data/icons/beasts-48.png"),
        "title": title,
        "message": content
    });
}

function cookieUpdate() {
    getActiveTab().then((tabs) => {
        // get any previously set cookie for the current tab 
        var gettingCookies = browser.cookies.get({
            url: tabs[0].url,
            name: "bgpicker"
        });
        gettingCookies.then((cookie) => {
            if (cookie) {
                var cookieVal = JSON.parse(cookie.value);
                browser.tabs.sendMessage(tabs[0].id, { image: cookieVal.image });
                browser.tabs.sendMessage(tabs[0].id, { color: cookieVal.color });
            }
        });
    });
}

function loadProcessors() {
    console.log('Cleaning up old processors');
    let keys = Object.keys(launchedTabs);
    for (let key of keys) {
        let client = launchedTabs[key];
        browser.tabs.remove(client.tabId);
        delete launchedTabs[key];
    }

    console.log('Launching new processor');
    browser.tabs.create({ url: `/processor.html`, active: false })
        .then(async(tab) => {
            // await browser.tabs.hide(tab.id);
            launchedTabs[tab.id] = tab.id;
        });
    console.log('Processor tab launched');
}

// try {
//     browser.cookies.set({
//         url: ext_url,
//         name: "posture_records",
//         value: JSON.stringify({ goodposture: 0, badposture: 0, nearscreen: 0 })
//     });
//     var gettingCookies = browser.cookies.get({
//         url: ext_url,
//         name: "posture_records"
//     });
//     gettingCookies.then((cookie) => {
//         if (cookie)
//             console.log("yayy");
//         console.log(cookie);
//         console.log(JSON.parse(cookie.value));
//     });
// } catch (e) {
//     console.log("cookie error", e);
// }

loadProcessors();
browser.runtime.onMessage.addListener(notify);
chrome.windows.onRemoved.addListener(function(e) { if (e === app.id.main) { app.id.main = null } });
chrome.browserAction.onClicked.addListener(function() { app.id.main ? chrome.windows.update(app.id.main, { "focused": true }) : app.UI.create() });