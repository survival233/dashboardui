import Papa from 'papaparse'

export type Loan = {
  id: string
  issuedAt: Date
  amount: number
  fundedAmount: number
  rate: number
  grade: string
  subGrade: string
  purpose: string
  state: string
  loanStatus: string
  annualIncome: number
  dti: number
  ficoLow: number
  ficoHigh: number
  installment: number
  homeOwnership: string
  empLength: string
  earlyDefault: boolean
  expectedReturn: number
  /** Collections in last 12 months (ex medical) */
  collections12MthsExMed: number
  /** Accounts currently delinquent */
  accNowDelinq: number
}

type CsvRow = Record<string, string>

function toNum(v: string | undefined) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export async function loadLcLoans(path = '/lc_loan_2016_clean.csv'): Promise<Loan[]> {
  const txt = await fetch(path).then((r) => {
    if (!r.ok) throw new Error('Failed to load CSV')
    return r.text()
  })

  const parsed = Papa.parse<CsvRow>(txt, {
    header: true,
    skipEmptyLines: true,
  })

  return parsed.data
    .map((r: CsvRow): Loan => ({
      id: r.id ?? '',
      issuedAt: new Date(r.issue_d ?? ''),
      amount: toNum(r.loan_amnt),
      fundedAmount: toNum(r.funded_amnt),
      rate: toNum(r.int_rate) * 100,
      grade: r.grade ?? 'Unknown',
      subGrade: r.sub_grade ?? 'Unknown',
      purpose: (r.purpose ?? 'unknown').replaceAll('_', ' '),
      state: r.addr_state ?? 'NA',
      loanStatus: r.loan_status ?? 'Unknown',
      annualIncome: toNum(r.annual_inc),
      dti: toNum(r.dti),
      ficoLow: toNum(r.fico_range_low),
      ficoHigh: toNum(r.fico_range_high),
      installment: toNum(r.installment),
      homeOwnership: (r.home_ownership ?? 'UNKNOWN').toUpperCase(),
      empLength: r.emp_length?.trim() || 'Unknown',
      earlyDefault: String(r.early_default) === '1',
      expectedReturn: toNum(r.return),
      collections12MthsExMed: toNum(r.collections_12_mths_ex_med),
      accNowDelinq: toNum(r.acc_now_delinq),
    }))
    .filter((x: Loan) => x.id && !Number.isNaN(x.issuedAt.getTime()))
    .sort((a: Loan, b: Loan) => a.issuedAt.getTime() - b.issuedAt.getTime())
}
