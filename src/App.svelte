<script>
  import VideoPlayer from "./lib/VideoPlayer.svelte";

  // On app load determine if we passed any value in a "demo"
  // query parameter to load the demo on init.
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const demo = urlParams.get('demo');
</script>

<VideoPlayer isDemo={demo}></VideoPlayer>
