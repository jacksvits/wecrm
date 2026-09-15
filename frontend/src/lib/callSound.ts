// Генерация сигналов звонка через WebAudio: не требует аудиофайлов,
// работает в любых браузерах. Входящий — классический двухтоновый вызов
// (440+480 Гц, 1 с звоним / 2 с пауза), исходящий — короткие гудки ожидания.

let audioCtx: AudioContext | null = null;
let nodes: { oscs: OscillatorNode[]; gain: GainNode; gainValue: number } | null = null;
let patternTimer: ReturnType<typeof setInterval> | null = null;

function ensureCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function tone(freqs: number[], gainValue: number) {
  const ctx = ensureCtx();
  const gain = ctx.createGain();
  gain.gain.value = 0; // старт без щелчка, уровень выставляется паттерном
  gain.connect(ctx.destination);
  const oscs = freqs.map((f) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    osc.connect(gain);
    osc.start();
    return osc;
  });
  return { oscs, gain, gainValue };
}

export function startRingtone(mode: 'incoming' | 'outgoing') {
  stopRingtone();
  if (mode === 'incoming') {
    // Классический ритм вызова: 1 с звоним, 2 с тишина
    let active = false;
    const cycle = () => {
      if (nodes) {
        const t = audioCtx!.currentTime;
        if (active) {
          nodes.gain.gain.setTargetAtTime(0, t, 0.02);
        } else {
          nodes.gain.gain.setTargetAtTime(nodes.gainValue, t, 0.02);
        }
      }
      active = !active;
    };
    nodes = tone([440, 480], 0.08);
    cycle();
    patternTimer = setInterval(cycle, 1000);
  } else {
    // Гудок ожидания ответа: короткий сигнал каждые 3 с
    nodes = tone([425], 0.05);
    const beep = () => {
      if (!nodes || !audioCtx) return;
      const t = audioCtx.currentTime;
      nodes.gain.gain.setValueAtTime(nodes.gainValue, t);
      nodes.gain.gain.setTargetAtTime(0, t + 0.15, 0.03);
    };
    beep();
    patternTimer = setInterval(beep, 3000);
  }
}

export function stopRingtone() {
  if (patternTimer) {
    clearInterval(patternTimer);
    patternTimer = null;
  }
  if (nodes) {
    const { oscs, gain } = nodes;
    nodes = null;
    try {
      gain.gain.setTargetAtTime(0, audioCtx!.currentTime, 0.02);
      setTimeout(() => {
        oscs.forEach((o) => { try { o.stop(); } catch { /* уже остановлен */ } });
        try { gain.disconnect(); } catch { /* уже отключён */ }
      }, 150);
    } catch { /* контекст мог быть закрыт */ }
  }
}
