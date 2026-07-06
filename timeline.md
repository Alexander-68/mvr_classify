# The Study Timeline

## What it is

Every MVR / MTR-series recorder keeps a **timeline** for the active study: a time-ordered log of everything that happened during the procedure, written to `timeline.ndjson` in the study folder (next to `study_info.yaml`, one per enabled storage). Each line is a single JSON object — [NDJSON](https://github.com/ndjson/ndjson-spec) — so the file streams, appends, and parses line-by-line without ever loading the whole thing.

The timeline mixes two kinds of records:

- **Device events** the recorder emits on its own — the study opening and closing, signal appearing or dropping, input/view switches, snapshots, and each recording's start / pause / resume / stop / error.
- **External events** injected by an operator or an on-device web app — the clinical *markers* that say **what** was happening on screen and **when**.

Both share the same envelope: an `"ev"` name and a `"ts"` timestamp (epoch milliseconds). Device events carry recorder-owned fields (`file_name`, `input_name`, …); external events are stored as `"ev":"ext"` and carry whatever JSON the injector sent. The first record is always `study_start`, the last `study_finish`.

```
{"ts":1751731200000,"ev":"study_start","folder_name":"20260705_083129_6d244bd0","device_id":"6d244bd0"}
{"ts":1751731200500,"ev":"signal_good","input_name":"IN1 DP","signal_resolution":"1920x1080"}
{"ts":1751731205000,"ev":"rec_start","file_name":"V0001.mp4"}
{"ts":1751731260000,"ev":"snapshot","file_name":"I0002.jpg"}
{"ts":1751731300000,"ev":"ext","ip":"localhost","marker":"R.Colon"}
{"ts":1751731400000,"ev":"rec_stop","file_name":"V0001.mp4"}
{"ts":1751731405000,"ev":"study_finish"}
```

The full record catalog and the injection API live in [`timeline_api.md`](timeline_api.md). This document is about the **why**: what the timeline unlocks, shown through the colonoscopy annotation overlay in this repo.

## Where the events come from

External markers don't have to be typed. MVR / MTR devices ship an **External apps** feature that runs a web app right on the device, over the live camera preview. **mvr_annotate** (this repo) is one such app: install it (see [`README.md`](README.md)) and you have an annotation interface under your fingertips, floating over the live endoscopic feed. Tap a button and the tap becomes a timeline event — no typing, no separate device, no clock-watching. The marker lands on the same timeline as the recording it describes, on the same clock.

And it isn't tied to colonoscopy. The buttons, clusters, and submenus are defined in a single file, `mvr_annotate.json`; edit that one file to match any procedure and the annotation surface changes with it. The rest of the app stays untouched.

The example set shipped here is a colonoscopy menu of two clusters:

- **`segments`** (single-select) — anatomical location: `Illeum, R.Colon, Tv.Colon, L.Colon, S.Colon, Rectum`
- **`actions`** (multi-select) — what the endoscopist is doing: `Withdrawal, Injection, Hemostasis, Biopsy, Polyp`

Several action buttons open a long-press **submenu** of modifiers, e.g. `Polyp` → `Cold Snare, Hot Snare, EMR, ESD, EFTR, …`, `Biopsy` → `Forceps, FNA/FNB, Brush, Snare, Suction`.

### The event shapes

A plain button injects its label as `marker`:

```json
{ "marker": "R.Colon" }
```

A submenu button fixes the `marker` to its **host** and reports the pressed modifier separately:

```json
{ "marker": "Polyp", "modifier": "EMR" }
```

And the press *style* tags a `status`, so one button expresses both an instant mark and a start/stop span:

| Gesture                         | Event                                           | Reads as         |
| ------------------------------- | ----------------------------------------------- | ---------------- |
| short tap, select               | `{ "marker": "Injection" }`                     | happened (point) |
| short tap on a selected button  | `{ "marker": "Injection", "status": "finish" }` | done             |
| long-press, select              | `{ "marker": "Withdrawal", "status": "on" }`    | span begins      |
| long-press on a selected button | `{ "marker": "Withdrawal", "status": "off" }`   | span ends        |

`status: "on"` / `"off"` bracket a duration (withdrawal running, a therapy in progress); the bare / `finish` pair marks a moment. The payload is open-ended — the recorder stores whatever JSON arrives — so richer structures (a `submodifier`, a `path: [...]` for deeper menus) need no device change.

## Why it matters

Three payoffs for the MVR / MTR line, all falling out of one annotated timeline.

### 1. Automatic reporting

The timeline is a structured procedure log, so the report writes itself. From the `ts` deltas and the `on`/`off` spans you get **withdrawal time** (the colonoscopy quality metric), a per-segment breakdown, and an itemized intervention list — each `Polyp → EMR`, each `Hemostasis → Hemoclip`, timestamped and linked to the exact video file (`rec_start` / `rec_stop` bound each clip). What used to be dictated after the case is a byproduct of the annotations made *during* it.

Sketch of one case:

```
{"ts":...,"ev":"ext","marker":"R.Colon"}
{"ts":...,"ev":"ext","marker":"Withdrawal","status":"on"}
{"ts":...,"ev":"ext","marker":"Polyp","modifier":"Cold Snare"}
{"ts":...,"ev":"ext","marker":"Biopsy","modifier":"Forceps"}
{"ts":...,"ev":"ext","marker":"Withdrawal","status":"off"}
```

→ "Right colon, withdrawal 6m12s, 1 polyp removed (cold snare), 1 forceps biopsy."

### 2. Events-guided review

The timeline turns a long recording into a **chapter list**. Instead of scrubbing 20+ minutes, a reviewer jumps straight to every `Polyp`, every `Hemostasis`, every segment transition — because each marker's `ts` is a seek point into the video. `snapshot` and `rec_start` records anchor the markers to specific files and frames. Review, QA audits, teaching clips, and second opinions all navigate by event rather than by scrubbing.

### 3. Annotation for dataset collection

Because the operator is *already* labeling the procedure live, the timeline is a ready-made **ground-truth annotation track** for machine-learning datasets. Each `ext` marker is a `(timestamp, label)` pair against real video — exactly the supervision a classifier or detector needs. The two-cluster design maps cleanly to a labeling schema: `segments` → anatomical-location classes, `actions` + `modifier` → procedure/instrument classes. Collecting a labeled colonoscopy corpus becomes a matter of running normal cases with the overlay on, no separate annotation pass afterward.

## In short

One NDJSON file, written live, carrying device events and human markers on a shared clock. The annotation overlay is how the human markers get there without friction; automatic reports, event-guided review, and ML-ready labels are what that same file gives back.
