# Meet the Timeline

Every procedure you record with MVR now tells a story — not just in the videos and images you capture, but in a companion **timeline** that travels alongside them.

## What it is

The timeline is a small, plain file that lives inside every **Study folder** — right alongside the videos and captured images it belongs to. Open a study, and the timeline is already there, no setup required. It quietly keeps a running log of everything that happened during the session, stamped to the exact moment it occurred.

Think of it as the table of contents for your study: instead of scrubbing back and forth to find *that one moment*, you can glance at the timeline and jump straight to it.

## What goes into it

The timeline fills itself as you work. Two kinds of things land on it:

- **Automatic events** — moments the system already knows about, like when recording started or when an image was captured.
- **Your own annotations** — the taps you make on the on-screen menus during a procedure.

That second part is the heart of it. As you tap buttons on the overlay — marking a segment, flagging an action, noting a finding — each tap drops a labeled marker onto the timeline at the exact second it happened. Long-press for a bit more detail, dig into a submenu to be more specific ("Injection → Hemostasis → Hemoclip"), and all of that nuance is captured too. You annotate naturally, in the moment, without pausing to type or fill out a form.

Nothing is forced and nothing is fixed — the menus are yours to arrange, and the notes you make are the notes *you* care about.

## Why it's useful

Your videos and images show you *what* the camera saw. The timeline tells you *what mattered* and *when*.

- **Captures your intent, not just the picture.** The footage can't know you were performing a hemostasis with a hemoclip. The timeline can — because you told it, with a tap.
- **A structured, time-stamped record.** Every marker is anchored to the exact second it happened, in a simple file that's easy to read, share, and feed into other tools.
- **Built for research at scale.** Clean, consistent, machine-readable annotations are exactly what clinical trials and dataset collection need — captured live, without a separate labeling pass afterward.
- **No patient information.** The timeline holds only events and the annotations you tap — no names, no identifiers, nothing about the patient. It describes *what happened*, not *who*, which keeps it safe to share and pool for research.

## Where this is today

This first release covers the **capture** side of the timeline: recording events and your live annotations into the file, as the procedure happens. That part is working now.

A few things are deliberately still ahead:

- **Tagging during review** — adding or refining markers *after* the session, while playing back the study — is not here yet.
- **The Study report** — timeline annotations are intended to feed into the report generated for each study, but that reporting is not built yet.

For now, the timeline is best understood as **supplementary annotation data**: a structured companion to the study, meant to be consumed by third-party processing tools, with clinical trials and dataset collection as the primary target. The videos and images are the memory. The timeline is the meaning — and the raw material for what comes next.
