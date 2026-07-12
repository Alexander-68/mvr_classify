# Annotations Release Notes

## 2026-07-12-2
1. A submenu can now be shared by several buttons and opened at the same place. In mvr_annotate.json, a submenu value may be a string naming another submenu key (a reference): the button reuses that definition's modifiers/openOnTap and its submenu id, so the shared submenu persists one position/zoom and pops up in the same spot no matter which button opened it. Each button still injects its own marker, and the submenu header shows the tapped button's label. The reference target can be a real button label or a synthetic template key that is not a button anywhere. Example: the six Segments buttons all reference a single "SegmentStatus" definition.

## 2026-07-12
**Summary**
1. Add recording inactive warning. Activated when user annotates without start video recording.
2. Introduced the aiScope history graph: a button-styled strip that plots each AI class's score over time, so the inference trend can be seen at a glance and reviewed. Drag its right edge to lengthen it (more history) and pinch/wheel to zoom the timeline; recording spans, snapshots, and recording starts are marked along it.
3. Real-time AI score indicators now also show a cumulative result ("above-threshold" accumulator (0..100%)) over all time, plus a separate cumulative result for the current recording while recording is active.
4. On recording pause/stop, the per-video cumulative result is injected into the Study timeline as a video summary event. It looks like this:
`{"ts":1783847406615,"ev":"rec_stop","file_name":"V0002.mp4"}
{"ts":1783847406622,"ev":"ext","ip":"localhost","marker":"aiScope","event":"video_summary","classes":[{"cls":0,"pct":57},{"cls":1,"pct":1}],"model":"pd_mbnet3l_blurpp"}`

## 2026-07-10
1. Recording-inactive warning is now per-cluster. Add "recordingWarning": false to a cluster in mvr_annotate.json to stop its buttons (and their submenus) from raising the warning. Defaults to true, so existing clusters are unchanged. Example: the "Data" cluster is opted out.
2. aiScope graph "downsample" option (under "aiScope": { "graph": {...} }): averages every N incoming samples into one stored point (timestamped at the latest of the group), keeping the history coarser. aiScope feeds ~60 samples/s, so downsample: 12 stores ~5/s. Defaults to 1 (keep every sample, unchanged).
3. aiScope indicators now show a second line: a per-class "above-threshold" accumulator (0..100%). Each sample adds its overshoot past the class threshold over the (100 - threshold) headroom, averaged over all samples (e.g. threshold 55, scores 60 then 70 -> 11% then 22%). The live real-time % moves to a smaller third line. Thresholds are now per-class ("threshold" under each aiScope class, default 50) instead of a single graph threshold; the graph draws one dashed line per distinct threshold value, colored by its class (lowest cls id wins when values tie).
4. aiScope accumulator now has a per-VIDEO variant alongside the per-study one. It resets when video recording starts, and while recording it replaces the per-study number on the accumulator line (a small red "REC" badge marks the switch). Pause or stop injects a timeline event with the per-class results — `{"marker":"aiScope","event":"video_summary","classes":[{"cls":..,"pct":..}],"model":..}` — and the display reverts to the per-study accumulator. Resuming after a pause continues the per-video count (no reset); stopping resets it after injecting. The `model` field carries the latest AI model name reported on the inference stream (omitted if none seen). Fed from the device study event stream (rec_start/pause/resume/stop).
5. aiScope graph now marks events with small icons along its top edge: a camera for each snapshot and a video camera for each recording start. Icons are embedded in index.html (no extra files). When several events sit too close to overlap, only the latest one's icon is drawn.

## 2026-07-09-2
1. Add recording inactive warning. Activated when user annotates without start video recording. Requires MVR FW 260709+.
2. Add aiScope live history graph: plots each class's moving-averaged score over time in a long button-styled strip. Drag the right edge to make it longer (shows more history); pinch or mouse-wheel to zoom the timeline; configurable dashed threshold line (default 50%). Position and size persist; collected AI data does not. Configured under "aiScope": { "graph": {...} } in mvr_annotate.json.
3. Overlay recording events on the aiScope graph: shaded bands mark when the MVR was recording, edge lines mark start/stop, and dashed ticks mark snapshots (fed from the device's study event stream). Colors are configurable under "aiScope": { "graph": {...} } as recordingFillColor / recordingEdgeColor / snapshotColor; omit a color to hide that element. The graph also now stays on screen after the AI stream stops so the trace can be reviewed.

## 2026-07-09
1. Submenues can be nested.
2. Submenues can be opened immediately on tap, not just on the long tap; configurable with "openOnTap": true. See example: Actions-Status-Disease.
3. Menu now contains a title.
4. Top-level menu cluster can be minimized into a button by tapping the title; minimization/expansion is not a reportable event for the Study timeline.
5. Example of the mvr_annotate.json configuration file shows almost the complete setup for colonoscopy annotations; overcomplicated, though.

