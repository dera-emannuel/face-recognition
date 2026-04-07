const video = document.getElementById("video");
const canvas1 = document.getElementById("canvas1");
const canvas2 = document.getElementById("canvas2");
const resultEl = document.getElementById("result");
const resultBadge = document.getElementById("resultBadge");
const modelStatus = document.getElementById("modelStatus");

const btnCapture1 = document.getElementById("btnCapture1");
const btnCapture2 = document.getElementById("btnCapture2");
const btnCompare = document.getElementById("btnCompare");

let img1 = null;
let img2 = null;
let modelsReady = false;

// Start Camera
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(() => {
    updateStatus("Camera access denied or not available", "bad");
  });

// Load AI Models
async function loadModels() {
  try {
    await faceapi.nets.ssdMobilenetv1.loadFromUri("./models");
    await faceapi.nets.faceLandmark68Net.loadFromUri("./models");
    await faceapi.nets.faceRecognitionNet.loadFromUri("./models");
    modelsReady = true;
    updateStatus("Models ready", "ok");
  } catch (err) {
    updateStatus("Failed to load models", "bad");
    console.error(err);
  }
}

function updateStatus(text, tone) {
  if (!modelStatus) return;
  modelStatus.textContent = text;
  modelStatus.style.borderColor = tone === "ok" ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.5)";
  modelStatus.style.background = tone === "ok" ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)";
  modelStatus.style.color = tone === "ok" ? "#86efac" : "#fecaca";
}

function updateResult(text, tone) {
  if (!resultEl || !resultBadge) return;
  resultEl.querySelector("span").textContent = text;
  resultBadge.className = "badge" + (tone ? ` ${tone}` : "");
  resultBadge.textContent = tone === "ok" ? "Match" : tone === "bad" ? "No match" : "No data";
}

loadModels();

// Capture First Face
function captureTo(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}

btnCapture1.addEventListener("click", () => {
  img1 = captureTo(canvas1);
  updateResult("Captured Face A", "");
});

btnCapture2.addEventListener("click", () => {
  img2 = captureTo(canvas2);
  updateResult("Captured Face B", "");
});

// Compare Faces
btnCompare.addEventListener("click", async () => {
  if (!modelsReady) {
    updateResult("Models are still loading. Please wait.", "");
    return;
  }

  if (!img1 || !img2) {
    updateResult("Capture both faces first.", "");
    return;
  }

  const face1 = await faceapi
    .detectSingleFace(img1)
    .withFaceLandmarks()
    .withFaceDescriptor();

  const face2 = await faceapi
    .detectSingleFace(img2)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!face1 || !face2) {
    updateResult("Face not detected clearly.", "bad");
    return;
  }

  const distance = faceapi.euclideanDistance(
    face1.descriptor,
    face2.descriptor
  );

  if (distance < 0.6) {
    updateResult(`Same person (score: ${distance.toFixed(2)})`, "ok");
  } else {
    updateResult(`Different people (score: ${distance.toFixed(2)})`, "bad");
  }
});
