export function createVideoPlayer(videoUrl, videoDuration, videoCurrentTime, videoPaused) {
  // Load video to be annotated.
  let src = videoUrl;
  let video = document.createElement('video')
  video.src = src
  video.loop = true
  video.muted = true
  video.playsInline = true
  video.crossOrigin = 'anonymous'

  // TODO: Decide if we want to keep auto-play.
  video.play()

  video.addEventListener('loadedmetadata', () => {
    videoDuration = video.duration;
  });

  video.addEventListener('timeupdate', () => {
    videoCurrentTime = video.currentTime;
  });

  video.addEventListener('play', () => {
    videoPaused = video.paused;
  });

  video.addEventListener('pause', () => {
    videoPaused = video.paused;
  });

  return video;
}