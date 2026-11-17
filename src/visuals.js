/* ---------- visuals ---------- */
const cv = $("cv"),
  g = cv.getContext("2d"),
  W = 640,
  H = 220,
  css = (n) =>
    getComputedStyle(document.documentElement).getPropertyValue(n).trim();
let main = 0,
  CL = {},
  waveform = new Uint8Array(256);
const thumbs = L.map((l, i) => {
  const c = document.createElement("canvas");
  c.width = 160;
  c.height = 52;
  c.onclick = () => setMain(i);
  c.tabIndex = 0;
  c.setAttribute("role", "button");
  c.setAttribute("aria-label", "Show " + l[0]);
  c.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setMain(i);
    }
  };
  $("thumbs").appendChild(c);
  return { c, g: c.getContext("2d") };
});
function setMain(i) {
  main = i;
  thumbs.forEach((t, j) => (t.c.style.display = j == i ? "none" : ""));
}
setMain(0);
function lay(s, i) {
  if (s._v) return s._v[i];
  const m = [],
    h = [],
    ar = [],
    pd = [],
    bs = [],
    bl = [],
    dk = [],
    pc = [];
  for (let p = 0; p < 64; p++) {
    const n = s.mel[p];
    if (n) {
      m.push({ st: p, d: n.d, len: n.len });
      h.push({ st: p, d: n.d + s.hoff, len: n.len });
    }
  }
  for (let b = 0; b < 4; b++) {
    const c = s.prog[b],
      ch = [c, c + 2, c + 4, c + 7],
      r = s.arpRate,
      x = s.bassStyle;
    const tn = [c, c + 2, c + 4].concat(s.seventh ? [c + 6] : []),
      ps = song.pad || { style: 0 };
    tn.forEach((d, i) => {
      const z = ps.style;
      if (z == 0 || z == 3) pd.push({ st: b * 16, d, len: 16 });
      else if (z == 1)
        [0, 8].forEach((o) => pd.push({ st: b * 16 + o, d, len: 6 }));
      else if (z == 2) {
        for (let o = 1; o < 16; o += 2) pd.push({ st: b * 16 + o, d, len: 1 });
      } else
        for (let o = 0; o < 16; o += 4)
          if ((o >> 2) % tn.length == i) pd.push({ st: b * 16 + o, d, len: 4 });
    });
    for (let sb = 0; sb < 16; sb++) {
      const st = b * 16 + sb;
      let bn = 0;
      if (sb % r == 0)
        ar.push({
          st,
          d: ch[s.arp[((st / r) | 0) % s.arp.length]] + song.ds.arp.oct,
          len: r,
        });
      if ((x == "eighth" || x == "octave") && sb % 2 == 0) bn = 2;
      else if (x == "sync" && [0, 3, 6, 8, 11, 14].includes(sb)) bn = 2;
      else if (x == "long" && sb % 8 == 0) bn = 8;
      if (bn)
        bs.push({
          st,
          d: c - 7 + (x == "octave" && sb % 4 == 2 ? 7 : 0),
          len: bn,
        });
      if (s.bell.includes(sb))
        bl.push({ st, d: ch[(sb >> 1) % 4] + song.ds.bell.oct, len: 4 });
      if (s.dr.k[sb]) dk.push({ st, row: 0 });
      if (s.dr.s[sb]) dk.push({ st, row: 1 });
      if (s.dr.h[sb]) dk.push({ st, row: 2 });
      if (s.dr.s[sb]) pc.push({ st, row: 0 });
      if (sb % 2 == 1) pc.push({ st, row: 1 });
      if (s.en == 2 && sb % 4 == 0) pc.push({ st, row: 2 });
    }
  }
  const sr = [],
    pk = [];
  for (let b = 0; b < 4; b++) {
    const c = s.prog[b],
      tn = [c, c + 2, c + 4];
    const z = song.ds.str;
    sr.push({ st: b * 16, d: c + z.tones[0], len: z.one ? 16 : 8 });
    if (!z.one) sr.push({ st: b * 16 + 8, d: c + z.tones[1], len: 8 });
    const y = song.ds.pl;
    s.pk.forEach((o, i) =>
      pk.push({ st: b * 16 + o, d: c + y.seq[i % 3] + y.oct, len: y.len }),
    );
  }
  s._v = [
    m,
    h,
    ar,
    pd,
    s.bl.map((n, i) => n && { st: i, d: n.d, len: n.len }).filter(Boolean),
    bl,
    dk,
    pc,
    sr,
    pk,
    [{ st: 48, d: 1, len: 16 }],
  ];
  return s._v[i];
}
function view(c, w, h, i, s, ph, on, big) {
  const d = lay(s, i),
    col = [
      CL.c1,
      CL.c2,
      CL.c3,
      CL.c1,
      CL.c2,
      CL.c3,
      CL.c3,
      CL.c2,
      CL.c1,
      CL.c3,
      CL.acc,
    ][i],
    cw = w / 64;
  c.save();
  c.globalAlpha = on ? 1 : 0.3;
  if (i == 6 || i == 7) {
    const rh = h / 3;
    d.forEach((n) => {
      c.fillStyle = n.st == ph ? CL.acc : col;
      c.fillRect(n.st * cw, n.row * rh + 2, Math.max(cw - 1, 2), rh - 4);
    });
  } else if (d.length) {
    let lo = 1e9,
      hi = -1e9;
    d.forEach((n) => {
      lo = Math.min(lo, n.d);
      hi = Math.max(hi, n.d);
    });
    const sp = Math.max(hi - lo, 4),
      bh = Math.max(3, (h / (sp + 3)) * (big ? 0.6 : 0.8));
    d.forEach((n) => {
      const y = h - ((n.d - lo + 1) / (sp + 2)) * h;
      c.fillStyle = n.st <= ph && n.st + n.len > ph ? CL.acc : col;
      c.fillRect(n.st * cw, y - bh / 2, Math.max(n.len * cw - 1, 2), bh);
    });
  }
  c.fillStyle = CL.acc;
  c.fillRect(ph * cw, 0, 2, h);
  c.restore();
  c.fillStyle = CL.ink;
  c.font = (big ? "14px " : "10px ") + "Silkscreen,monospace";
  c.fillText(L[i][0], 4, big ? 16 : 11);
}
function draw() {
  requestAnimationFrame(draw);
  const grid = css("--grid"),
    acc = css("--acc"),
    c1 = css("--c1"),
    c2 = css("--c2"),
    c3 = css("--c3");
  g.fillStyle = css("--bg");
  g.fillRect(0, 0, W, H);
  let e = null;
  if (ctx && playing) {
    while (ev.length > 1 && ev[1].t <= ctx.currentTime) ev.shift();
    if (ev[0] && ev[0].t <= ctx.currentTime) e = ev[0];
  }
  const rH = 150,
    cw = W / 64;
  g.strokeStyle = grid;
  g.lineWidth = 1;
  for (let i = 0; i <= 64; i += 4) {
    g.beginPath();
    g.moveTo(i * cw, 0);
    g.lineTo(i * cw, rH);
    g.stroke();
  }
  pills.forEach(
    (b, i) =>
      (b.className =
        "lay" +
        (muted[i] || (!is16() && L[i][2]) ? " off" : "") +
        (e && e.act[i] ? " live" : "")),
  );
  if (e) {
    const s = e.sec,
      ph = e.pos;
    CL = { c1, c2, c3, acc, ink: css("--ink") };
    g.globalAlpha = 0.18;
    g.fillStyle = c3;
    g.fillRect(e.bar * 16 * cw, 0, 16 * cw, rH);
    g.globalAlpha = 1;
    view(g, W, rH, main, s, ph, e.act[main], 1);
    thumbs.forEach((t, i) => {
      if (i == main) return;
      t.g.fillStyle = css("--bg");
      t.g.fillRect(0, 0, 160, 52);
      view(t.g, 160, 52, i, s, ph, e.act[i], 0);
    });
    $("sec").textContent = TN[s.ty] + " · part " + s.id;
    $("lp").textContent = "Loop " + e.loop + "/" + e.reps;
    $("nx").textContent =
      e.loop >= e.reps
        ? "Next: " + TN[T[(s.k + 1) % 6]] + " coming…"
        : "Next section in " + (e.reps - e.loop + 1) + " loops";
    [...$("bars").children].forEach(
      (d, i) => (d.className = i == e.bar ? "on" : ""),
    );
    g.fillStyle = grid;
    g.fillRect(0, rH + 8, W, 6);
    g.fillStyle = c2;
    g.fillRect(0, rH + 8, (W * ((e.loop - 1) * 64 + ph)) / (e.reps * 64), 6);
  }
  if (an) {
    const a = waveform;
    an.getByteTimeDomainData(a);
    g.strokeStyle = c2;
    g.lineWidth = 2;
    g.beginPath();
    for (let i = 0; i < a.length; i++) {
      const x = (i * W) / a.length,
        y = rH + 45 + ((a[i] - 128) / 128) * 28;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
}
draw();
