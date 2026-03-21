---
name: memory-usage
description: Use when writing or reviewing code with event subscriptions (addEventListener, on(), subscribe(), addListener(), etc.). Every subscription must be cleaned up.
version: 1.0.0
---

Every event subscription must be removed when no longer needed.

- `addEventListener` → `removeEventListener` (same reference + options)
- `on(event, fn)` → `off(event, fn)`
- Solid.js effects/mounts → cleanup inside `onCleanup`
- WebRTC/MediaStream listeners → removed on hang-up or unmount
