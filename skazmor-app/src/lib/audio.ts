// Simple sound manager
// const sounds: Record<string, HTMLAudioElement> = {
    // We don't have files yet, but structure is here
    // click: new Audio('/sfx/click.mp3'),
    // coin: new Audio('/sfx/coin.mp3'),
// };

export const playSound = (name: string) => {
    // const s = sounds[name];
    // if (s) {
    //     s.currentTime = 0;
    //     s.play().catch(() => {});
    // }
    console.log(`[Audio] Playing ${name}`);
};

