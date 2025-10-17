import esbuild, { type Plugin } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import postcss from 'postcss';
import tailwindcss, { type Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

// Create the output directory if it doesn't exist
let _madeOutputDir = false;
const makeOutputDir = () => {
  if (_madeOutputDir) return;
  _madeOutputDir = true;
  return mkdir('public/ui', { recursive: true });
};

// Build the CSS file
const buildCSS = async () => {
  await makeOutputDir();

  const tailwindConfig: Config = {
    content: ['src/ui/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
      extend: {
        backgroundImage: {
          'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
          'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        },
      },
    },
    plugins: [tailwindcssAnimate],
  };
  const postcssInstance = postcss().use(tailwindcss(tailwindConfig));
  const inputCSS = await readFile('src/ui/input.css', 'utf8');
  const outputCSS = await postcssInstance.process(inputCSS);
  await writeFile('public/ui/output.css', outputCSS.css);
  console.log('CSS built');
};

// Plugin for esbuild to rebuild the CSS file when the UI is rebuilt
const cssPlugin: Plugin = {
  name: 'rebuild-css',
  setup(build) {
    build.onEnd(() => {
      buildCSS();
    });
  },
};

// Build the profile UI
const buildProfile = async () => {
  await makeOutputDir();

  return esbuild.context({
    entryPoints: ['src/ui/profile/index.tsx'],
    outfile: 'public/ui/profile.js',
    bundle: true,
    minify: true,
    sourcemap: false,
    format: 'esm',
    plugins: [cssPlugin],
  });
};

// Build the vault UI
const buildVault = async () => {
  await makeOutputDir();

  return esbuild.context({
    entryPoints: ['src/ui/vault/index.tsx'],
    outfile: 'public/ui/vault.js',
    bundle: true,
    minify: true,
    sourcemap: false,
    format: 'esm',
    plugins: [cssPlugin],
  });
};

// Build and watch
const [profileContext, vaultContext] = await Promise.all([buildProfile(), buildVault()]);
if (process.argv.includes('--watch')) {
  await Promise.all([profileContext.watch(), vaultContext.watch()]);
} else {
  await Promise.all([profileContext.rebuild(), vaultContext.rebuild()]);
  await Promise.all([profileContext.dispose(), vaultContext.dispose()]);
}
