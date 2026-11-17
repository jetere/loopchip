const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");

function engine() {
  const elements = new Map();
  const element = () => ({
    value: "",
    children: [],
    dataset: {},
    checked: false,
    add(option) {
      if (!this.value) this.value = option.value;
    },
    appendChild(child) {
      this.children.push(child);
    },
  });
  const get = (id) => {
    if (!elements.has(id)) elements.set(id, element());
    return elements.get(id);
  };
  for (const [id, value] of Object.entries({
    seed: "1337",
    mode: "16",
    reps: "4",
    vol: "60",
  }))
    get(id).value = value;
  const scope = vm.createContext({
    console,
    document: { getElementById: get, createElement: element },
    Option: function (text, value) {
      this.value = value;
    },
    window: { addEventListener() {} },
    setInterval: () => 1,
    clearInterval() {},
  });
  for (const name of [
    "data",
    "controls",
    "audio",
    "composition",
    "sequencer",
  ]) {
    vm.runInContext(
      fs.readFileSync(path.join(__dirname, `../src/${name}.js`), "utf8"),
      scope,
    );
  }
  return (code) => vm.runInContext(code, scope);
}

test("same seed reproduces an arrangement, including seed zero", () => {
  const run = engine();
  run("ctx={currentTime:0};");
  const generate = (seed) =>
    run(`$('seed').value=${seed};restart();JSON.stringify(gen(null))`);
  assert.equal(generate(1337), generate(1337));
  assert.equal(generate(0), generate(0));
  assert.notEqual(generate(0), generate(1));
});

test("all preset moods produce finite notes and four-bar sections", () => {
  const run = engine();
  assert.equal(
    run(`Object.keys(M).filter(k=>k!=='custom').every(k=>{
    applyMood(k);rng=mul(42);initSong();const section=gen(null);
    return section.prog.length===4 && section.mel.length===64 && section.bl.length===64 &&
      section.mel.concat(section.bl).filter(Boolean).every(n=>Number.isFinite(midi(n.d))&&n.len>0);
  })`),
    true,
  );
});

test("reroll bypasses the section cache", () => {
  const run = engine();
  assert.equal(
    run(`rng=mul(9);initSong();cur=gen(null);nxt=gen(cur);
    const before=nxt; $('reroll').onclick(); before.mel!==nxt.mel`),
    true,
  );
});

test("scheduler bounds recovery after a long timer stall", () => {
  const run = engine();
  assert.equal(
    run(`let count=0;playStep=()=>count++;playing=true;
    ctx={currentTime:3600,state:'running'};nextT=0;sched();count<=2 && nextT>ctx.currentTime`),
    true,
  );
});

test("stop cancels active sources and clears visual events", () => {
  const run = engine();
  assert.equal(
    run(`let stopped=0,disconnected=0;
    activeSources.add({stop(){stopped++},disconnect(){disconnected++}});
    ev=[{t:0}];playing=true;stop();
    stopped===1 && disconnected===1 && activeSources.size===0 && ev.length===0 && !playing`),
    true,
  );
});

test("loop count is constrained to the supported range", () => {
  const run = engine();
  assert.equal(
    run(`$('reps').value=100;$('reps').onchange();$('reps').value`),
    32,
  );
  assert.equal(
    run(`$('reps').value=-4;$('reps').onchange();$('reps').value`),
    1,
  );
});

test("synthesis schedules finite audio values across presets and sound modes", () => {
  const run = engine();
  assert.equal(
    run(`
    let scheduled=0;
    class Param {
      setValueAtTime(v,t){if(!Number.isFinite(v)||!Number.isFinite(t))throw Error('Invalid audio value');}
      linearRampToValueAtTime(v,t){this.setValueAtTime(v,t);}
      exponentialRampToValueAtTime(v,t){if(v<=0)throw Error('Invalid exponential ramp');this.setValueAtTime(v,t);}
      setTargetAtTime(v,t){this.setValueAtTime(v,t);}
    }
    const node=()=>({gain:new Param(),frequency:new Param(),detune:new Param(),Q:new Param(),delayTime:new Param(),
      connect(){},disconnect(){},addEventListener(){},setPeriodicWave(){},
      start(t){if(!Number.isFinite(t))throw Error('Invalid start');scheduled++;},stop(){}});
    window.AudioContext=class {
      constructor(){this.sampleRate=8000;this.currentTime=0;this.state='running';this.destination=node();}
      createGain(){return node()} createAnalyser(){return node()} createDynamicsCompressor(){return node()}
      createDelay(){return node()} createBiquadFilter(){return node()} createConvolver(){return node()}
      createOscillator(){return node()} createBufferSource(){return node()} createPeriodicWave(){return {}}
      createBuffer(ch,n){return {getChannelData(){return new Float32Array(n)}}}
      close(){this.state='closed';return Promise.resolve()}
    };
    init();
    for(const mode of ['8','16'])for(const name of Object.keys(M).filter(k=>k!=='custom')) {
      $('mode').value=mode;applyMood(name);rng=mul(31);initSong();cur=nxt=null;loop=0;
      for(let s=0;s<128;s++)playStep(s,s*.15);
      silenceSources();
    }
    stop();scheduled>100 && activeSources.size===0 && ctx===undefined;
  `),
    true,
  );
});
