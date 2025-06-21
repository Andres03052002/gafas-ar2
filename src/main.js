import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as mpFaceMesh from '@mediapipe/face_mesh';

// 1) Inicializa Three.js: escena, cámara ortográfica o perspectiva, renderer
const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 1000);
camera.position.set(0,0,5);

// 2) Carga modelo GLB con Draco
DRACOLoader.setDecoderPath('/draco/');
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
let glasses3D;
loader.load('/models/gafas_draco.glb', gltf => {
  glasses3D = gltf.scene;
  scene.add(glasses3D);
});

// 3) Stream de cámara y FaceMesh
const video = document.createElement('video');
navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
  video.srcObject = stream;
  video.play();
  initFaceMesh();
});

function initFaceMesh() {
  const faceMesh = new mpFaceMesh.FaceMesh({
    locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
  });
  faceMesh.setOptions({ maxNumFaces:1, refineLandmarks:true });
  faceMesh.onResults(onFaceResults);

  const cameraFeed = new mpFaceMesh.Camera(video, {
    onFrame: async () => await faceMesh.send({image: video}),
    width: 640, height: 480
  });
  cameraFeed.start();
}

function onFaceResults(results) {
  if (!results.multiFaceLandmarks.length || !glasses3D) return;
  const lm = results.multiFaceLandmarks[0];

  // Extrae ojos, nariz… y calcula posición, rotación y escala:
  const leftEye = lm[33], rightEye = lm[263], noseTip = lm[1];
  const eyeDist = Math.hypot(
    (leftEye.x - rightEye.x),
    (leftEye.y - rightEye.y)
  );
  // Ajusta posición:
  glasses3D.position.set(
    (leftEye.x+rightEye.x)/2 - 0.5,
    -(leftEye.y+rightEye.y)/2 + 0.5,
    0
  );
  // Ajusta escala proporcional a eyeDist:
  glasses3D.scale.setScalar(eyeDist*2);

  renderer.render(scene, camera);
}
