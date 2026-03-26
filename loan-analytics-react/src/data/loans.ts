import { addDays, startOfMonth, subMonths } from 'date-fns'

export type Loan = {
  id: string
  issuedAt: Date
  amount: number
  region: string
  purpose: string
  grade: 'A' | 'B' | 'C' | 'D' | 'E'
  status: 'Current' | 'Paid' | 'Late' | 'Charged Off'
  rate: number
  termMonths: number
  borrowerTier: 'Prime' | 'Near prime' | 'Subprime'
}

const REGIONS = ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West', 'Pacific']
const PURPOSES = ['Debt consolidation', 'Home improvement', 'Major purchase', 'Medical', 'Business', 'Other']

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function generateLoans(count = 2400, seed = 42): Loan[] {
  const rand = mulberry32(seed)
  const end = startOfMonth(new Date())
  const start = subMonths(end, 26)
  const loans: Loan[] = []

  for (let i = 0; i < count; i++) {
    const dayOffset = Math.floor(rand() * 800)
    const issuedAt = addDays(start, dayOffset)
    const region = REGIONS[Math.floor(rand() * REGIONS.length)]!
    const purpose = PURPOSES[Math.floor(rand() * PURPOSES.length)]!
    const g = rand()
    const grade: Loan['grade'] =
      g < 0.28 ? 'A' : g < 0.52 ? 'B' : g < 0.72 ? 'C' : g < 0.88 ? 'D' : 'E'
    const st = rand()
    const status: Loan['status'] =
      st < 0.72
        ? 'Current'
        : st < 0.88
          ? 'Paid'
          : st < 0.95
            ? 'Late'
            : 'Charged Off'
    const tierRoll = rand()
    const borrowerTier: Loan['borrowerTier'] =
      tierRoll < 0.55 ? 'Prime' : tierRoll < 0.82 ? 'Near prime' : 'Subprime'
    const amount = Math.round((5000 + rand() * 45000) / 100) * 100
    const rate = Math.round((grade.charCodeAt(0) - 65) * 1.8 + 5.5 + rand() * 4) / 10

    loans.push({
      id: `LN-${100000 + i}`,
      issuedAt,
      amount,
      region,
      purpose,
      grade,
      status,
      rate,
      termMonths: [36, 48, 60][Math.floor(rand() * 3)]!,
      borrowerTier,
    })
  }

  return loans.sort((a, b) => a.issuedAt.getTime() - b.issuedAt.getTime())
}
