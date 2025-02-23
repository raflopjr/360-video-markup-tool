<script>
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
  import { VRButton } from 'three/addons/webxr/VRButton.js';

  import Overlay from './lib/Overlay.svelte';
  import { createVideoPlayer } from './lib/VideoPlayerUtils.js';

  let container;
  let scene, camera, renderer, controls;

  // Radius of the sphere to project the video onto (May need to update for VR).
  const radius = 30;

  let video;
  let videoDuration = 0;
  let videoCurrentTime = 0;
  let videoPaused = true;

  let notes = [];

  function playVideo() {
    video.play();
    videoPaused = video.paused;
  }

  function pauseVideo() {
    video.pause();
    videoPaused = video.paused;
  }

  function updateVideoTime(time) {
    video.currentTime = time;
  }

  function createText(txt, hWorldTxt, hWorldAll, hPxTxt, fgcolor, bgcolor) { // the routine
    // txt is the text.
    // hWorldTxt is world height of text in the plane.
    // hWorldAll is world height of whole rectangle containing the text.
    // hPxTxt is px height of text in the texture canvas; larger gives sharper text.
    // The plane and texture canvas are created wide enough to hold the text.
    // And wider if hWorldAll/hWorldTxt > 1 which indicates padding is desired.
    var kPxToWorld = hWorldTxt/hPxTxt;                // Px to World multplication factor
    // hWorldTxt, hWorldAll, and hPxTxt are given; get hPxAll
    var hPxAll = Math.ceil(hWorldAll/kPxToWorld);     // hPxAll: height of the whole texture canvas
    // create the canvas for the texture
    var txtcanvas = document.createElement("canvas"); // create the canvas for the texture
    var ctx = txtcanvas.getContext("2d");
    ctx.font = hPxTxt + "px sans-serif";        
    // now get the widths
    var wPxTxt = ctx.measureText(txt).width;         // wPxTxt: width of the text in the texture canvas
    var wWorldTxt = wPxTxt*kPxToWorld;               // wWorldTxt: world width of text in the plane
    var wWorldAll = wWorldTxt+(hWorldAll-hWorldTxt); // wWorldAll: world width of the whole plane
    var wPxAll = Math.ceil(wWorldAll/kPxToWorld);    // wPxAll: width of the whole texture canvas
    // next, resize the texture canvas and fill the text
    txtcanvas.width =  wPxAll;
    txtcanvas.height = hPxAll;
    if (bgcolor != undefined) { // fill background if desired (transparent if none)
      ctx.fillStyle = "#" + bgcolor.toString(16).padStart(6, '0');
      ctx.fillRect( 0,0, wPxAll,hPxAll);
    } 
    ctx.textAlign = "center";
    ctx.textBaseline = "middle"; 
    ctx.fillStyle = "#" + fgcolor.toString(16).padStart(6, '0'); // fgcolor
    ctx.font = hPxTxt + "px sans-serif";   // needed after resize
    ctx.fillText(txt, wPxAll/2, hPxAll/2); // the deed is done
    // next, make the texture
    var texture = new THREE.Texture(txtcanvas); // now make texture
    texture.minFilter = THREE.LinearFilter;     // eliminate console message
    texture.needsUpdate = true;                 // duh
    // and make the world plane with the texture
    let geometry = new THREE.PlaneGeometry(wWorldAll, hWorldAll);
    var material = new THREE.MeshBasicMaterial( 
      { side:THREE.DoubleSide, map:texture, transparent:true, opacity:1.0 } );
    // and finally, the mesh
    var mesh = new THREE.Mesh(geometry, material);
    mesh.wWorldTxt = wWorldTxt; // return the width of the text in the plane
    mesh.wWorldAll = wWorldAll; //    and the width of the whole plane
    mesh.wPxTxt = wPxTxt;       //    and the width of the text in the texture canvas
                                // (the heights of the above items are known)
    mesh.wPxAll = wPxAll;       //    and the width of the whole texture canvas
    mesh.hPxAll = hPxAll;       //    and the height of the whole texture canvas
    mesh.ctx = ctx;             //    and the 2d texture context, for any glitter
    // console.log(wPxTxt, hPxTxt, wPxAll, hPxAll);
    // console.log(wWorldTxt, hWorldTxt, wWorldAll, hWorldAll);
    return mesh;
  }

  function addNote(time, noteContent) {
      let textContainerMesh = createText(noteContent, 1, 5, 200, 0x000000, 0xcccccc); // text #1, Hello, world
      scene.add(textContainerMesh);

      // Create new vector to shoot in the direcion of the viewer.
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      
      // Scale position within the viewing sphere, then set the position of the text container.
      direction.multiplyScalar(radius * 0.5);
      textContainerMesh.position.set(
        direction.x,
        direction.y,
        direction.z
      );

      // We want to make sure the viewer is seeing the plane head on for readability.
      textContainerMesh.lookAt(0, 0, 0);
      textContainerMesh.doubleSided = true;

      scene.add(textContainerMesh);

      notes.push({ time, noteContent, mesh: textContainerMesh });

  }

  onMount(() => {
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100)
    renderer = new THREE.WebGLRenderer()
    controls = new OrbitControls(camera, renderer.domElement)

    scene.background = new THREE.Color(0xffffff)

    // Disable default controls so we can customize them
    controls.enablePan = false
    controls.enableZoom = false

    // Pi / 2 moves phi to the horizon to match initial position (instead of down)
    let spherical = new THREE.Spherical(1, Math.PI / 2, 0)
    spherical.makeSafe()
    // @ts-ignore
    camera.position.setFromSpherical(spherical)


    video = createVideoPlayer('https://s.bepro11.com/vr-video-sample.mp4', videoDuration, videoCurrentTime, videoPaused);

    // Create the sphere mesh and material to project the video onto it using a texture.
    const texture = new THREE.VideoTexture(video)
    const geometry = new THREE.SphereGeometry(radius, 48, 32)
    const material = new THREE.MeshBasicMaterial({ map: texture })
    material.side = THREE.BackSide

    // Add the textured sphere to the scene.
    const sphere = new THREE.Mesh(geometry, material)
    scene.add(sphere)

    // Set up renderer to fill the window
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    document.body.appendChild( VRButton.createButton( renderer ) );
    renderer.xr.enabled = true;

    renderer.setAnimationLoop( function () {
      renderer.render( scene, camera );
    } );

    // Trigger the scene to render.
    function animate() {
      requestAnimationFrame(animate)

      renderer.render(scene, camera)

      const session = renderer.xr.getSession();
      if (session) {
          const controllers = session.inputSources;
          // Access controller data (position, buttons) here
      }
    }
    animate()


    // Handle event listener for window resizing.
    function handleWindowResize() {
      // Recalculate aspect ratio for the perspective camera.
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()

      // Update renderer size to fill the window.
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleWindowResize)

    // Handle event listener for custom zooming.
    function handleZoom(e) {
      // Clamp the field of view to prevent zooming in too far or too close.
      camera.fov = THREE.MathUtils.clamp(camera.fov + e.deltaY / 10, 10, 100)
      camera.updateProjectionMatrix()
    }
    renderer.domElement.addEventListener('wheel', handleZoom)
  });
</script>

<div bind:this={container} ></div>
<Overlay 
  {videoDuration} 
  {videoCurrentTime} 
  {videoPaused} 
  {playVideo} 
  {pauseVideo} 
  {updateVideoTime}
  {addNote}
/>
