import { RobotSwitchToggleButton } from "./RobotSwtichToggleButton.js";

let camera, scene, renderer;
let video, video2 = null, texture, texture2, mesh, mesh2, controls;
let startedSegway = false;
let startedA1 = false;
let remoteStreamSegwayLeft = null;
let remoteStreamSegwayRight = null;
let remoteStreamA1 = null;


function init() {

  let canvas = document.getElementById('renderCanvas');
  canvas.style.display = "block";
  // Initialize Babylon.js variables.
  let	sceneToRender;
        let xrHelper;
  const createDefaultEngine = function (canvas) {
      return new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true
      });
  }

  const engine = createDefaultEngine(canvas);

  let camera;
  let cameraFovDegree = 70;
  let videoDome;


  //Create scene and create XR experience.
  const createScene = async function() {
  //新しいシーンオブジェクトを作成する
    var scene = new BABYLON.Scene(engine);
    scene.ambientColor = new BABYLON.Color3(1, 1, 1);
    // scene.detachControl();

    //つねに原点を中心として回転するカメラを作成する
    camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", -Math.PI / 2, Math.PI / 2, 0, new BABYLON.Vector3(0, 0, 0), scene);
    const cameraFovRadian = cameraFovDegree * (Math.PI / 180);
    camera.fov = cameraFovRadian;

    // Camera の操作を canvas 上で可能にする
    camera.attachControl(canvas, true);
    camera.panningAxis._x = 0; //水平移動無し。
    camera.panningAxis._y = 0; //垂直移動無し。
    if (camera.inputs.attached.keyboard) {
        camera.inputs.attached.keyboard.detachControl();
    }
    if (camera.inputs.attached.pointers) {
        camera.inputs.attached.pointers.multiTouchPanAndZoom = false;
        camera.inputs.attached.pointers.multiTouchPanning = false;
        camera.inputs.attached.pointers.pinchInwards = false;
        camera.inputs.attached.pointers.pinchZoom = false;
        camera.inputs.attached.pointers.angularSensibilityX = 3000;
        camera.inputs.attached.pointers.angularSensibilityY = 3000;
    }
    if (camera.inputs.attached.mousewheel) {
        camera.inputs.attached.mousewheel.detachControl();
    }
    scene.onPointerObservable.add(e => {
        cameraFovDegree += e.event.wheelDelta * 2**(-5);
        camera.fov = cameraFovDegree * (Math.PI / 180);
    }, BABYLON.PointerEventTypes.POINTERWHEEL);
    if (camera.inputs.attached.gamepad) {
        camera.inputs.attached.gamepad.detachControl();
    }

    let setVideo = video;
    if (startedSegway && remoteStreamSegwayLeft == null) {
      setVideo = video2;
    }
    videoDome = new BABYLON.VideoDome(
        'VideoDome',
        setVideo,
        {
            resolution: 64,
            autoPlay: true
        },
        scene
    );
    videoDome.setAbsolutePosition(new BABYLON.Vector3(0, 0, 0));
    videoDome.setDirection(new BABYLON.Vector3(0, 0, 0));

    if (startedA1) {
      videoDome.setDirection(new BABYLON.Vector3(0, 0, -1));
    }

    let videoTexture_segway_left = new BABYLON.VideoTexture("video_segway_left", video, scene, true, true);
    let videoTexture_segway_right = new BABYLON.VideoTexture("video_segway_right", video2, scene, true, true);

    let distance_past = 0, distance_current = 0;


    scene.registerBeforeRender(function () {
        if (camera.inputs.attached.pointers) {
            if (camera.inputs.attached.pointers._pointA && camera.inputs.attached.pointers._pointB)
            distance_current = (camera.inputs.attached.pointers._pointA.x - camera.inputs.attached.pointers._pointB.x)**2 + (camera.inputs.attached.pointers._pointA.y - camera.inputs.attached.pointers._pointB.y)**2;
            if (distance_current > distance_past) {
                cameraFovDegree = cameraFovDegree - 1;
            }
            if (distance_current < distance_past) {
                cameraFovDegree = cameraFovDegree + 1;
            }
            distance_past = distance_current;
            if (cameraFovDegree < 0) {
                cameraFovDegree = 1;
            }
            if (cameraFovDegree > 180) {
                cameraFovDegree = 179;
            }
            camera.fov = cameraFovDegree * (Math.PI / 180);
        }
    });

    scene.onBeforeCameraRenderObservable.add((xr_camera) => {
      if (startedSegway) {
        if (remoteStreamSegwayLeft != null && remoteStreamSegwayRight != null) {
          if (xr_camera.isLeftCamera) {
            videoDome.texture = videoTexture_segway_left;
          }
          else {
            videoDome.texture = videoTexture_segway_right;
          }
        }
      }
    });


    // Create a default environment for the scene.
    var environment = scene.createDefaultEnvironment();

    // Initialize XR experience with default experience helper.
    xrHelper = await scene.createDefaultXRExperienceAsync({
              // floorMeshes: [environment.ground]
    });

    if (!xrHelper.baseExperience) {
      // XR support is unavailable.
      console.log('WebXR support is unavailable');
    }
    else {
      // XR support is available; proceed.

      // xrHelper.teleportation.rotationAngle = 0;

      xrHelper.teleportation.detach();

      xrHelper.input.xrCamera.setTarget(new BABYLON.Vector3(0, 0, 1));

      // xrHelper.teleportation.rotationEnabled = false;
      //
      xrHelper.baseExperience.onStateChangedObservable.add((state) => {
          camera.alpha = -Math.PI / 2;
          camera.beta = Math.PI / 2;
          console.log(state);
      });
    }
    return scene;
  }

  // Create scene.
  scene = createScene();
  scene.then(function (returnedScene) {
  sceneToRender = returnedScene;
  });
  engine.runRenderLoop(function () {
    if (sceneToRender) {
      sceneToRender.render();
    }
  });

  // Handle browser resize.
  window.addEventListener('resize', function () {
    engine.resize();
  });
  document.body.appendChild(RobotSwitchToggleButton.createButton());
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

  recvonlySegwayLeft.on("track", (event) => {
    if (event.track.kind == "video") {
      console.log("Received Video.");
      document.getElementById("noVideoMessage").style.display = "none";
      remoteStreamSegwayLeft = event.streams[0];
      if (!startedSegway && !startedA1) {
        startButtonSegway.style.display = "block"; // 映像が配信されたらボタンを表示する
      }
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