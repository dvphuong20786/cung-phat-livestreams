import{fileURLToPath}from'node:url';

const webRoot=fileURLToPath(new URL('.',import.meta.url)).replaceAll('\\','/');

/** @type {import('tailwindcss').Config} */
export default{
  content:[`${webRoot}index.html`,`${webRoot}src/**/*.{ts,tsx}`],
  theme:{extend:{fontFamily:{sans:['Inter','ui-sans-serif','system-ui']},colors:{ink:'#080b16',panel:'#111526'}}},
  plugins:[],
};
