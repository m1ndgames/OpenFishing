// Server-side environment variables, declared in src/env.ts. Re-exported as a single `env`
// object so call sites read `env.X` and tests can mock this module with `{ env: {...} }`
// (vitest aliases it to src/__mocks__/env.ts).
import * as privateEnv from '$app/env/private';

export const env = privateEnv;
