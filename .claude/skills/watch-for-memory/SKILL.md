---
name: watch-for-memory
description: Use this skill when reviewing, writing, or editing any code that uses addEventListener, on(), subscribe(), addListener(), or any other event subscription API. Ensures every subscription is cleaned up to prevent memory leaks.
version: 1.0.0
---

# Watch for Memory Leaks — Event Subscriptions

**Rule: every event subscription must be removed when it is no longer needed.**

- `addEventListener` → paired `removeEventListener` (same reference, same options)
- `on(event, handler)` → paired `off(event, handler)` or `.removeListener`
- Reactive subscriptions (`createEffect`, `onMount`, `subscribe`, etc.) → cleanup inside `onCleanup` / teardown callback
- `RTCPeerConnection` / `MediaStream` listeners → removed when the call ends or the component unmounts

When you add or review a subscription and no cleanup is present, add it. In Solid.js components use `onCleanup`; in plain JS store the return value of `addEventListener` or keep the handler reference for later removal.
