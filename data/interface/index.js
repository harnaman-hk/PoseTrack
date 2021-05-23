
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

    var model = await tmPose.load(modelURL, metadataURL);
    // console.log(model.estimatePose);
    maxPredictions = model.getTotalClasses();

    let mql = window.matchMedia("(max-width: 570px)");
    const size = !mql ? window.innerWidth * 0.6 : window.innerHeight * 0.48;
    const flip = true; 
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
    // console.log(model.estimatePose);
    // console.log(webcam);
    const {
        pose,
        posenetOutput
    } = await model.estimatePose(webcam.canvas);
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

        // console.log(classPrediction);
    }

}
var i=5;
function checkPosture(posturegroup) {
    //group
    // console.log(group);
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

    // console.log('good: ', goodposture, ' bad: ', badposture)


    // console.log({
    //     goodposture,
    //     badposture,
    //     nearscreen
    // });

    if (goodposture >= 0.9) {
        // console.log('bad posture')
        toggle = false;
        group = [];
        // console.log("Gooooooooood posture");
        pred_info.innerHTML = "Good Posture! Keep it up!";
    }

    if (badposture >= 0.9) {
        // console.log('bad posture')
        toggle = true;
        group = [];
        // console.log("Correct your posture");
        pred_info.innerHTML="Correct your Posture!";
    }

    if (nearscreen >= 0.9) {
        // console.log('bad posture')
        toggle = true;
        group = [];
        // console.log("get away from screen");
        pred_info.innerHTML = "Too near to the screen";
    }
    var prog=document.getElementById('progBar');
    // prog.val(goodposture*100);
    console.log(goodposture*100);
    prog.value=goodposture*100;
    // toggle = true;
    // loop(model);
}



function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}

async function processFrames(img) {
    init();
}

// processor.html
let stream;
var player = document.getElementById("camera");

async function processStream() {
    var imgObj = document.getElementById("camera");
    const webcam = await tf.data.webcam(imgObj);

    // console.log("webcam");
    // console.log(webcam);
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

            processStream();

        }).catch(function(e) { console.log("get media error", e) });
    } else console.error("navigator.mediaDevices is not available!");
}


window.addEventListener("load", loadMedia, false);
window.addEventListener("load", loadMedia, false);