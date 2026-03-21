---
name: async-state
description: Use when writing code that handles promise-based or async state in solidjs components/hooks.
version: 1.0.0
---

Use `AsyncValue<T, E>` from `src/utils/asyncValue.ts` and the Solid.js hook `useAsyncValue` from `src/utils/useAsyncValue.ts` for any state derived from a promise.

```ts
const [data, { track }] = useAsyncValue<User, Error>();
track(fetchUser(id)); // auto-transitions: NotAsked → Loading → Success | Failure
```

Pattern-match with `.map()` or type guards (`isSuccess`, `isLoading`, `isFailure`, `isNotAsked`).