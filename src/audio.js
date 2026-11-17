const activeSources = new Set();
function trackSource(source) {
  activeSources.add(source);
  source.addEventListener(
    "ended",
    () => {
      activeSources.delete(source);
      source.disconnect();
    },
    { once: true },
  );
  return source;
}
function silenceSources() {
  for (const source of activeSources) {
    try {
      source.stop();
    } catch {}
    source.disconnect();
  }
  activeSources.clear();
}
function init() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  an = ctx.createAnalyser();
  an.fftSize = 256;
  const cp = ctx.createDynamicsCompressor();
  master.connect(cp);
  cp.connect(an);
  an.connect(ctx.destination);
  fx = ctx.createGain();
  dl = ctx.createDelay(1);
  const fb = ctx.createGain(),
    df = ctx.createBiquadFilter(),
    dw = ctx.createGain();
  fb.gain.value = 0.35;
  df.type = "lowpass";
  df.frequency.value = 3000;
  dw.gain.value = 0.5;
  fx.connect(dl);
  dl.connect(df);
  df.connect(fb);
  fb.connect(dl);
  df.connect(dw);
  dw.connect(master);
  const cv = ctx.createConvolver(),
    n = (ctx.sampleRate * 1.7) | 0,
    ir = ctx.createBuffer(2, n, ctx.sampleRate),
    rg = ctx.createGain();
  rg.gain.value = 0.5;
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < n; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.5);
  }
  cv.buffer = ir;
  fx.connect(cv);
  cv.connect(rg);
  rg.connect(master);
  for (let i = 0; i < L.length; i++) {
    const b = ctx.createGain(),
      s = ctx.createGain();
    b.connect(master);
    b.connect(s);
    s.connect(fx);
    bus.push(b);
    sg.push(s);
  }
  [0.125, 0.25, 0.5].forEach((d) => {
    const N = 32,
      re = new Float32Array(N),
      im = new Float32Array(N);
    for (let k = 1; k < N; k++)
      re[k] = (2 * Math.sin(k * Math.PI * d)) / (k * Math.PI);
    waves[d] = ctx.createPeriodicWave(re, im);
  });
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  setVol();
  setMode();
  setBpm();
}
function setVol() {
  if (master)
    master.gain.setTargetAtTime(
      ($("vol").value / 100) * 0.8,
      ctx.currentTime,
      0.015,
    );
}
function setMode() {
  if (sg.length) sg.forEach((s, i) => (s.gain.value = is16() ? SEND[i] : 0));
}
function setBpm() {
  $("bv").textContent = $("bpm").value;
  if (dl) dl.delayTime.value = (60 / $("bpm").value) * 0.75;
}
function midi(d) {
  const b = 48 + +$("key").value,
    sc = SC[$("scale").value];
  return b + (song.tr || 0) + sc[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);
}
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

/* ---------- voices ---------- */
function voice(ch, f, t, dur, vol, type, duty, att, lpf, vib, det) {
  const o = trackSource(ctx.createOscillator()),
    g = ctx.createGain();
  let out = o;
  if (type == "p") o.setPeriodicWave(waves[duty]);
  else o.type = type;
  o.frequency.value = f;
  if (det) o.detune.value = det;
  if (lpf) {
    const fl = ctx.createBiquadFilter();
    fl.type = "lowpass";
    fl.frequency.value = lpf;
    o.connect(fl);
    out = fl;
  }
  if (vib) {
    const l = trackSource(ctx.createOscillator()),
      lg = ctx.createGain();
    l.frequency.value = 5.5;
    lg.gain.value = vib;
    l.connect(lg);
    lg.connect(o.detune);
    l.start(t);
    l.stop(t + dur + 0.05);
  }
  dur = Math.max(0.01, dur);
  att = Math.min(att || 0.004, dur * 0.5);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + att);
  g.gain.linearRampToValueAtTime(vol * 0.75, t + Math.max(att, dur * 0.7));
  g.gain.linearRampToValueAtTime(0, t + dur);
  out.connect(g);
  g.connect(bus[ch]);
  o.start(t);
  o.stop(t + dur + 0.05);
}
function bell(ch, f, t, dur, vol, r, ix) {
  r = r || 3.5;
  ix = ix || 1.8;
  const c = trackSource(ctx.createOscillator()),
    m = trackSource(ctx.createOscillator()),
    mg = ctx.createGain(),
    g = ctx.createGain();
  c.frequency.value = f;
  m.frequency.value = f * r;
  mg.gain.setValueAtTime(f * ix, t);
  mg.gain.exponentialRampToValueAtTime(1, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  m.connect(mg);
  mg.connect(c.frequency);
  c.connect(g);
  g.connect(bus[ch]);
  c.start(t);
  m.start(t);
  c.stop(t + dur);
  m.stop(t + dur);
}
function nz(t, dur, vol, type, freq, b) {
  const s = trackSource(ctx.createBufferSource()),
    f = ctx.createBiquadFilter(),
    g = ctx.createGain();
  s.buffer = noise;
  f.type = type;
  f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f);
  f.connect(g);
  g.connect(bus[b == null ? 6 : b]);
  s.start(t, Math.random() * 0.5);
  s.stop(t + dur + 0.02);
}
function sweep(t, dur, f0, f1, v, q) {
  const s = trackSource(ctx.createBufferSource()),
    f = ctx.createBiquadFilter(),
    g = ctx.createGain();
  s.buffer = noise;
  s.loop = true;
  f.type = "bandpass";
  f.Q.value = q || 3;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.001, t);
  g.gain.exponentialRampToValueAtTime(v, t + dur * (f1 > f0 ? 0.95 : 0.1));
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f);
  f.connect(g);
  g.connect(bus[10]);
  s.start(t);
  s.stop(t + dur + 0.02);
}
function drop(t, f0, f1, dur, vol) {
  const o = trackSource(ctx.createOscillator()),
    g = ctx.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.8);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g);
  g.connect(bus[6]);
  o.start(t);
  o.stop(t + dur + 0.02);
}
