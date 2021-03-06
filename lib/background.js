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
