<script>
  export let text = "Overlay Text";
  export let videoDuration;
  export let videoCurrentTime;
  export let videoPaused;
  export let playVideo;
  export let pauseVideo;
  export let updateVideoTime;
  export let addNote;

  function handleAddNote() {
    pauseVideo();

    // Spawn text box for user to input note.
    const note = prompt("Enter note:");
    if (note) {
      addNote(videoCurrentTime, note);
    }
  }

</script>

<style>
  .overlay {
    position: absolute;
    color: black;
    font-size: 24px;
    z-index: 10;
  }

  .top-right {
    top: 10px;
    right: 10px;
  }

  /* .top-left {
    top: 10px;
    left: 10px;
  }
  
  .bottom-left {
    bottom: 10px;
    left: 10px;
  }
  .bottom-right {
    bottom: 10px;
    right: 10px;
  }
  .center {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .north {
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
  }
  .east {
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
  }
  .west {
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
  } */

  .add-note-button {
    margin: 10px;
    font-size: x-large;
  }

  .south {
    bottom: 65px;
    left: 50%;
    transform: translateX(-50%);
    width: 100vw;
    display: flex;
    justify-content: center;

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
    background-color: green;
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
</style>

<div class="overlay top-left">
  <button on:click={handleAddNote} class="add-note-button">Add Note</button>
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
      <div class="progress-bar" style={`width:${videoCurrentTime / videoDuration * 100}%`} />
    </div>

    {#if videoPaused}
      <button on:click={playVideo} class="play-pause-button">⏵</button>
    
    {:else}
      <button on:click={pauseVideo} class="play-pause-button">⏸</button>
    {/if}

    <div class="time-display">
      <span><!-- Convert current and total time from decimal to MM:SS format. -->
        { String(Math.floor(videoCurrentTime / 60)).padStart(2, '0') }:{ String(Math.floor(videoCurrentTime % 60)).padStart(2, '0') } / { String(Math.floor(videoDuration / 60)).padStart(2, '0') }:{ String(Math.floor(videoDuration % 60)).padStart(2, '0') }</span>
    </div>
  </div>
</div>
