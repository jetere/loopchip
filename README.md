# Loopchip

A browser-based chiptune studio with seeded melodies, evolving arrangements, eleven instrument layers, and live piano-roll visualizations.

## Run

Open `index.html` in a modern browser, or run `npm start` and visit `http://127.0.0.1:8080`. Press **Play** to enable audio. No build step or dependencies are required; Node.js is needed only for the local server and tests.

Choose a mood, adjust the key and tempo, and mute individual layers. Reuse a seed to reproduce an arrangement, or reroll the next section for a new variation. Both 8-bit and 16-bit sound modes are available.

## Source

- `src/data.js` — scales, patterns, and mood presets
- `src/controls.js` — settings and shared state
- `src/composition.js` — seeded melody and arrangement generation
- `src/audio.js` — Web Audio synthesis and effects
- `src/sequencer.js` — playback and scheduling
- `src/visuals.js` — instrument displays
- `src/styles.css` — responsive light and charcoal themes

Run `npm test` to check engine behavior. Audio is synthesized locally; Google Fonts is optional and falls back to installed fonts.
