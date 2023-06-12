import { watch } from 'fs'
import { readFile, writeFile, mkdir } from 'fs/promises'
import logger from '../src/logger.js'

const [, , ENV = 'dev', ...args] = process.argv
const ENV_FILE = new URL(`../.env.${ENV}`, import.meta.url)

void createConfigFile()

if (args.includes('--with-types')) {
    createTypeDefinition().catch((error) => {
        logger.error('Failed creating type definition', error)
    })
}

if (args.includes('--watch')) {
    watch(ENV_FILE, () => {
        void createConfigFile()
    })
}

async function readEnvFile(filePath: URL): Promise<Record<string, string>> {
    const content = await readFile(filePath, 'utf-8')
    const lines = content.trim().split('\n')

    return lines.reduce((map, line) => {
        const [key, value] = line.split('=').map((s) => s.trim())
        if (!key) return map
        return {
            ...map,
            [key]: value,
        }
    }, {})
}

async function createTypeDefinition(): Promise<void> {
    const envConfig = await readEnvFile(ENV_FILE)
    const format = (key: string): string => `export const ${key}: string`

    const content = `${Object.keys(envConfig).map(format).join('\n')}
`

    return writeFile(new URL('../src/config.d.ts', import.meta.url), content)
}

async function createConfigFile(): Promise<void> {
    try {
        const envConfig = await readEnvFile(ENV_FILE)
        const format = ([key, value]: [string, string]): string =>
            `export const ${key} = "${value}";`

        const content = `"use strict";

    ${Object.entries(envConfig).map(format).join('\n')}
    `
        await mkdir(new URL('../dist/', import.meta.url), { recursive: true })
        await writeFile(new URL('../dist/config.js', import.meta.url), content)
    } catch (error) {
        logger.error(error)
        process.exit(1)
    }
}
