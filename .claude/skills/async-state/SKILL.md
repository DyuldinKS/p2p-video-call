---
name: async-state
description: Use when writing code that handles promise-based or async state in solidjs components/hooks.
version: 1.0.0
---

Use Solid's built-in `createResource` for all async state. Any event-driven trigger can be modeled as setting a nullable signal:

```ts
const [input, setInput] = createSignal<string | null>(null);
const [data] = createResource(input, async (value) => fetchSomething(value));
// trigger on button click: setInput(value)
// data.loading, data.error, data() — built-in reactive states
```