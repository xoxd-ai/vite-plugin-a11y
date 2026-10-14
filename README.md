# @tummycrypt/vite-plugin-a11y

Vite plugin that checks Svelte components for common accessibility problems at
build time: WCAG color contrast in `<style>` blocks, interactive elements
without an accessible label, click handlers without keyboard support, positive
`tabindex`, and color-only instructions.

## Use (Bazel only)

This package is distributed through the xoxd-ai Bazel registry, not npm.

```starlark
# MODULE.bazel
bazel_dep(name = "tummycrypt_vite_plugin_a11y", version = "1.0.0")
```

```starlark
# BUILD.bazel
load("@aspect_rules_js//npm:defs.bzl", "npm_link_package")

npm_link_package(
    name = "node_modules/@tummycrypt/vite-plugin-a11y",
    src = "@tummycrypt_vite_plugin_a11y//:pkg",
)
```

The app provides the peers from its own lock: `magic-string` (`^0.30.21`),
`svelte` 5.57.2 and `vite` 8.3.3.

```ts
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { accessibilityPlugin } from '@tummycrypt/vite-plugin-a11y';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [accessibilityPlugin({ wcagLevel: 'AA', failOnError: false }), sveltekit()]
});
```

## Options

| Option | Default | Meaning |
|---|---|---|
| `enabled` | `true` | Turn the plugin off. |
| `failOnError` | `NODE_ENV === 'production'` | Throw in `buildEnd` when contrast errors were found. |
| `wcagLevel` | `'AA'` | `'AA'` (4.5:1) or `'AAA'` (7:1). |
| `include` / `exclude` | `['**/*.svelte']` / `['node_modules/**']` | File filters. |
| `maxFileSize` | 1 MiB | Skip larger files. |

In development (`NODE_ENV=development` or `VITE_DEBUG=true`) the plugin logs a
summary and annotates low-contrast rules with a comment.

## Develop

```sh
pnpm install --frozen-lockfile
pnpm typecheck && pnpm test && pnpm build
bazel build //:pkg && bazel test //...
```

See CHANGELOG.md for the 1.0.0 migration note.
