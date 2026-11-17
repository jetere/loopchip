/* ---------- song structure & melody ---------- */
const T = [0, 1, 2, 1, 2, 0],
  TN = ["Intro", "Verse", "Chorus"];
const NX = {
  0: [3, 4, 5, 2, 1, 6],
  5: [3, 1, 4, 2],
  3: [4, 0, 1, 2],
  4: [0, 5, 3],
  2: [5, 3],
  1: [4, 6],
  6: [0, 5],
};
function rprog() {
  const a = [0];
  for (let i = 0; i < 3; i++) a.push(pick(NX[a[a.length - 1]]));
  return a;
}
function initSong() {
  const ps = P().progs,
    fixed = mood == "custom" && $("cprog").value != "auto";
  const g = () => (fixed || rng() < 0.4 ? PG[pick(ps)] : rprog());
  const a = g();
  let b = g();
  if (!fixed && b.join() == a.join()) b = rprog();
  song = {
    A: a,
    B: b,
    tr: mood == "custom" ? 0 : pick([0, 0, 2, -2, 3, 5, -3, 7]),
    shape: pick([0, 1, 2, 3]),
    arp: pick([
      rng() < 0.5 ? [0, 1, 2, 1] : [0, 2, 1, 2],
      [0, 1, 2, 3],
      [2, 1, 0, 1],
      [0, 1, 2, 3, 2, 1],
      Array.from({ length: pick([4, 6, 8]) }, () => pick([0, 1, 2, 3])),
    ]),
    pad: {
      style: pick(
        {
          sad: [0, 3],
          mystery: [3, 4],
          chill: [1, 2, 4],
          happy: [1, 2],
          adventure: [0, 1, 2, 4],
        }[mood] || [0, 1, 2, 3, 4],
      ),
      wave: pick(["sawtooth", "square", "triangle", "sine"]),
      lp: pick([700, 1000, 1500, 2200]),
      v: pick([0, 1, 2]),
    },
    pk: pick([
      [0, 3, 6, 10, 12],
      [2, 6, 10, 14],
      [0, 2, 4, 6, 8, 10, 12, 14],
      [0, 6, 8, 14],
      [0, 3, 8, 11],
      [1, 4, 7, 10, 13],
      [0, 4, 7, 10, 14],
    ]),
    bt: {
      w: pick(["sawtooth", "square", "triangle", "p"]),
      lp: pick([350, 500, 800, 1200]),
      sub: rng() < 0.7,
    },
    ds: {
      reg: pick([-1, 0, 0, 1]),
      hoff: pick([-2, -2, -4, -5, 2, 4]),
      lead: {
        vib: pick([0, 6, 12, 18]),
        gate: pick([0.55, 0.8, 0.95]),
        att: pick([0.003, 0.01, 0.03]),
        w: rng() < 0.25 ? "sawtooth" : null,
      },
      harm: {
        w: pick(["p", "sawtooth", "triangle"]),
        lp: pick([1800, 2500, 3500]),
        vol: pick([0.06, 0.09, 0.11]),
      },
      arp: {
        w: pick(["p", "p", "triangle", "sawtooth"]),
        duty: pick([0.125, 0.25, 0.5]),
        oct: pick([0, 7, 7, 14]),
        gate: pick([0.5, 0.9]),
        lp: pick([0, 2500]),
        vol: pick([0.05, 0.06, 0.08]),
      },
      bell: {
        ratio: pick([2, 3.5, 5.19, 1.4, 7]),
        idx: pick([0.8, 1.8, 3]),
        dec: pick([3, 5, 8]),
        oct: pick([7, 14]),
      },
      kit: {
        f0: pick([120, 160, 200]),
        f1: pick([35, 45, 55]),
        d: pick([0.12, 0.16, 0.22]),
        sd: pick([0.08, 0.13, 0.2]),
        sf: pick([1300, 1800, 2600]),
        bf: pick([160, 220, 300]),
        hf: pick([6000, 7500, 9500]),
        hc: pick([0.02, 0.03, 0.05]),
        ho: pick([0.06, 0.08, 0.12]),
        cf: pick([900, 1200, 1800]),
        shf: pick([8000, 9500, 11000]),
        rf: pick([5000, 6000, 8000]),
      },
      str: {
        w: pick(["sawtooth", "square", "triangle"]),
        lp: pick([1500, 2600, 4000]),
        vib: pick([0, 6, 10, 16]),
        tones: [pick([7, 9, 11, 14]), pick([7, 9, 11, 14])],
        one: rng() < 0.4,
        att: pick([0.1, 0.25, 0.5]),
      },
      pl: {
        w: pick(["p", "triangle", "sawtooth", "square"]),
        duty: pick([0.125, 0.25, 0.5]),
        lp: pick([1500, 2800, 4500]),
        len: pick([0.6, 1.5, 3]),
        seq: [pick([0, 2, 4, 7]), pick([0, 2, 4, 7]), pick([0, 2, 4, 7])],
        oct: pick([0, 7]),
      },
      fx: {
        q: pick([1, 3, 6]),
        f1: pick([4000, 7000, 10000]),
        f0: pick([200, 400, 800]),
        half: rng() < 0.4,
      },
    },
  };
  cache = {};
}
const vdr = (d, n) => {
  const k = (
      n == 2
        ? pick([d.k, A(0, 8), A(0, 6, 8), A(0, 8, 10), A(0, 3, 8, 11)])
        : d.k
    ).slice(),
    s = (n == 2 ? pick([d.s, A(4, 12, 15), A(4, 12, 14)]) : d.s).slice();
  if (n >= 2 && rng() < 0.7) k[pick([3, 6, 7, 10, 14])] = 1;
  if (n >= 2 && rng() < 0.4) k[pick([2, 13, 15])] = 1;
  if (n >= 3 && rng() < 0.5) s[pick([7, 14, 15])] = 1;
  return { k, s, h: n >= 1 && rng() < 0.35 ? A(2, 4, 6, 10, 12, 14) : d.h };
};
function ct(c, prev, lo, hi, root) {
  const a = [];
  for (let k = -3; k <= 3; k++)
    (root ? [0] : [0, 2, 4]).forEach((x) => {
      const d = c + x + 7 * k;
      if (d >= lo && d <= hi) a.push(d);
    });
  a.sort((x, y) => Math.abs(x - prev) - Math.abs(y - prev));
  return !root && a.length > 1 && rng() < 0.55
    ? a[1 + (rng() < 0.3 && a.length > 2 ? 1 : 0)]
    : a[0];
}
function melody(prog, dens, lo) {
  const hi = lo + 7,
    mel = Array(64).fill(null);
  const SP = [
      [0, 6, 8],
      [0, 8],
      [0, 4, 8, 12],
      [0, 6, 10],
    ],
    MD = [
      [0, 4, 8, 10, 12],
      [0, 3, 6, 8, 12],
      [0, 4, 6, 8, 12, 14],
    ],
    DN = [E8, [0, 3, 4, 6, 8, 11, 12, 14], [0, 2, 4, 7, 8, 10, 12, 14]];
  const rg = () => {
      const a = [0];
      let l = 0;
      for (let p = 1; p < 16; p++) {
        const pr =
          p % 4 == 0
            ? 0.45 + 0.4 * dens
            : p % 2 == 0
              ? 0.2 + 0.45 * dens
              : 0.04 + 0.3 * dens;
        if (rng() < pr && p - l >= (dens > 0.7 ? 1 : 2)) {
          a.push(p);
          l = p;
        }
      }
      if (a.length < 2) a.push(8);
      return a;
    },
    RA = rg(),
    RB = rg();
  let prev = lo + 2 + ((rng() * 4) | 0),
    dir = rng() < 0.5 ? 1 : -1;
  const wrap = (d) => {
    while (d > hi) d -= 7;
    while (d < lo) d += 7;
    return d;
  };
  const bar = (rhy, c, last) =>
    rhy.map((p, i) => {
      let d;
      if (last && i == rhy.length - 1) d = ct(c, prev, lo, hi, true);
      else if (p % 4 == 0) d = ct(c, prev, lo, hi);
      else {
        if (rng() < [0.25, 0.12, 0.4, 0.2][song.shape]) dir = -dir;
        d = prev + dir * (rng() < [0.7, 0.85, 0.5, 0.6][song.shape] ? 1 : 2);
        if (d > hi) {
          d = hi - 1;
          dir = -1;
        }
        if (d < lo) {
          d = lo + 1;
          dir = 1;
        }
      }
      prev = d;
      return { p, d };
    });
  const b0 = bar(RA, prog[0]);
  const b1 =
    rng() < 0.5
      ? b0.map((n) => ({ p: n.p, d: wrap(n.d + prog[1] - prog[0]) }))
      : bar(RA, prog[1]);
  const b2 =
    rng() < 0.7
      ? b0.map((n) => ({ p: n.p, d: wrap(n.d + prog[2] - prog[0]) }))
      : bar(RA, prog[2]);
  const b3 = bar(RB, prog[3], true);
  [b0, b1, b2, b3].forEach((notes, b) =>
    notes.forEach((n, i) => {
      const nx = i < notes.length - 1 ? notes[i + 1].p : 16;
      mel[b * 16 + n.p] = {
        d: n.d,
        len: Math.max(
          1,
          Math.min(nx - n.p, b == 3 && i == notes.length - 1 ? 8 : 4),
        ),
      };
    }),
  );
  return mel;
}
function bassLine(prog, style) {
  const bl = Array(64).fill(null);
  for (let b = 0; b < 4; b++) {
    const c = prog[b] - 7,
      nx = prog[(b + 1) % 4] - 7,
      f = c + 4,
      o = c + 7,
      ap = () => nx + pick([-1, 1, -2, 0]),
      put = (s, d, len) => {
        bl[b * 16 + s] = { d, len };
      };
    if (style == "long") {
      const l = pick([8, 16]);
      put(0, c, l);
      if (l == 8) put(8, pick([c, f, ap()]), pick([4, 8]));
    } else if (style == "eighth") {
      for (let s = 0; s < 16; s += 2) {
        if (rng() < 0.12) continue;
        put(
          s,
          s == 14 && rng() < 0.6
            ? ap()
            : rng() < 0.18
              ? f
              : rng() < 0.1
                ? o
                : c,
          2,
        );
      }
    } else if (style == "octave") {
      for (let s = 0; s < 16; s += 2)
        put(
          s,
          s == 14 && rng() < 0.4 ? ap() : s % 4 == 2 ? o : rng() < 0.15 ? f : c,
          2,
        );
    } else if (style == "sync") {
      const st = [0];
      [3, 6, 8, 10, 11, 14].forEach((x) => {
        if (rng() < 0.55) st.push(x);
      });
      st.sort((x, y) => x - y).forEach((s, i) =>
        put(
          s,
          rng() < 0.2 ? f : i == st.length - 1 && rng() < 0.5 ? ap() : c,
          2,
        ),
      );
    } else if (style == "walk") {
      [0, 4, 8, 12].forEach((s, i) => put(s, [c, c + 2, f, ap()][i], 3));
    } else if (style == "pump") {
      put(0, c, 2);
      for (let s = 2; s < 16; s += 4) put(s, rng() < 0.2 ? o : c, 2);
    } else if (style == "gallop") {
      for (let q = 0; q < 4; q++) {
        put(q * 4, c, 1);
        put(q * 4 + 2, q == 3 && rng() < 0.5 ? ap() : c, 1);
        put(q * 4 + 3, c, 1);
      }
    } else {
      const sq = [c, f, o, f];
      for (let s = 0; s < 16; s += 2) put(s, sq[(s / 2) % 4], 2);
    }
  }
  return bl;
}
function gen(prev, fresh = false) {
  const p = P(),
    k = prev ? prev.k + 1 : 0,
    ty = T[k % 6],
    c = cache[ty];
  if (c && !fresh && !(k >= 6 && rng() < 0.3))
    return Object.assign({}, c, { k, id: k + 1 });
  const bst =
    rng() < 0.55
      ? pick(p.bass)
      : pick(
          p.drum >= 2
            ? ["walk", "pump", "gallop", "arp", "sync", "eighth"]
            : ["walk", "pump", "long", "arp"],
        );
  const sec = {
    k,
    id: k + 1,
    ty,
    en: ty,
    prog: ty == 2 ? song.B : song.A,
    mel: melody(
      ty == 2 ? song.B : song.A,
      Math.min(1, p.dens + (ty == 2 ? 0.2 : 0)),
      (ty == 2 ? 9 : 7) + song.ds.reg,
    ),
    bassStyle: bst,
    bl: bassLine(ty == 2 ? song.B : song.A, bst),
    duty: pick(p.duty),
    dr: vdr(DR[p.drum], p.drum),
    arp: song.arp,
    pk: song.pk,
    arpRate: p.arpRate,
    bell: pick(p.bells),
    hoff: song.ds.hoff,
    seventh: rng() < 0.5,
    leadFrom: ty == 0,
  };
  cache[ty] = sec;
  return sec;
}
