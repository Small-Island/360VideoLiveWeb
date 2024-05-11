import * as THREE from "/360VideoLiveWeb/build/three.module.js";
import { OrbitControls } from "/360VideoLiveWeb/controls/OrbitControls.js";
import { VRButton } from "./VRButton.js";
import { RobotSwitchToggleButton } from "./RobotSwtichToggleButton.js";

let camera, scene, renderer;
let video, video2 = null, texture, texture2, mesh, mesh2, controls;

function init() {
  console.log("init");

  scene = new THREE.Scene();
  const container = document.createElement("div");
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    3000
  );

  console.log(camera);

  // camera = new THREE.StereoCamera();

  camera.target = new THREE.Vector3(0, 0, 0);

  // カメラの初期位置を設定
  camera.position.set(0, 0, 501);
  console.log("camera.position", camera.position);

  // カメラの注視点を設定（ビデオテクスチャの位置）
  camera.lookAt(0, 0, 0);

  const geometry = new THREE.SphereBufferGeometry(500, 60, 40);
  geometry.scale(-1, 1, 1);

  texture = new THREE.VideoTexture(video);
  texture.format = THREE.RGBFormat;

  const material = new THREE.MeshBasicMaterial({ map: texture });
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // const geometry2 = new THREE.SphereBufferGeometry(500, 60, 40);
  // geometry.scale(-1, 1, 1);

  // texture2 = new THREE.VideoTexture(video2);
  // texture2.format = THREE.RGBFormat;

  // const material2 = new THREE.MeshBasicMaterial({ map: texture2 });
  // mesh2 = new THREE.Mesh(geometry, material2);
  // scene.add(mesh2);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0xefefef);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  console.log(typeof(VRButton.createButton(renderer)));
  document.body.appendChild(VRButton.createButton(renderer));
  console.log(typeof(RobotSwitchToggleButton.createButton(renderer)))
  document.body.appendChild(RobotSwitchToggleButton.createButton());
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false; // ズーム操作を無効化
  // controls.enablePan = false; // パン操作を無効化
  controls.enableDamping = true; // 滑らかにカメラコントローラーを制御する
  controls.dampingFactor = 0.2;
  // controls.minDistance = 0.1;
  // controls.maxDistance = 2000;

  // WebXR APIが利用可能かどうかを確認し、利用可能な場合にはVRモードを有効化
  // if ("XR" in navigator) {
  //   renderer.xr.enabled = true;
  //   document.body.appendChild(VRButton.createButton(renderer));
  //   console.log("XR is supported.");
  // } else {
  //   console.log("XR is not supported.");
  //   console.log("ユーザーの端末情報は，", navigator.userAgent);
  // }

  animate();
}

function animate() {
  console.log("animate");
  // requestAnimationFrame(animate);
  // controls.update();
  // renderer.render(scene, camera);
  renderer.setAnimationLoop(function () {
    renderer.render(scene, camera);
  });
  controls.update();
}

async function connectToSora() {
  video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.loop = true;
  video.muted = false;
  video.playsInline = true; // この行を追加しないとiOSで動画が再生されない

  video2 = document.createElement("video");
  video2.crossOrigin = "anonymous";
  video2.loop = true;
  video2.muted = false;
  video2.playsInline = true; // この行を追加しないとiOSで動画が再生されない

  const debug = false;
  const sora = Sora.connection(
    "wss://u1.xr360d.net/signaling",
    debug
  );
  const metadata = undefined;
  const options = { 
    multistream: true,
    audio: true,
    audioBitRate: 64, // オーディオのビットレートを 64 kbps に設定
  };
  const recvonlySegwayLeft = sora.recvonly("segway-left", metadata, options);
  const recvonlySegwayRight = sora.recvonly("segway-right", metadata, options);
  const recvonlyA1 = sora.recvonly("a1", metadata, options);

  const startButtonSegway = document.getElementById("startButtonSegway");
  const startButtonA1 = document.getElementById("startButtonA1");
  let remoteStreamSegwayLeft = null;
  let remoteStreamSegwayRight = null;
  let remoteStreamA1 = null;

  let startedSegway = false;
  let startedA1 = false;

  recvonlySegwayLeft.on("track", (event) => {
    console.log("Received Video.");
    document.getElementById("noVideoMessage").style.display = "none";
    remoteStreamSegwayLeft = event.streams[0];
    if (!startedSegway && !startedA1) {
      startButtonSegway.style.display = "block"; // 映像が配信されたらボタンを表示する
    }
  });

  startButtonSegway.addEventListener("click", () => {
    startedSegway = true;
    console.log("Start button was pushed !");
    startButtonSegway.style.display = "none"; // スタートボタンを非表示にする
    startButtonA1.style.display = "none"; // スタートボタンを非表示にする
    video.srcObject = remoteStreamSegwayLeft;
    video.onloadeddata = () => {
      video.play().catch((error) => console.error("Play video error:", error));
    };
    if (remoteStreamSegwayRight != null) {
      video2.srcObject = remoteStreamSegwayRight;
      video2.onloadeddata = () => {
        video2.play().catch((error) => console.error("Play video error:", error));
      };
    }
    init();
  });

  recvonlySegwayLeft.on("removetrack", (event) => {
    startButtonSegway.style.display = "none";
    if (startedSegway) {
      const target = event.target;
      if (target.getTracks().length === 0) {
        document.getElementById("noVideoMessage").style.display = "block";
        location.reload();
      }
    }
  });

  recvonlySegwayLeft.connect();

  recvonlySegwayRight.on("track", (event) => {
    console.log("Received Video.");
    document.getElementById("noVideoMessage").style.display = "none";
    remoteStreamSegwayRight = event.streams[0];
    if (!startedSegway && !startedA1) {
      startButtonSegway.style.display = "block"; // 映像が配信されたらボタンを表示する
    }
  });

  recvonlySegwayRight.on("removetrack", (event) => {
    startButtonSegway.style.display = "none";
    if (startedSegway) {
      const target = event.target;
      if (target.getTracks().length === 0) {
        document.getElementById("noVideoMessage").style.display = "block";
        location.reload();
      }
    }
  });

  recvonlySegwayRight.connect();

  recvonlyA1.on("track", (event) => {
    console.log("Received Video.");
    document.getElementById("noVideoMessage").style.display = "none";
    remoteStreamA1 = event.streams[0];
    if (!startedSegway && !startedA1) {
      startButtonA1.style.display = "block"; // 映像が配信されたらボタンを表示する
    }
  });

  startButtonA1.addEventListener("click", () => {
    startedA1 = true;
    console.log("Start button was pushed !");
    startButtonSegway.style.display = "none"; // スタートボタンを非表示にする
    startButtonA1.style.display = "none"; // スタートボタンを非表示にする
    video.srcObject = remoteStreamA1;
    video.onloadeddata = () => {
      video.play().catch((error) => console.error("Play video error:", error));
    };
    init();
  });

  recvonlyA1.on("removetrack", (event) => {
    startButtonA1.style.display = "none";
    if (startedA1) {
      const target = event.target;
      if (target.getTracks().length === 0) {
        document.getElementById("noVideoMessage").style.display = "block";
        location.reload();
      }
    }
  });

  await recvonlyA1.connect();

  console.log("Connected to Sora");

}
window.onload = function () {
  connectToSora();
};


window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}