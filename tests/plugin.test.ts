import { describe, it, expect, afterEach, vi } from 'vitest';
import { parse } from 'svelte/compiler';
import type { Plugin } from 'vite';
import accessibilityPlugin, { accessibilityPlugin as named } from '../src/index.js';
import { checkAriaLabels, checkKeyboardNavigation } from '../src/validators.js';

type TransformHook = (code: string, id: string) => Promise<{ code: string } | null>;
type PlainHook = () => void | Promise<void>;

function hooks(plugin: Plugin) {
  return {
    buildStart: plugin.buildStart as unknown as PlainHook,
    transform: plugin.transform as unknown as TransformHook,
    buildEnd: plugin.buildEnd as unknown as PlainHook
  };
}

const svelteAst = (code: string) => parse(code, { filename: 'Test.svelte' });

describe('accessibilityPlugin', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is a pre-enforced Vite plugin with both export forms', () => {
    const plugin = accessibilityPlugin();
    expect(plugin.name).toBe('vite-plugin-a11y');
    expect(plugin.enforce).toBe('pre');
    expect(named).toBe(accessibilityPlugin);
  });

  it('ignores non-svelte modules and disabled runs', async () => {
    const { transform } = hooks(accessibilityPlugin());
    expect(await transform('export const x = 1;', '/src/x.ts')).toBeNull();

    const disabled = hooks(accessibilityPlugin({ enabled: false }));
    expect(await disabled.transform('<button></button>', '/src/A.svelte')).toBeNull();
  });

  it('parses a Svelte 5 component and leaves it unchanged outside development', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    const { transform } = hooks(accessibilityPlugin({ failOnError: false }));
    const code = `<script>let { label } = $props();</script>
<button onclick={() => {}}>{label}</button>
<style>.low { color: #777777; background-color: #888888; }</style>`;
    expect(await transform(code, '/src/Ok.svelte')).toBeNull();
  });

  it('annotates low contrast in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const { transform } = hooks(accessibilityPlugin({ failOnError: false }));
    const code = `<p class="low">x</p>
<style>.low { color: #777777; background-color: #888888; }</style>`;
    const out = await transform(code, '/src/Low.svelte');
    expect(out?.code).toContain('LOW CONTRAST');
  });

  it('fails the build on contrast errors when failOnError is set', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    const { buildStart, transform, buildEnd } = hooks(accessibilityPlugin({ failOnError: true }));
    await buildStart();
    await transform(
      `<p class="low">x</p>\n<style>.low { color: #777777; background-color: #888888; }</style>`,
      '/src/Low.svelte'
    );
    expect(() => buildEnd()).toThrow(/1 accessibility error/);
  });
});

describe('Svelte 5 AST checks', () => {
  it('flags a click handler without keyboard support (Svelte 5 event attribute)', () => {
    const code = '<div onclick={() => {}}>x</div>';
    const results = checkKeyboardNavigation(svelteAst(code), code, 'Test.svelte');
    expect(results).toHaveLength(1);
    expect(results[0].message).toContain('lacks keyboard support');
  });

  it('accepts a Svelte 5 key handler next to the click handler', () => {
    const code = '<div onclick={() => {}} onkeydown={() => {}} role="button" tabindex="0">x</div>';
    expect(checkKeyboardNavigation(svelteAst(code), code, 'Test.svelte')).toHaveLength(0);
  });

  it('still understands legacy on: directives', () => {
    const bad = '<div on:click={() => {}}>x</div>';
    expect(checkKeyboardNavigation(svelteAst(bad), bad, 'Test.svelte')).toHaveLength(1);

    const good = '<div on:click={() => {}} on:keyup={() => {}}>x</div>';
    expect(checkKeyboardNavigation(svelteAst(good), good, 'Test.svelte')).toHaveLength(0);
  });

  it('does not flag natively keyboard-accessible elements', () => {
    const code = '<button onclick={() => {}}>Go</button>';
    expect(checkKeyboardNavigation(svelteAst(code), code, 'Test.svelte')).toHaveLength(0);
  });

  it('warns on positive tabindex', () => {
    const code = '<div tabindex="3">x</div>';
    const results = checkKeyboardNavigation(svelteAst(code), code, 'Test.svelte');
    expect(results.map((r) => r.message).join('\n')).toContain('positive tabindex values (found 3)');
  });

  it('warns on an interactive element without an accessible label', () => {
    const missing = '<button onclick={() => {}}></button>';
    expect(checkAriaLabels(svelteAst(missing), missing, 'Test.svelte')).toHaveLength(1);

    const labelled = '<button aria-label="Close" onclick={() => {}}></button>';
    expect(checkAriaLabels(svelteAst(labelled), labelled, 'Test.svelte')).toHaveLength(0);
  });
});
