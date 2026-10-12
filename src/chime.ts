// Browsers block audio until a user gesture, so the Till has an "Open till" button that
// creates the AudioContext. Two short sine notes: the cash register "ding ding".
let ctx: AudioContext | null = null;

export function unlockAudio() {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
}

export function chime() {
  if (!ctx) return;
  const now = ctx.currentTime;
  [880, 1318.5].forEach((freq, i) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.3, now + i * 0.12 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.5);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.55);
  });
}
