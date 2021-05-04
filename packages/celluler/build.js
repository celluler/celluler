const path = require('path')
const fs = require('fs')
const esbuild = require('esbuild')
const outDir = path.resolve('dist')

const filter = (x) => ['.bin', '@app'].indexOf(x) === -1

let nodeModules = fs.readdirSync('node_modules').filter(filter)
if (fs.existsSync('../../node_modules')) {
  nodeModules = nodeModules.concat(fs.readdirSync('../../node_modules').filter(filter))
}

nodeModules.push('./Runner')

console.time('Build Production')
const buildOptions = {
  color: true,
  minify: false,
  bundle: true,
  sourcemap: false,
  platform: 'node',
  tsconfig: './tsconfig.json',
  logLevel: 'error',
  external: nodeModules,
}

try {
  const entries = {
    Runner: 'src/Runner.ts',
    service: 'src/service.ts',
  }
  const names = Object.keys(entries)
  const entriesBuild = names.map((fileName) =>
    esbuild.build({
      entryPoints: [entries[fileName]],
      outfile: `${outDir}/${fileName}.js`,
      ...buildOptions,
    }),
  )
  Promise.all(entriesBuild).then(() => {
    console.timeEnd('Build Production')
  })
} catch (e) {
  console.error(e)
}
