export async function stopProcessing() {
    stream.getTracks().forEach(function(track) { track.stop(); });
}

console.log("Ready");
const URL = "../../model";
let webcam, ctx, labelContainer, maxPredictions;

let group = [];
let toggle = false;
var pred_info = document.getElementById("posture-result");
var pred_acc = document.getElementById("posture-accuracy");

async function init() {
    toggle = true;
    const modelURL = URL + "/model.json";
    const metadataURL = URL + "/metadata.json";

    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // Note: the pose library adds a tmPose object to your window (window.tmPose)

    var model = await tmPose.load(modelURL, metadataURL);
    console.log(model.estimatePose);

    // you need to create File objects, like with file input elements (<input type="file" ...>)
    // const uploadModel = document.getElementById('upload-model');
    // const uploadWeights = document.getElementById('upload-weights');
    // const uploadMetadata = document.getElementById('upload-metadata');
    // model = await tmPose.loadFromFiles(uploadModel.files[0], uploadWeights.files[0], uploadMetadata.files[0])
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    let mql = window.matchMedia("(max-width: 570px)");
    const size = !mql ? window.innerWidth * 0.6 : window.innerHeight * 0.48;
    const flip = true; // whether to flip the webcam
    webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    loop(model);
    // window.requestAnimationFrame(loop);

    // append/get elements to the DOM
    const canvas = document.getElementById("canvas");
    canvas.width = !mql ?
        window.innerWidth * 0.5 :
        window.innerHeight * 0.45;
    canvas.height = !mql ?
        window.innerWidth * 0.5 :
        window.innerHeight * 0.45;
    ctx = canvas.getContext("2d");
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) {
        // and class labels
        labelContainer.appendChild(document.createElement("div"));
    }
}

async function loop(model) {
    // console.log(timestamp);
    webcam.update(); // update the webcam frame

    await predict(model);
    if (toggle) {
        loop(model);
        // window.requestAnimationFrame(loop);
    }
}

async function predict(model) {
    // Prediction #1: run input through posenet
    // estimatePose can take in an image, video or canvas html element
    console.log(model.estimatePose);
    console.log(webcam);
    const {
        pose,
        posenetOutput
    } = await model.estimatePose(webcam.canvas);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await model.predict(posenetOutput);
    // console.log(group)
    if (group.length < 100) {
        group.push(prediction);
    } else {
        group.shift();
        group.push(prediction);
    }
    checkPosture(group);
    var labelContainer = document.getElementsByClassName("labelContainer");
    // console.log(group)
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            prediction[i].className +
            ": " +
            prediction[i].probability.toFixed(2);
        // labelContainer.childNodes[i].innerHTML = classPrediction;
        console.log(classPrediction);
    }

    // finally draw the poses
    // drawPose(pose);
}

function checkPosture(posturegroup) {
    //group
    console.log(group);
    var goodposture = (
        posturegroup.reduce((sum, data) => {
            return sum + data[0].probability;
        }, 0) / 100
    ).toFixed(3);
    var badposture = (
        posturegroup.reduce((sum, data) => {
            return sum + data[1].probability;
        }, 0) / 100
    ).toFixed(3);
    var nearscreen = (
        posturegroup.reduce((sum, data) => {
            return sum + data[2].probability;
        }, 0) / 100
    ).toFixed(3);

    console.log('good: ', goodposture, ' bad: ', badposture)
        // document.getElementById('good').innerHTML = 'Good: ' + goodposture
        // document.getElementById('bad').innerHTML = 'Bad: ' + badposture

    console.log({
        goodposture,
        badposture,
        nearscreen
    });

    if (goodposture >= 0.9) {
        // console.log('bad posture')
        toggle = false;
        group = [];
        console.log("Gooooooooood posture");
        pred_info.innerHTML = "Good Posture! Keep it up!";
    }

    if (badposture >= 0.9) {
        // console.log('bad posture')
        toggle = false;
        group = [];
        console.log("Correct your posture");
        pred_info.innerHTML("Correct your Posture!");
    }

    if (nearscreen >= 0.9) {
        // console.log('bad posture')
        toggle = false;
        group = [];
        console.log("get away from screen");
        pred_info.innerHTML = "Too near to the screen";
    }

    // toggle = true;
    // loop(model);
}


function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        // draw the keypoints and skeleton
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}

async function processFrames(img) {
    // var model = init();
    // return await model.then((res) => {
    //     var pred = predict(img, res);
    //     return pred.then((res) => {
    //         var gettingCookies = browser.cookies.get({
    //             url: "postrack.cookie",
    //             name: "posture_records"
    //         });
    //         gettingCookies.then((cookie) => {
    //             if (cookie)
    //                 console.log("yayy");
    //             // console.log(cookie);
    //             // console.log(JSON.parse(cookie.value));
    //         });
    //         browser.runtime.sendMessage({ "text": res[0] });
    //         return res;
    //     });
    // });
    init();
}

// processor.html
let stream;
var player = document.getElementById("camera");

async function processStream() {
    var imgObj = document.getElementById("camera");
    const webcam = await tf.data.webcam(imgObj);

    console.log("webcam");
    console.log(webcam);
    try {
        await processFrames(webcam);
    } catch (err) {
        console.log(err);
    }
}

var loadMedia = async function() {
    if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia({ "video": true, "audio": true }).then(function(e) {
            stream = e;
            player.srcObject = stream;
            player.play();

            // work on prediction
            // imgObj = document.getElementById("camera");
            // const webcam = await tf.data.webcam(imgObj);
            // console.log(webcam);
            console.log(stream);
            processStream();

        }).catch(function(e) { console.log("get media error", e) });
    } else console.error("navigator.mediaDevices is not available!");
}


window.addEventListener("load", loadMedia, false);
window.addEventListener("load", loadMedia, false);