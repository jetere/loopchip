/* ---------- sequencer ---------- */
function layerOn(i, reps) {
  if (muted[i] || (!is16() && L[i][2])) return false;
  if (i == 10) return true;
  if (!$("build").checked) return true;
  let thr = L[i][1];
  if (i == 0) thr = cur.leadFrom ? 0.34 : 0;
  if (thr > 0) {
    if (cur.en == 2) thr = Math.max(0, thr - 0.35);
    else if (cur.en == 0) thr = Math.min(1, thr + 0.15);
  }
  const tt = reps <= 1 ? 1 : (loop - 1) / (reps - 1);
  return tt >= thr - 1e-6;
}
function playStep(s, t) {
  const sd = 60 / +$("bpm").value / 4,
    pos = s % 64,
    bar = pos >> 4,
    sb = pos & 15,
    vary = $("vary").checked;
  if (pos == 0) {
    if (!cur) {
      cur = gen(null);
      cur.reps = 2 + ((rng() * 5) | 0);
      nxt = gen(cur);
      loop = 1;
    } else {
      const r = vary ? cur.reps : Math.max(1, +$("reps").value || 4);
      loop++;
      if (force || loop > r) {
        cur = nxt;
        cur.reps = 2 + ((rng() * 5) | 0);
        nxt = gen(cur);
        loop = 1;
        force = false;
        nz(t, 0.9, 0.3, "highpass", 5000);
      }
    }
  }
  const reps = vary ? cur.reps : Math.max(1, +$("reps").value || 4),
    c = cur.prog[bar],
    sx = is16();
  for (let i = 0; i < L.length; i++) act[i] = layerOn(i, reps);
  const K = song.ds.kit,
    fill = loop >= reps && bar == 3 && cur.dr.k.length && P().drum > 0,
    m = cur.mel[pos];
  if (act[0] && m) {
    const ld = song.ds.lead;
    voice(
      0,
      hz(midi(m.d)),
      t,
      m.len * sd * ld.gate,
      0.2,
      ld.w || "p",
      cur.duty,
      ld.att,
      ld.w ? 2600 : 0,
      sx && m.len >= 3 ? ld.vib : 0,
    );
  }
  if (act[1] && m) {
    const hm = song.ds.harm;
    voice(
      1,
      hz(midi(m.d + cur.hoff)),
      t,
      m.len * sd * 0.9,
      hm.vol,
      hm.w,
      cur.duty == 0.5 ? 0.25 : 0.5,
      0.01,
      hm.lp,
      8,
    );
  }
  const r = cur.arpRate;
  if (act[2] && sb % r == 0) {
    const ch = [c, c + 2, c + 4, c + 7];
    const z = song.ds.arp;
    voice(
      2,
      hz(midi(ch[cur.arp[((pos / r) | 0) % cur.arp.length]] + z.oct)),
      t,
      sd * r * z.gate,
      z.vol,
      z.w,
      z.duty,
      0.004,
      z.lp,
    );
  }
  if (act[3]) {
    const ps = song.pad,
      st = ps.style,
      tn = [c, c + 2, c + 4]
        .concat(cur.seventh ? [c + 6] : [])
        .map(
          (x, i) =>
            x + (ps.v == 1 && i == 1 ? 7 : 0) + (ps.v == 2 && i == 0 ? 7 : 0),
        ),
      v = cur.en == 2 ? 0.05 : 0.036;
    const pl = (ns, dur, att) =>
      ns.forEach((x) =>
        [-7, 7].forEach((dt) =>
          voice(3, hz(midi(x)), t, dur, v, ps.wave, 0, att, ps.lp, 0, dt),
        ),
      );
    if (st == 0 && sb == 0) pl(tn, 16 * sd, 0.4);
    else if (st == 1 && sb % 8 == 0) pl(tn, 6 * sd, 0.03);
    else if (st == 2 && sb % 2 == 1) pl(tn, 1.2 * sd, 0.01);
    else if (st == 3 && sb == 0) pl(tn, 16 * sd, sd * 8);
    else if (st == 4 && sb % 4 == 0)
      pl([tn[(sb >> 2) % tn.length]], 4 * sd, 0.02);
  }
  if (act[8] && (sb == 0 || (sb == 8 && !song.ds.str.one))) {
    const z = song.ds.str;
    [5, -5].forEach((dt) =>
      voice(
        8,
        hz(midi(c + z.tones[sb ? 1 : 0])),
        t,
        (z.one ? 16 : 8) * sd,
        0.045,
        z.w,
        0,
        z.att,
        z.lp,
        z.vib,
        dt,
      ),
    );
  }
  if (act[9]) {
    const pi = cur.pk.indexOf(sb),
      z = song.ds.pl;
    if (pi >= 0)
      voice(
        9,
        hz(midi(c + z.seq[pi % 3] + z.oct)),
        t,
        sd * z.len,
        0.1,
        z.w,
        z.duty,
        0.002,
        z.lp,
      );
  }
  if (act[10]) {
    const z = song.ds.fx;
    if (loop >= reps && bar == 3 && sb == (z.half ? 8 : 0))
      sweep(t, (z.half ? 8 : 16) * sd, z.f0, z.f1, 0.35, z.q);
    if (pos == 0 && loop == 1 && cur.k > 0)
      sweep(t, 6 * sd, z.f1, z.f0, 0.25, z.q);
  }
  const bm = cur.bl[pos];
  if (act[4] && bm) {
    const f = hz(midi(bm.d)),
      bd = bm.len * sd * 0.92,
      bt = song.bt;
    if (sx) {
      if (bt.w == "p") voice(4, f, t, bd, 0.4, "p", 0.25, 0.004, bt.lp);
      else voice(4, f, t, bd, 0.33, bt.w, 0, 0.004, bt.lp);
      if (bt.sub) voice(4, f, t, bd, 0.25, "sine");
    } else voice(4, f, t, bd, 0.45, "triangle");
  }
  if (act[5] && cur.bell.includes(sb)) {
    const ch = [c, c + 2, c + 4, c + 7];
    const b = song.ds.bell;
    bell(
      5,
      hz(midi(ch[(sb >> 1) % 4] + b.oct)),
      t,
      sd * b.dec,
      0.1,
      b.ratio,
      b.idx,
    );
  }
  const d = cur.dr;
  if (act[6]) {
    if (fill && sb >= 12) {
      if (sx) drop(t, [260, 210, 160, 120][sb - 12], 70, 0.18, 0.7);
      else nz(t, 0.08, 0.4, "bandpass", 1800);
      if (sb == 12 || sb == 14) nz(t, 0.12, 0.35, "bandpass", 1800);
      if (sb == 12) drop(t, 150, 40, 0.16, 0.9);
    } else {
      if (d.k[sb]) {
        drop(t, K.f0, K.f1, K.d, 0.9);
        if (sx) nz(t, 0.01, 0.2, "highpass", 3000);
      }
      if (d.s[sb]) {
        nz(t, K.sd, 0.35, "bandpass", K.sf);
        if (sx) drop(t, K.bf, 120, 0.07, 0.35);
      }
      if (d.h[sb])
        nz(
          t,
          sb % 4 == 2 ? K.ho : K.hc,
          sb % 4 == 0 ? 0.16 : 0.1,
          "highpass",
          K.hf,
        );
    }
  }
  if (act[7]) {
    if (d.s[sb]) nz(t, 0.1, 0.22, "bandpass", K.cf, 7);
    if (sb % 2 == 1) nz(t, 0.03, 0.07, "highpass", K.shf, 7);
    if (cur.en == 2 && sb % 4 == 0) nz(t, 0.3, 0.08, "highpass", K.rf, 7);
  }
  ev.push({ t, pos, bar, sec: cur, loop, reps, act: act.slice() });
}
function sched() {
  if (!playing || ctx.state !== "running") return;
  if (nextT < ctx.currentTime - 0.1) nextT = ctx.currentTime + 0.02;
  while (nextT < ctx.currentTime + 0.1) {
    const sd = 60 / +$("bpm").value / 4;
    playStep(step, nextT + (step & 1 ? P().swing * sd : 0));
    nextT += sd;
    step++;
  }
}
function restart() {
  clearInterval(timer);
  silenceSources();
  {
    const sd = (Number($("seed").value) || 0) >>> 0;
    rng = mul(Math.imul(sd, 2654435761) ^ 0x9e3779b9);
    for (let i = 0; i < 8; i++) rng();
  }
  initSong();
  cur = nxt = null;
  step = 0;
  ev = [];
  loop = 0;
  force = false;
  nextT = ctx.currentTime + 0.08;
  timer = setInterval(sched, 25);
  sched();
}
async function start() {
  if (starting) return;
  starting = true;
  $("play").disabled = true;
  try {
    if (!ctx) init();
    await ctx.resume();
    playing = true;
    restart();
    $("play").textContent = "■ STOP";
    $("status").textContent = "";
  } catch (error) {
    stop();
    $("status").textContent = "Audio could not start. Please try again.";
    console.error(error);
  } finally {
    starting = false;
    $("play").disabled = false;
  }
}
function stop() {
  clearInterval(timer);
  playing = false;
  ev = [];
  silenceSources();
  $("play").textContent = "▶ PLAY";
  // Discard delay/reverb tails as well as voices before the next playback.
  if (ctx) void ctx.close();
  ctx = master = an = noise = fx = dl = undefined;
  bus = [];
  sg = [];
  waves = {};
}
$("play").onclick = () => (playing ? stop() : start());
$("skip").onclick = () => {
  force = true;
};
$("reroll").onclick = () => {
  if (cur) nxt = gen(cur, true);
};
$("rs").onclick = () => {
  $("seed").value = (Math.random() * 99999) | 0;
  if (playing) restart();
};
$("seed").oninput = () => {
  if (playing) restart();
};
$("vol").oninput = setVol;
$("mode").onchange = setMode;
$("bpm").oninput = setBpm;
["cprog", "cdens", "cdrum", "cswing", "cbass", "cwave", "carp"].forEach(
  (id) =>
    ($(id).onchange = () => {
      if (playing) restart();
    }),
);
["key", "scale"].forEach(
  (id) =>
    ($(id).onchange = () => {
      if (playing) restart();
    }),
);
$("reps").onchange = () => {
  $("reps").value = Math.max(
    1,
    Math.min(32, Math.round(Number($("reps").value) || 4)),
  );
};
window.addEventListener("pagehide", stop);
applyMood("adventure");
