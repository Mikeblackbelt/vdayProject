const audioSources = [
    'https://raw.githubusercontent.com/Mikeblackbelt/vdayProject/main/music/kalimba-research-notes-cozy-lofi-462748.mp3',
    'https://raw.githubusercontent.com/Mikeblackbelt/vdayProject/main/music/late-night-lofi-chill-coffee-study-beats-no-copyright-476705.mp3',
    'https://raw.githubusercontent.com/Mikeblackbelt/vdayProject/main/music/subtle-pixel-glow-462740.mp3',
    'https://raw.githubusercontent.com/Mikeblackbelt/vdayProject/main/music/kalimba-research-notes-cozy-lofi-462748.mp3'
];
let currentAudio = new Audio();
currentAudio.volume = 0.6;
let playing = false;

function playNext() {
    if (!playing) return;
    const randomIndex = Math.floor(Math.random() * audioSources.length);
    currentAudio.src = audioSources[randomIndex];
    currentAudio.play();
    currentAudio.onended = () => {
        if (playing) playNext(); // Only continue if still playing
    };
}

export function startPlaylist() {
    if (playing) return;
    playing = true;
    playNext();
}

export function stopPlaylist() {
    playing = false;       // prevents the next song from auto-playing
    if (currentAudio) {
        console.log('Stopping playlist, pausing current audio');
        currentAudio.pause();
        document.querySelectorAll('audio').forEach(audio => audio.pause()); // Pause all audio elements
        currentAudio.currentTime = 0;
    }
}

export {currentAudio};