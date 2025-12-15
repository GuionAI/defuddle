import * as esbuild from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = process.argv.includes('--dev');

// Plugin to alias ./elements/math to a specific file
const mathAliasPlugin = (mathFile) => ({
	name: 'math-alias',
	setup(build) {
		build.onResolve({ filter: /\.\/elements\/math$/ }, (args) => {
			return { path: resolve(__dirname, 'src/elements', mathFile) };
		});
	},
});

const commonConfig = {
	bundle: true,
	minify: !isDev,
	sourcemap: isDev,
	format: 'esm',
	target: 'es2020',
	platform: 'browser',
};

// Core bundle - excludes math libraries
await esbuild.build({
	...commonConfig,
	entryPoints: ['src/index.ts'],
	outfile: 'dist/index.js',
	plugins: [mathAliasPlugin('math.core.ts')],
	external: ['mathml-to-latex', 'temml', 'turndown'],
});

// Full bundle - includes math libraries
await esbuild.build({
	...commonConfig,
	entryPoints: ['src/index.full.ts'],
	outfile: 'dist/index.full.js',
	plugins: [mathAliasPlugin('math.full.ts')],
	external: ['turndown'],
});

console.log('Build complete');
