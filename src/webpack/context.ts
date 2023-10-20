import { resolve } from 'path'
import { Buffer } from 'buffer'
import process from 'process'
import sources from 'webpack-sources'
import type { Compilation } from 'webpack'
import { Parser } from 'acorn'
import type { UnpluginBuildContext } from '../types'

export function createContext(compilation?: Compilation): UnpluginBuildContext {
  return {
    parse(code: string, opts: any = {}) {
      return Parser.parse(code, {
        sourceType: 'module',
        ecmaVersion: 'latest',
        locations: true,
        ...opts,
      })
    },
    addWatchFile(id) {
      if (!compilation)
        throw new Error('unplugin/webpack: addWatchFile outside supported hooks (buildStart, buildEnd, load, transform, watchChange)');
      (compilation.fileDependencies ?? compilation.compilationDependencies).add(
        resolve(process.cwd(), id),
      )
    },
    emitFile(emittedFile) {
      const outFileName = emittedFile.fileName || emittedFile.name
      if (emittedFile.source && outFileName) {
        if (!compilation)
          throw new Error('unplugin/webpack: emitFile outside supported hooks  (buildStart, buildEnd, load, transform, watchChange)')
        compilation.emitAsset(
          outFileName,
          sources
            ? new sources.RawSource(
              // @ts-expect-error types mismatch
              typeof emittedFile.source === 'string'
                ? emittedFile.source
                : Buffer.from(emittedFile.source),
            ) as any
            : {
                source: () => emittedFile.source,
                size: () => emittedFile.source!.length,
              },
        )
      }
    },
    getWatchFiles() {
      if (!compilation)
        throw new Error('unplugin/webpack: getWatchFiles outside supported hooks (buildStart, buildEnd, load, transform, watchChange)')
      return Array.from(
        compilation.fileDependencies ?? compilation.compilationDependencies,
      )
    },
  }
}
