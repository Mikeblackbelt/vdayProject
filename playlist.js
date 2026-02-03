const audioSources = [
    'music/kalimba-research-notes-cozy-lofi-462748.mp3',
    'music/late-night-lofi-chill-coffee-study-beats-no-copyright-476705.mp3',
    'music/subtle-pixel-glow-462740.mp3',
    'music/Evening-Improvisation-with-Ethera(chosic.com).mp3'
]

async function playRandomAudio() {
    let randomIndex = Math.floor(Math.random() * audioSources.length);
    let selectedSource = audioSources[randomIndex];
    let audio = new Audio(selectedSource);
    audio.play();
    await new Promise(resolve => {
        audio.onended = resolve;
    });
}

//why the FUCK does this not work

export async function startPlaylist() {
    while (true) {
        await playRandomAudio();
    }
}

startPlaylist()

//fuck yes it works
