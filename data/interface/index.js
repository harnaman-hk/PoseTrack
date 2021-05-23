import { stopProcessing } from '../../processor.js';

async function processStream() {
    var imgObj = document.getElementById("camera");
    const webcam = await tf.data.webcam(imgObj);

    console.log("webcam");
    console.log(webcam);
    try {
        var pred = await processFrames(webcam);
        console.log("final", pred);
        pred_info.innerHTML = pred[0];
        pred_acc.innerHTML = pred[1];
    } catch (err) {
        console.log(err);
    }
}

// var load = function() {
//     var start = document.getElementById("start");
//     var player = document.getElementById("camera");
//     var cancel = document.getElementById("cancel");
//     cancel.disabled = true;
//     cancel.style.color = "#555";

//     start.addEventListener("click", async function() {
//         if (navigator.mediaDevices) {
//             navigator.mediaDevices.getUserMedia({ "video": true, "audio": true }).then(function(e) {
//                 config.stream = e;
//                 start.disabled = true;
//                 cancel.style.color = "#e74c3c";

//                 cancel.removeAttribute('disabled');
//                 player.srcObject = config.stream;
//                 player.play();

//                 // work on prediction
//                 // imgObj = document.getElementById("camera");
//                 // const webcam = await tf.data.webcam(imgObj);
//                 // console.log(webcam);


//             }).catch(function(e) {});
//         } else console.error("navigator.mediaDevices is not available!");

//         try {

//         } catch (e) {
//             console.log("start error  ", e);
//         }
//     });
//     /*  */
//     cancel.addEventListener("click", function() {
//         config.stop.camera();
//         player.pause();
//         cancel.disabled = true;
//         player.currentTime = 0;
//         cancel.style.color = "#555";
//         start.removeAttribute('disabled');
//         player.srcObject = config.stream;
//     });

//     window.removeEventListener("load", load, false);
// };

// window.addEventListener("resize", function() {
//     if (config.resize.timeout) window.clearTimeout(config.resize.timeout);
//     config.resize.timeout = window.setTimeout(function() {
//         config.storage.write("width", window.innerWidth || window.outerWidth);
//         config.storage.write("height", window.innerHeight || window.outerHeight);
//     }, 1000);
// }, false);

var cancelbutton = document.getElementById("cancelstream");
cancelbutton.addEventListener("click", stopProcessing);

// window.addEventListener("load", async() => {
//     load();
//     processStream();
//     // processFrames();
// }, false);
// const webcamElement = document.getElementById('webcam');
// const classifier = knnClassifier.create();