// Shipping by distance from Ohio. Keep the state lists in sync with ship_zone() in sql/RUN_ME_FIRST.sql.
export const ZONES = [
  { name: 'Zone 1 — Ohio & neighbors', states: 'OH, MI, IN, KY, WV, PA' },
  { name: 'Zone 2 — Northeast & Midwest', states: 'NY, NJ, MD, DE, DC, VA, IL, WI, TN, NC' },
  { name: 'Zone 3 — New England, South & Plains', states: 'MA, CT, RI, NH, VT, ME, SC, GA, AL, MS, MO, IA, MN, AR' },
  { name: 'Zone 4 — Florida, Texas & Mountain', states: 'FL, LA, TX, OK, KS, NE, SD, ND, CO' },
  { name: 'Zone 5 — West Coast & far away', states: 'WY, MT, ID, UT, NV, AZ, NM, WA, OR, CA, AK, HI' },
]
export const DEFAULT_ZONE_FEES = [5.99, 7.99, 9.99, 12.99, 15.99]
export const DEFAULT_INTERNATIONAL_FEE = 29.99

const BY_STATE = {}
ZONES.forEach((z, i) => z.states.split(',').forEach(c => { BY_STATE[c.trim()] = i + 1 }))

export const zoneForState = (code) => BY_STATE[String(code || '').trim().toUpperCase()] || null
