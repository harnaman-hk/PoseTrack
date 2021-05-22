import { processFrames } from '../../processor.js';

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

async function processStream() {
    imgObj = document.getElementById("camera");
    const webcam = await tf.data.webcam(imgObj);
    modeljson = { "modelTopology": { "class_name": "Sequential", "config": { "name": "sequential_2", "layers": [{ "class_name": "Dense", "config": { "units": 100, "activation": "relu", "use_bias": true, "kernel_initializer": { "class_name": "VarianceScaling", "config": { "scale": 1, "mode": "fan_in", "distribution": "normal", "seed": null } }, "bias_initializer": { "class_name": "Zeros", "config": {} }, "kernel_regularizer": null, "bias_regularizer": null, "activity_regularizer": null, "kernel_constraint": null, "bias_constraint": null, "name": "dense_Dense1", "trainable": true, "batch_input_shape": [null, 14739], "dtype": "float32" } }, { "class_name": "Dropout", "config": { "rate": 0.5, "noise_shape": null, "seed": null, "name": "dropout_Dropout1", "trainable": true } }, { "class_name": "Dense", "config": { "units": 3, "activation": "softmax", "use_bias": false, "kernel_initializer": { "class_name": "VarianceScaling", "config": { "scale": 1, "mode": "fan_in", "distribution": "normal", "seed": null } }, "bias_initializer": { "class_name": "Zeros", "config": {} }, "kernel_regularizer": null, "bias_regularizer": null, "activity_regularizer": null, "kernel_constraint": null, "bias_constraint": null, "name": "dense_Dense2", "trainable": true } }] }, "keras_version": "tfjs-layers 1.3.1", "backend": "tensor_flow.js" }, "weightsManifest": [{ "paths": ["weights.bin"], "weights": [{ "name": "dense_Dense1/kernel", "shape": [14739, 100], "dtype": "float32" }, { "name": "dense_Dense1/bias", "shape": [100], "dtype": "float32" }, { "name": "dense_Dense2/kernel", "shape": [100, 3], "dtype": "float32" }] }] };
    modelmeta = { "tfjsVersion": "1.3.1", "tmVersion": "0.8.6", "packageVersion": "0.8.6", "packageName": "@teachablemachine/pose", "timeStamp": "2020-11-21T18:30:15.108Z", "userMetadata": {}, "modelName": "my-pose-model", "labels": ["good posture", "bad posture", "near screen"], "modelSettings": { "posenet": { "architecture": "MobileNetV1", "outputStride": 16, "inputResolution": 257, "multiplier": 0.75 } } };
    // try {

    //     const model = await tf.loadLayersModel(modeljson);
    // } catch (err) {
    //     console.log(err);
    // }
    // console.log("webcam");
    // console.log(webcam);
}

var load = function() {
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
                // imgObj = document.getElementById("camera");
                // const webcam = await tf.data.webcam(imgObj);
                // console.log(webcam);


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

window.addEventListener("load", async() => {
    load();
    // processStream();
    processFrames();
}, false);
// const webcamElement = document.getElementById('webcam');
// const classifier = knnClassifier.create();

// let net;

// async function app() {
//     console.log('Loading mobilenet..');

//     // Load the model.
//     net = await mobilenet.load();
//     console.log('Successfully loaded model');

//     // Create an object from Tensorflow.js data API which could capture image
//     // from the web camera as Tensor.
//     const webcam = await tf.data.webcam(webcamElement);

//     // Reads an image from the webcam and associates it with a specific class
//     // index.
//     const addExample = async classId => {

//         for (let x = 50; x > 0; x--) {
//             // Capture an image from the web camera.
//             const img = await webcam.capture();

//             // Get the intermediate activation of MobileNet 'conv_preds' and pass that
//             // to the KNN classifier.
//             const activation = net.infer(img, 'conv_preds');

//             // Pass the intermediate activation to the classifier.
//             classifier.addExample(activation, classId);

//             // Dispose the tensor to release the memory.
//             img.dispose();

//             // Add some time between images so there is more variance
//             setTimeout(() => {
//                 console.log("Added image")
//             }, 100)
//         }
//     };

//     // When clicking a button, add an example for that class.
//     document.getElementById('class-a').addEventListener('click', () => addExample(0));
//     document.getElementById('class-b').addEventListener('click', () => addExample(1));

//     while (true) {
//         if (classifier.getNumClasses() > 0) {
//             const img = await webcam.capture();

//             // Get the activation from mobilenet from the webcam.
//             const activation = net.infer(img, 'conv_preds');
//             // Get the most likely class and confidence from the classifier module.
//             const result = await classifier.predictClass(activation);

//             const classes = ['notouch', 'touch'];
//             document.getElementById('console').innerText = `
//         prediction: ${classes[result.label]}\n
//         probability: ${result.confidences[result.label]}
//       `;

//             // Dispose the tensor to release the memory.
//             img.dispose();
//         }

//         await tf.nextFrame();
//     }
// }

// app();