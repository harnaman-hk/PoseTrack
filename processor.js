console.log("Ready");

const URL = "./model/model.json";
let model, webcam, ctx, labelContainer, maxPredictions;

let group = [];
let toggle = false;

async function init() {
    toggle = true;
    const modelURL = URL;
    const metadataURL = URL + "/metadata.json";

    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // Note: the pose library adds a tmPose object to your window (window.tmPose)

    model = await tmPose.load(modelURL, metadataURL);
    // you need to create File objects, like with file input elements (<input type="file" ...>)
    // const uploadModel = document.getElementById('upload-model');
    // const uploadWeights = document.getElementById('upload-weights');
    // const uploadMetadata = document.getElementById('upload-metadata');
    // model = await tmPose.loadFromFiles(uploadModel.files[0], uploadWeights.files[0], uploadMetadata.files[0])
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    // let mql = window.matchMedia("(max-width: 570px)");
    // const size = !mql ? window.innerWidth * 0.6 : window.innerHeight * 0.48;
    // const flip = true; // whether to flip the webcam
    // webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
    // await webcam.setup(); // request access to the webcam
    // await webcam.play();

    // imgObj = document.getElementById("camera");
    // const webcam = await tf.data.webcam(imgObj);
    // window.requestAnimationFrame(loop);

    // // append/get elements to the DOM
    // const canvas = document.getElementById("canvas");
    // canvas.width = !mql ?
    //     window.innerWidth * 0.5 :
    //     window.innerHeight * 0.45;
    // canvas.height = !mql ?
    //     window.innerWidth * 0.5 :
    //     window.innerHeight * 0.45;
    // ctx = canvas.getContext("2d");
    // labelContainer = document.getElementById("label-container");
    // for (let i = 0; i < maxPredictions; i++) {
    //     // and class labels
    //     labelContainer.appendChild(document.createElement("div"));
    // }
}

async function loop(timestamp) {
    console.log(timestamp);
    webcam.update(); // update the webcam frame

    await predict();
    if (toggle) {
        window.requestAnimationFrame(loop);
    }
}

async function predict(img) {
    // Prediction #1: run input through posenet
    // estimatePose can take in an image, video or canvas html element
    const {
        pose,
        posenetOutput
    } = await model.estimatePose(img);
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
    // console.log(group)
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            prediction[i].className +
            ": " +
            prediction[i].probability.toFixed(2);
        // labelContainer.childNodes[i].innerHTML = classPrediction;
    }

    // finally draw the poses
    drawPose(pose);
}

function notifyMe(message) {
    // Let's check if the browser supports notifications
    const startover = function() {
        // console.log('NOTIFICATION CLICKed')
        toggle = true;
        // console.log(toggle)
        window.requestAnimationFrame(loop);
        group = [];
    };
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
    }

    // Let's check whether notification permissions have already been granted
    else if (Notification.permission === "granted") {
        // If it's okay let's create a notification
        var title = "Posture";
        var icon =
            "https://homepages.cae.wisc.edu/~ece533/images/airplane.png";
        var body =
            message + ". Please sit in correctly and click this notification";
        var tag = "pose-bot";
        var notification = new Notification(title, {
            body,
            icon,
            tag
        });
    }

    // Otherwise, we need to ask the user for permission
    else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(function(permission) {
            // If the user accepts, let's create a notification
            if (permission === "granted") {
                var notification = new Notification(title, {
                    body,
                    icon,
                    tag
                });
            }
        });
    }

    notification.onclick = startover;
    notification.onclose = startover;

    // At last, if the user has denied notifications, and you
    // want to be respectful there is no need to bother them any more.
}

function checkPosture(posturegroup) {
    //group
    console.log(group);
    goodposture = (
        posturegroup.reduce((sum, data) => {
            return sum + data[0].probability;
        }, 0) / 100
    ).toFixed(3);
    badposture = (
        posturegroup.reduce((sum, data) => {
            return sum + data[1].probability;
        }, 0) / 100
    ).toFixed(3);
    nearscreen = (
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

    if (badposture >= 0.9) {
        // console.log('bad posture')
        toggle = false;
        group = [];
        console.log("Correct your posture");
    }

    if (nearscreen >= 0.9) {
        // console.log('bad posture')
        toggle = false;
        group = [];
        console.log("get away from screen");
    }
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

export async function processFrames(img) {
    init();
    predict(img);
}