<script>
    export let src = "https://s.bepro11.com/vr-video-sample.mp4";
    export let isDemo;
    import { onMount } from "svelte";
    import * as THREE from "three";
    import { OrbitControls } from "three/addons/controls/OrbitControls.js";
    import { VRButton } from "three/addons/webxr/VRButton.js";
  
    import Overlay from "./Overlay.svelte";
    import { handleInput } from "./VrControllerHandler";
    import DefaultKeyframes from "./DefaultKeyframes";
  
    let container;
    let scene, camera, renderer, controls;
  
    // Radius of the sphere to project the video onto (May need to update for VR).
    const radius = 30;

    // Initial, min and max zoom for the camera perspective.
    const DEFAULT_FOV = 75;
    const MAX_FOV = 100;
    const MIN_FOV = 10;

    // TODO: Notes currently do not disappear after the duration.
    const DEFAULT_NOTE_DURATION = 1000;
    const DEFAULT_NOTE_COLOR = 0xcccccc;

    // All of these are used for state tracking in the overlay.
    let notes = isDemo ? getDefaultKeyframes() : [];
    let video;
    let videoDuration = 0;
    let videoCurrentTime = 0;
    let videoPaused = true;
    let zoomLevelAmount = translateFOVToZoomLevel(DEFAULT_FOV);

    function addNote(time, noteContent) {
      let textContainerMesh = createText(
        noteContent,
        1,
        5,
        500,
        0x000000,
        DEFAULT_NOTE_COLOR,
      ); // text #1, Hello, world
      scene.add(textContainerMesh);
  
      // Create new vector to shoot in the direcion of the viewer.
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
  
      // Scale position within the viewing sphere, then set the position of the text container.
      direction.multiplyScalar(radius * 0.5);
      textContainerMesh.position.set(direction.x, direction.y, direction.z);
  
      // We want to make sure the viewer is seeing the plane head on for readability.
      textContainerMesh.lookAt(0, 0, 0);
      textContainerMesh.doubleSided = true;
  
      scene.add(textContainerMesh);
  
      notes.push({ time, noteContent, mesh: textContainerMesh, duration: DEFAULT_NOTE_DURATION, color: DEFAULT_NOTE_COLOR, type: "note", keyframeColor: 'brown', position: textContainerMesh.position });

      return notes;
    }

    function addSnap(time) {
        // Create new vector to shoot in the direcion of the viewer.
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
  
        // Scale position within the viewing sphere, then set the position of the text container.
        direction.multiplyScalar(radius * 0.5);
        let fakeMesh = { position: new THREE.Vector3(direction.x, direction.y, direction.z) };
        notes.push({ time, noteContent: null, mesh: fakeMesh, duration: DEFAULT_NOTE_DURATION, color: DEFAULT_NOTE_COLOR, type: 'snap', keyframeColor: "cadetblue", position: fakeMesh.position });

        return notes;
    }

    function clearState() {
        // TODO: Remove once we have default data saved.
        console.debug(notes);

        // Remove each note from the list and from the scene.
        notes.forEach((note, index) => {
            removeNote(index);
        });

        // Reset video state.
        video.pause();
        video.currentTime = 0;
        videoDuration = 0;
        videoCurrentTime = 0;
        videoPaused = true;

    }

    function getDefaultKeyframes() {
        let data = [];
        DefaultKeyframes.forEach(keyframes => {
            // move the camera to look at the position.
            // if keyframe is snap
            // recreate the snap
            // else
            // recreate mesh and save to array.
        });

        return data;
    }

    function loadDemo() {
        clearState();
        notes = getDefaultKeyframes();
    }

    function playVideo() {
      video.play();
      videoPaused = video.paused;
    }
  
    function pauseVideo() {
      video.pause();
      videoPaused = video.paused;
    }

    function removeNote(noteIndex) {
        let targetNote = notes[noteIndex];
        // Remove notes from the scene.
        if(targetNote.type === "note") {
            targetNote.mesh.geometry.dispose();
            targetNote.mesh.material.dispose();
            scene.remove( targetNote.mesh );
        }
        // Remove from our array and return updated list of keyframes.
        notes = notes.filter((_, index) => index != noteIndex);
        return notes;
    }

    function setZoomAmount(newZoomLevel) {
        let newFOV = translateZoomLevelToFOV(newZoomLevel);
        // Clamp the field of view to prevent zooming in too far or too close.
        camera.fov = THREE.MathUtils.clamp(newFOV, MIN_FOV, MAX_FOV);
        zoomLevelAmount = translateFOVToZoomLevel(camera.fov);
        camera.updateProjectionMatrix();
    }

    function snapToNote(note) {
        camera.lookAt(note.mesh.position);
    }

    function translateFOVToZoomLevel(fov) {
        return (MAX_FOV - fov) / (MAX_FOV - MIN_FOV);
    }
    
    function translateZoomLevelToFOV(zoomLevel) {
        return MAX_FOV - zoomLevel * (MAX_FOV - MIN_FOV);
    }

    function updateVideoTime(time) {
      video.currentTime = time;
    }
  
    function createText(textContent, hWorldText, hWorldContainer, hPxTxt, fgcolor, bgcolor) {
      // textContent is the text.
      // hWorldText is world height of text in the plane.
      // hWorldContainer is world height of whole rectangle containing the text.
      // hPxTxt is px height of text in the texture canvas; larger gives sharper text.
      // The plane and texture canvas are created wide enough to hold the text.
      // And wider if hWorldContainer/hWorldText > 1 which indicates padding is desired.
      var kPxToWorld = hWorldText / hPxTxt; // Px to World multplication factor
      // hWorldText, hWorldContainer, and hPxTxt are given; get hPxAll
      var hPxAll = Math.ceil(hWorldContainer / kPxToWorld); // hPxAll: height of the whole texture canvas
      // create the canvas for the texture
      var textCanvas = document.createElement("canvas"); // create the canvas for the texture
      var ctx = textCanvas.getContext("2d");
      ctx.font = hPxTxt + "px sans-serif";
      // now get the widths
      var wPxTxt = ctx.measureText(textContent).width; // wPxTxt: width of the text in the texture canvas
      var wWorldTxt = wPxTxt * kPxToWorld; // wWorldTxt: world width of text in the plane
      var wWorldAll = wWorldTxt + (hWorldContainer - hWorldText); // wWorldAll: world width of the whole plane
      var wPxAll = Math.ceil(wWorldAll / kPxToWorld); // wPxAll: width of the whole texture canvas
      // next, resize the texture canvas and fill the text
      textCanvas.width = wPxAll;
      textCanvas.height = hPxAll;
      if (bgcolor != undefined) {
        // fill background if desired (transparent if none)
        ctx.fillStyle = "#" + bgcolor.toString(16).padStart(6, "0");
        ctx.fillRect(0, 0, wPxAll, hPxAll);
      }
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#" + fgcolor.toString(16).padStart(6, "0"); // fgcolor
      ctx.font = hPxTxt + "px sans-serif"; // needed after resize
      ctx.fillText(textContent, wPxAll / 2, hPxAll / 2); // the deed is done
      // next, make the texture
      var texture = new THREE.Texture(textCanvas); // now make texture
      texture.minFilter = THREE.LinearFilter; // eliminate console message
      texture.needsUpdate = true; // duh
      // and make the world plane with the texture
      let geometry = new THREE.PlaneGeometry(wWorldAll, hWorldContainer);
      var material = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        map: texture,
        transparent: true,
        opacity: 1.0,
      });
      // and finally, the mesh
      var mesh = new THREE.Mesh(geometry, material);
      mesh.wWorldTxt = wWorldTxt; // return the width of the text in the plane
      mesh.wWorldAll = wWorldAll; //    and the width of the whole plane
      mesh.wPxTxt = wPxTxt; //    and the width of the text in the texture canvas
      // (the heights of the above items are known)
      mesh.wPxAll = wPxAll; //    and the width of the whole texture canvas
      mesh.hPxAll = hPxAll; //    and the height of the whole texture canvas
      mesh.ctx = ctx; //    and the 2d texture context, for any glitter
      // console.log(wPxTxt, hPxTxt, wPxAll, hPxAll);
      // console.log(wWorldTxt, hWorldText, wWorldAll, hWorldContainer);
      return mesh;
    }
    
    onMount(() => {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        DEFAULT_FOV,
        window.innerWidth / window.innerHeight,
        1,
        100,
      );
      renderer = new THREE.WebGLRenderer();
      controls = new OrbitControls(camera, renderer.domElement);
  
      scene.background = new THREE.Color(0xffffff);
  
      // Disable default controls so we can customize them
      controls.enablePan = false;
      controls.enableZoom = false;
  
      // Pi / 2 moves phi to the horizon to match initial position (instead of down)
      let spherical = new THREE.Spherical(1, Math.PI / 2, 0);
      spherical.makeSafe();
      // @ts-ignore
      camera.position.setFromSpherical(spherical);
  
      // Load video to be annotated.
      video = document.createElement("video");
      video.src = src;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";
  
      // TODO: Decide if we want to keep auto-play.
      video.play();
  
      video.addEventListener("loadedmetadata", () => {
        videoDuration = video.duration;
      });
  
      video.addEventListener("timeupdate", () => {
        videoCurrentTime = video.currentTime;
      });
  
      video.addEventListener("play", () => {
        videoPaused = video.paused;
      });
  
      video.addEventListener("pause", () => {
        videoPaused = video.paused;
      });
      // Create the sphere mesh and material to project the video onto it using a texture.
      const texture = new THREE.VideoTexture(video);
      const geometry = new THREE.SphereGeometry(radius, 48, 32);
      const material = new THREE.MeshBasicMaterial({ map: texture });
      material.side = THREE.BackSide;
  
      // Add the textured sphere to the scene.
      const sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);
  
      // Set up renderer to fill the window
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(renderer.domElement);
  
      document.body.appendChild(VRButton.createButton(renderer));
      renderer.xr.enabled = true;
  
      renderer.setAnimationLoop(function () {
        renderer.render(scene, camera);
      });
  
      // Trigger the scene to render.
      function animate() {
        requestAnimationFrame(animate);
  
        renderer.render(scene, camera);
  
        const session = renderer.xr.getSession();
        if (session) {
          const controllers = session.inputSources;
          // Access controller data (position, buttons) here
          handleInput(controllers);
        }
      }
      animate();
  
      // Handle event listener for window resizing.
      function handleWindowResize() {
        // Recalculate aspect ratio for the perspective camera.
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
  
        // Update renderer size to fill the window.
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
      window.addEventListener("resize", handleWindowResize);
  
      // Handle event listener for custom zooming.
      function handleZoom(e) {
        // Clamp the field of view to prevent zooming in too far or too close.
        camera.fov = THREE.MathUtils.clamp(camera.fov + e.deltaY / 10, MIN_FOV, MAX_FOV);
        zoomLevelAmount = translateFOVToZoomLevel(camera.fov);
        camera.updateProjectionMatrix();
      }
      renderer.domElement.addEventListener("wheel", handleZoom);
    });
  </script>
<style>
    .cursor {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0);
  border: 2px solid black;
}
</style>
  <!-- On Mount this holds the three.JS scene -->
  <div bind:this={container}></div>
  <!-- Used for web interface displayed over the three.JS scene. -->
  <Overlay
    {notes}
    {videoDuration}
    {videoCurrentTime}
    {videoPaused}
    {zoomLevelAmount}
    {addNote}
    {addSnap}
    {clearState}
    {loadDemo}
    {pauseVideo}
    {playVideo}
    {setZoomAmount}
    {removeNote}
    {snapToNote}
    {updateVideoTime}
  />
  <!-- Overlayed on the screen to let the user know where the camera is pointing. -->
  <div class="cursor"></div>
  