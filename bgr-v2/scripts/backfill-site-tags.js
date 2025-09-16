// Backfill site mechanics/categories for games missing tags
// - Reads games from Supabase
// - If mechanics/categories are empty and bgg_id exists, fetch BGG via local API and convert
// - Writes mechanics/categories back to Supabase

/* eslint-disable no-console */
import dotenv from 'dotenv'
import { existsSync } from 'fs'
// Load env (.env.local preferred)
if (existsSync('.env.local')) dotenv.config({ path: '.env.local' })
else dotenv.config()
import { createClient } from '@supabase/supabase-js'
import { BGG_CATEGORY_TO_SITE_CATEGORY, BGG_CATEGORY_TO_SITE_MECHANIC, BGG_MECHANIC_TO_SITE_CATEGORY, BGG_MECHANIC_TO_SITE_MECHANIC } from '../src/lib/bgg-mapping.js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function convertBggToSiteData(bggCategories = [], bggMechanics = [], bggPublishers = []) {
  const siteCategories = new Set()
  const siteMechanics = new Set()

  bggCategories.forEach(category => {
    const mappedCat = BGG_CATEGORY_TO_SITE_CATEGORY[category]
    if (mappedCat) siteCategories.add(mappedCat)
    const mappedMech = BGG_CATEGORY_TO_SITE_MECHANIC[category]
    if (mappedMech) siteMechanics.add(mappedMech)
  })

  bggMechanics.forEach(mechanic => {
    const mappedCat = BGG_MECHANIC_TO_SITE_CATEGORY[mechanic]
    const mappedMech = BGG_MECHANIC_TO_SITE_MECHANIC[mechanic]
    if (mappedCat) siteCategories.add(mappedCat)
    if (mappedMech) siteMechanics.add(mappedMech)
  })

  return {
    siteCategories: Array.from(siteCategories),
    siteMechanics: Array.from(siteMechanics),
    normalizedPublishers: bggPublishers,
  }
}

async function fetchBggConverted(bggId) {
  const url = `${API_BASE}/api/bgg/game/${bggId}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`BGG API ${res.status}`)
  const json = await res.json()
  const data = json?.data || json
  if (!data || (!Array.isArray(data.categories) && !Array.isArray(data.mechanics))) {
    throw new Error('Invalid BGG response shape')
  }
  return convertBggToSiteData(data.categories || [], data.mechanics || [], data.publishers || [])
}

async function run() {
  console.log('Backfilling site tags (mechanics/categories) for games with missing tags...')
  let { data: games, error } = await supabase
    .from('games')
    .select('id, name, bgg_id, mechanics, categories')
    .order('id', { ascending: true })

  if (error) throw error
  if (!games) games = []

  let updated = 0
  let skipped = 0

  for (const game of games) {
    const mech = Array.isArray(game.mechanics) ? game.mechanics : []
    const cats = Array.isArray(game.categories) ? game.categories : []
    const needs = mech.length === 0 || cats.length === 0
    if (!needs) { skipped++; continue }
    if (!game.bgg_id) { console.log(`- ${game.name} (ID:${game.id}) no bgg_id, skip`); skipped++; continue }

    try {
      const converted = await fetchBggConverted(game.bgg_id)
      const nextMechanics = mech.length > 0 ? mech : converted.siteMechanics
      const nextCategories = cats.length > 0 ? cats : converted.siteCategories
      if (nextMechanics.length === 0 && nextCategories.length === 0) { skipped++; continue }

      const { error: upErr } = await supabase
        .from('games')
        .update({ mechanics: nextMechanics, categories: nextCategories })
        .eq('id', game.id)

      if (upErr) throw upErr
      updated++
      console.log(`✔ Updated ${game.name} (ID:${game.id}) -> mech:${nextMechanics.length}, cat:${nextCategories.length}`)
      await new Promise(r => setTimeout(r, 500))
    } catch (e) {
      console.warn(`! Failed ${game.name} (ID:${game.id}):`, e.message)
      await new Promise(r => setTimeout(r, 500))
    }
  }

  console.log(`Done. Updated: ${updated}, Skipped: ${skipped}, Total: ${games.length}`)
}

run().catch(err => { console.error(err); process.exit(1) })
