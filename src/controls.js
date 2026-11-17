let ctx,
  master,
  an,
  noise,
  fx,
  dl,
  sg = [],
  bus = [],
  waves = {},
  rng = Math.random,
  playing = false,
  starting = false,
  mood = "adventure";
let step = 0,
  nextT = 0,
  timer,
  cur = null,
  nxt = null,
  loop = 0,
  force = false,
  ev = [],
  muted = Array(L.length).fill(false),
  act = Array(L.length).fill(false),
  song = {},
  cache = {};
const is16 = () => $("mode").value == "16";
const mul = (a) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (a) => a[(rng() * a.length) | 0];
const pills = L.map((l, i) => {
  const b = document.createElement("button");
  b.className = "lay";
  b.textContent = l[0];
  b.onclick = () => (muted[i] = !muted[i]);
  $("lays").appendChild(b);
  return b;
});
function P() {
  if (mood != "custom") return M[mood];
  const pr = $("cprog").value;
  return {
    progs: pr == "auto" ? Object.keys(PG) : [pr],
    dens: +$("cdens").value / 100,
    drum: +$("cdrum").value,
    swing: +$("cswing").value / 100,
    bass: [$("cbass").value],
    duty: [+$("cwave").value],
    arpRate: +$("carp").value,
    bells: BS,
  };
}
function applyMood(name) {
  const prevP = P();
  mood = name;
  const m = M[name];
  if (name == "custom") {
    const p = prevP;
    $("cprog").value = p.progs[0];
    $("cdens").value = p.dens * 100;
    $("cdrum").value = p.drum;
    $("cswing").value = p.swing * 100;
    $("cbass").value = p.bass[0];
    $("cwave").value = p.duty[0];
    $("carp").value = p.arpRate;
  } else {
    $("scale").value = m.scale;
    $("key").value = m.key;
    $("bpm").value = m.bpm;
    muted = Array(L.length)
      .fill(0)
      .map(
        (_, i) =>
          m.mask[i] === 0 ||
          (
            { sad: [9], mystery: [9], spooky: [9], dream: [9], battle: [8] }[
              name
            ] || []
          ).includes(i),
      );
  }
  setBpm();
  $("custom").hidden = name != "custom";
  $("md").textContent = m.d;
  $("en").textContent = m.n;
  [...$("moods").children].forEach(
    (b) => (b.className = "mood" + (b.dataset.m == name ? " sel" : "")),
  );
  if (playing) restart();
}
Object.keys(M).forEach((k) => {
  const b = document.createElement("button");
  b.dataset.m = k;
  b.textContent = M[k].n;
  b.onclick = () => applyMood(k);
  $("moods").appendChild(b);
});
