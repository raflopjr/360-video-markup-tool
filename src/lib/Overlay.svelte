<script>
  export let videoDuration;
  export let videoCurrentTime;
  export let videoPaused;
  export let zoomLevelAmount;
  export let notes;

  export let addNote;
  export let addSnap;
  export let clearState;
  export let loadDemo;
  export let pauseVideo;
  export let playVideo;
  export let removeNote;
  export let setZoomAmount;
  export let snapToNote;
  export let updateVideoTime;

  const ZOOM_STEP = 0.1;

  function handleAddNote() {
    pauseVideo();

    // Spawn text box for user to input note.
    const note = prompt("This will add a note at the current cursor position.\n\nNote Text:");
    if (note) {
      notes = addNote(videoCurrentTime, note);
    }
  }

  function handleAddSnap() {
    pauseVideo();

    // Spawn text box for user to input note.
    const confirmed = confirm("This will add a keyframe to pan to the current cursor position.\n\nClick Ok to confirm.");
    if (confirmed) {
      notes = addSnap(videoCurrentTime);
    }
  }

  function handleClear() {
    clearState();
  }

  function handleLoadDemo() {
    loadDemo();
  }

  function handleZoomSlider(event) {
    let desiredZoomLevel = event.target.value;
    setZoomAmount(desiredZoomLevel);
  }

  function handleZoomIn() {
    setZoomAmount(zoomLevelAmount + ZOOM_STEP);
  }

  function handleZoomOut() {
    setZoomAmount(zoomLevelAmount - ZOOM_STEP);
  }

  function handleKeyframeClick(event) {
    snapToNote(notes[event.target.getAttribute("data-id")]);
  }

  function handleKeyframeRemove(event) {
    const noteId = event.target.getAttribute("data-id");
    notes = removeNote(noteId);
  }

</script>

<style>
  .overlay {
    position: absolute;
    color: black;
    font-size: 24px;
    z-index: 10;
  }

  .base-button {
    margin: 10px;
    font-size: x-large;
  }

  .add-note-button {
    background-color: brown;
    color: white;
  }

  .add-snap-button {
    background-color: cadetblue;
    color: white;
  }

  .south {
    bottom: 65px;
    left: 50%;
    transform: translateX(-50%);
    width: 100vw;
    display: flex;
    justify-content: center;

  }

   .bottom {
    bottom: 20px;
    width: 100%;
    display: flex;
    justify-content: space-between;
  }

  .bottom-ui-container {
    width: 98%;
  }
  
  .progress-bar-container {
    height: 10px;
    background-color: lightgray;
    cursor: pointer;
  }

  .progress-bar {
    height: 100%;
    background-color: gray;
  }

  .play-pause-button {
    vertical-align: top;
    font-size: 2em;
    background-color: transparent;
    border: none;
    padding: 0px 0px;
  }

  .time-display {
    padding-top: 0.2em;
    padding-left: 0.2em;
    display: inline-block;
    margin: 0px 0px;
    height: 100%;
    font-size: 1.5em;
  }

  .zoom-level-slider {
    writing-mode: vertical-rl;
    direction: rtl;
    appearance: slider-vertical;
    /* width: 16px; */
    vertical-align: bottom;
  }

  .zoom-button {
    display: block;
    background: none;
    border: none;
    font-size: 1em;
    padding: 0px;
    cursor: pointer;
  }

  .zoom-ui-container {
    padding-left: 1em;
  }

  .note-keyframe {
    width: 25px;
    height: 25px;
    border-radius: 50%;
    transform: translate(-25%, -25%);
  }

  .note-keyframe:hover {
    width: 25px;
    height: 25px;
    border-radius: 50%;
  }

  .note-keyframe:hover .note-keyframe-remove {
    display: block;
  }

  /* Default state of remove button while not hovered is hidden. */
  .note-keyframe-remove {
    display: none;
    color: red;
    width: 25px;
    height: 25px;
    font-size: 1.5em;
    transform: translate(-5%, -150%);
  }
</style>

<div class="overlay top-left">
  <button on:click={handleAddNote} class="add-note-button base-button">Add Note</button>
  <button on:click={handleAddSnap} class="add-snap-button base-button">Add Snap-To-Position</button>
  <div class="zoom-ui-container">
    <button on:click={handleZoomIn} class="zoom-button">🔍+</button>
    <input class="zoom-level-slider" on:change={handleZoomSlider}
      type="range"
      id="zoomLevel"
      name="zoomLevel"
      value={zoomLevelAmount}
      min="0"
      max="1"
      step="any" />
      <button on:click={handleZoomOut} class="zoom-button">🔍-</button>
  </div>

</div>

<div class="overlay south">
  <div class="bottom-ui-container">
    <div class="progress-bar-container" on:click={(event) => {
      // Get container size
      const rect = event.currentTarget.getBoundingClientRect();
      // Calculate the click position relative to the container
      const clickX = event.clientX - rect.left;
      // Calculate the new time based on the click position
      const progress = (clickX / rect.width);
      const newTime =  progress * videoDuration;
      // Update the video current time here
      updateVideoTime(newTime);
    }}>
      {#each notes as note, index}
          <div class="note-keyframe" title="Jump to this keyframe."
            style={`position: absolute; left: ${note.time / videoDuration * 100}%; background-color: ${note.keyframeColor}`}
            on:click={handleKeyframeClick}
            data-id={index}
            ><div class="note-keyframe-remove" on:click={handleKeyframeRemove} data-id={index} title="Remove the keyframe.">
            &#x2716;
            </div>
        </div>
      {/each}
      <div class="progress-bar" style={`width:${videoCurrentTime / videoDuration * 100}%`} />
    </div>

    {#if videoPaused}
      <button on:click={playVideo} class="play-pause-button">&#x23F5;</button>
    
    {:else}
      <button on:click={pauseVideo} class="play-pause-button">&#x23F8;</button>
    {/if}

    <div class="time-display">
      <span><!-- Convert current and total time from decimal to MM:SS format. -->
        { String(Math.floor(videoCurrentTime / 60)).padStart(2, '0') }:{ String(Math.floor(videoCurrentTime % 60)).padStart(2, '0') } / { String(Math.floor(videoDuration / 60)).padStart(2, '0') }:{ String(Math.floor(videoDuration % 60)).padStart(2, '0') }</span>
    </div>
  </div>
</div>

<div class="overlay bottom">
    <button class="base-button" style="margin-left: 10px;" on:click={handleClear}>Clear All</button>
    <button class="base-button" style="margin-right: 10px;" on:click={handleLoadDemo}>Load Demo</button>
</div>
