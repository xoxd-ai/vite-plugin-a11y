# Changelog

## 1.0.0 (2026-10-14)

Major release for the 2026-10-08 estate uplift (RU1, RU10). The plugin API is
unchanged: `accessibilityPlugin` (named and default export), its options, and
every validator and color helper keep their names and behaviour. The peer
stack, the dependency shape and the distribution change.

### Changed

- Peers are exact for the estate stack (RU1, RU5): `svelte` 5.57.2 and
  `vite` 8.3.3. Svelte 4 and Vite 5-7 are no longer supported.
- `magic-string` moves from `dependencies` to `peerDependencies`
  (`^0.30.21`). The package has no runtime dependencies of its own; the
  consuming app's lock provides magic-string, svelte and vite.
- Bazel: the `pkg` target no longer links this module's own npm hub into
  consumers. Before, a consumer's `npm_link_package` of 0.3.0 got private
  `node_modules/{magic-string,vite}` copies from this repository's lock
  (vite 8.0.10 next to an app on 8.3.3). Now the peers resolve from the app's
  single pnpm lock (RU9).
- TypeScript 7.0.2, vitest 5.0.3, vite 8.3.3 and svelte 5.57.2 are pinned
  exactly as dev dependencies (RU5, RU13). The tsconfig uses
  `module`/`moduleResolution` `NodeNext` and lists `"types": ["node"]`.
- Bazel: aspect_rules_ts 3.10.1 with the `typescript` extension at 7.0.2
  (`ts_project` keeps `transpiler = "tsc"`), Node toolchain 22.22.0, and the
  npm hub is renamed to `tummycrypt_vite_plugin_a11y_npm`.
- Node >= 22.12 (Vite 8's floor).
- Distribution is Bazel only (RU6, RU8): the package is `private`, and the
  publish workflow, `publishConfig` and `prepublishOnly` are removed.
- Repository, homepage and bugs URLs point at xoxd-ai.

### Fixed

- The keyboard-navigation check recognises Svelte 5 event attributes
  (`onclick`, `onkeydown`, `onkeyup`, `onkeypress`) as well as legacy
  `on:` directives. Before, a legacy `on:click` was never seen (Svelte parses
  it as an `EventHandler` named `click`), and a Svelte 5 `onkeydown` did not
  count as keyboard support.

### Migration

1. Stop installing `@tummycrypt/vite-plugin-a11y` from npmjs or GitHub
   Packages; 0.x there is frozen and will be marked deprecated.
2. Re-pin: `bazel_dep(name = "tummycrypt_vite_plugin_a11y", version = "1.0.0")`
   from xoxd-ai/bazel-registry, and link it with
   `npm_link_package(name = "node_modules/@tummycrypt/vite-plugin-a11y", src = "@tummycrypt_vite_plugin_a11y//:pkg")`.
3. Make sure the app's own `package.json` and lock provide `magic-string`
   (`^0.30.21`), `svelte` 5.57.2 and `vite` 8.3.3, and that they are linked
   in the app's root `node_modules` (for example in the app's npm package list
   for its Vite build and dev targets).
4. Imports are unchanged:
   `import { accessibilityPlugin } from '@tummycrypt/vite-plugin-a11y'`.

## 0.3.0

- Require Svelte 5 in the `svelte` peer range.
