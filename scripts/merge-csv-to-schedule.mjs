#!/usr/bin/env node
// When2meet CSV 4개 병합 → public/schedule.json (인자 없으면 Downloads 기본)

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { parseCsvText, mergeParsedResults } from '../src/lib/parseWhen2MeetCsv.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')

const defaultPaths = [
  join(process.env.HOME || process.env.USERPROFILE, 'Downloads', 'when2meet1.csv'),
  join(process.env.HOME || process.env.USERPROFILE, 'Downloads', 'when2meet2.csv'),
  join(process.env.HOME || process.env.USERPROFILE, 'Downloads', 'when2meet3.csv'),
  join(process.env.HOME || process.env.USERPROFILE, 'Downloads', 'when2meet4.csv'),
]

const csvPaths = process.argv.slice(2).length ? process.argv.slice(2) : defaultPaths

const results = []
for (const p of csvPaths) {
  try {
    const text = readFileSync(p, 'utf-8')
    const parsed = parseCsvText(text, undefined, {})
    if (parsed.slotKeys.length || parsed.people.length) {
      results.push(parsed)
      console.log(p, '->', parsed.slotKeys.length, 'slots,', parsed.people.length, 'people')
    }
  } catch (e) {
    console.error(p, e.message)
  }
}

if (!results.length) {
  console.error('유효한 CSV가 없습니다.')
  process.exit(1)
}

const merged = mergeParsedResults(results)
const outPath = join(projectRoot, 'public', 'schedule.json')
writeFileSync(outPath, JSON.stringify(merged, null, 2), 'utf-8')
console.log('Written:', outPath)
console.log('Total:', merged.slotKeys.length, 'slots,', merged.people.length, 'people')
