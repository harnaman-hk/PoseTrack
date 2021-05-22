// import * as tf from '@tensorflow/tfjs';
var config = {
    "count": 0,
    "data": [],
    "stream": null,
    "recorder": null,
    "resize": { "timeout": null },
    "time": { "start": 0, "stop": 0 },
    "convert": { "page": "https://webbrowsertools.com/convert-to-mp3/" },
    "addon": {
        "homepage": function() {
            return chrome.runtime.getManifest().homepage_url;
        }
    },
    "duration": function(ms) {
        var date = new Date(null);
        date.setSeconds(ms / 1000);
        return date.toISOString().substr(11, 8);
    },
    "size": function(s) {
        if (s) {
            if (s >= Math.pow(2, 30)) { return (s / Math.pow(2, 30)).toFixed(1) + " GB" };
            if (s >= Math.pow(2, 20)) { return (s / Math.pow(2, 20)).toFixed(1) + " MB" };
            if (s >= Math.pow(2, 10)) { return (s / Math.pow(2, 10)).toFixed(1) + " KB" };
            return s + " B";
        } else return '';
    },
    "stop": {
        "camera": function() {
            var tracks = config.stream.getTracks();
            for (var i = 0; i < tracks.length; i++) tracks[i].stop();
            if (config.recorder && config.recorder.state !== "inactive") {
                config.recorder.stop();
                config.data = [];
            }
        }
    },
    "storage": {
        "local": {},
        "read": function(id) { return config.storage.local[id] },
        "load": function(callback) {
            chrome.storage.local.get(null, function(e) {
                config.storage.local = e;
                callback();
            });
        },
        "write": function(id, data) {
            if (id) {
                if (data !== '' && data !== null && data !== undefined) {
                    var tmp = {};
                    tmp[id] = data;
                    config.storage.local[id] = data;
                    chrome.storage.local.set(tmp, function() {});
                } else {
                    delete config.storage.local[id];
                    chrome.storage.local.remove(id, function() {});
                }
            }
        }
    },
    "listener": {
        "data": function(e) { config.data.push(e.data) },
        "stop": function(e) {
            var a = document.createElement('a');
            var li = document.createElement("li");
            var spansize = document.createElement("span");
            var spanduration = document.createElement("span");
            var filename = (new Date()).toString().slice(0, 24);
            var blob = new Blob(config.data, { "type": "video/webm" });
            var duration = new Date(config.time.end - config.time.start);
            /*  */
            a.textContent = filename + ' ↓';
            a.href = URL.createObjectURL(blob);
            a.download = "Video " + filename.replace(/ /g, '-').replace(/:/g, '-') + ".webm";
            li.textContent = "#" + (++config.count);
            spansize.textContent = config.size(blob.size);
            spanduration.textContent = config.duration(duration.getTime());
            document.querySelector(".content div").style.background = "none";
            /*  */
            li.appendChild(a);
            li.appendChild(spansize);
            li.appendChild(spanduration);
            list.appendChild(li);
            config.data = [];
        }
    }
};

var load = async function() {
    var start = document.getElementById("start");
    var player = document.getElementById("camera");
    var cancel = document.getElementById("cancel");
    cancel.disabled = true;
    cancel.style.color = "#555";


    start.addEventListener("click", async function() {
        if (navigator.mediaDevices) {
            navigator.mediaDevices.getUserMedia({ "video": true, "audio": true }).then(function(e) {
                config.stream = e;
                start.disabled = true;
                cancel.style.color = "#e74c3c";

                cancel.removeAttribute('disabled');
                player.srcObject = config.stream;
                player.play();

                // work on prediction
                // console.log(config.stream.getTracks());
                while (start.disabled) {
                    imgObj = document.getElementById("camera");
                    const webcam = await tf.data.webcam(imgObj);
                    console.log(webcam);
                }

            }).catch(function(e) {});
        } else console.error("navigator.mediaDevices is not available!");

        try {

        } catch (e) {
            console.log("start error  ", e);
        }
    });
    /*  */
    cancel.addEventListener("click", function() {
        config.stop.camera();
        player.pause();
        cancel.disabled = true;
        player.currentTime = 0;
        cancel.style.color = "#555";
        start.removeAttribute('disabled');
        player.srcObject = config.stream;
    });

    window.removeEventListener("load", load, false);
};

window.addEventListener("resize", function() {
    if (config.resize.timeout) window.clearTimeout(config.resize.timeout);
    config.resize.timeout = window.setTimeout(function() {
        config.storage.write("width", window.innerWidth || window.outerWidth);
        config.storage.write("height", window.innerHeight || window.outerHeight);
    }, 1000);
}, false);

window.addEventListener("load", load, false);