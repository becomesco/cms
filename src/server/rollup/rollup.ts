import * as chokidar from 'chokidar';
import * as rup from 'rollup';
import * as svelte from 'rollup-plugin-svelte';
import { terser } from 'rollup-plugin-terser';
// tslint:disable-next-line:no-var-requires
const resolve = require('@rollup/plugin-node-resolve');
// tslint:disable-next-line:no-var-requires
const commonjs = require('@rollup/plugin-commonjs');
// tslint:disable-next-line: no-var-requires
const sveltePreprocess = require('svelte-preprocess');
// tslint:disable-next-line:no-var-requires
const livereload = require('rollup-plugin-livereload');

export interface RollupResult {
  js: string;
  css: string;
}

export class Rollup {
  public static async build(config: {
    input: string;
    output: string;
    dev?: boolean;
  }): Promise<void> {
    let production: boolean;
    if (config.dev === true) {
      production = false;
    } else {
      production = process.env.SVELTE_PROD === 'true' ? true : false;
    }
    let rollupPlugins;
    if (production === false) {
      rollupPlugins = [
        svelte({
          preprocess: sveltePreprocess({
            scss: {
              includePaths: ['src/frontend'],
            },
            postcss: {
              plugins: [require('autoprefixer')],
            },
          }),
          css: css => {
            css.write(`${config.output}/bundle.css`);
          },
        }),
        resolve({
          browser: true,
          dedupe: importee =>
            importee === 'svelte' || importee.startsWith('svelte/'),
        }),
        commonjs(),
        !production && livereload(config.output),
        production && terser(),
      ];
    } else {
      rollupPlugins = [
        svelte({
          preprocess: sveltePreprocess({
            scss: {
              includePaths: ['src/frontend'],
            },
            postcss: {
              plugins: [require('autoprefixer')],
            },
          }),
          css: css => {
            css.write(`${config.output}/bundle.css`);
          },
        }),
        resolve({
          browser: true,
          dedupe: importee =>
            importee === 'svelte' || importee.startsWith('svelte/'),
        }),
        commonjs(),
        production && terser(),
      ];
    }
    const rollupInputOptions: rup.RollupOptions = {
      input: config.input,
      output: {
        sourcemap: false,
        format: 'iife',
        name: 'app',
        file: `${config.output}/bundle.js`,
      },
      plugins: rollupPlugins,
      watch: {
        clearScreen: false,
      },
    };
    const rollupOutputOptions: rup.OutputOptions = {
      sourcemap: true,
      format: 'iife',
      name: 'app',
      file: `${config.output}/bundle.js`,
    };
    const rollupGenerator = await rup.rollup(rollupInputOptions);
    rollupGenerator.write(rollupOutputOptions);
    if (production === false) {
      const watchOptions: any = [
        {
          ...rollupInputOptions,
          output: [rollupOutputOptions],
          watch: {
            chokidar,
          },
        },
      ];
      const watch = rup.watch(watchOptions);
    }
  }
}