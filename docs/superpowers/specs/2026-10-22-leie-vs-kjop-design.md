# Leie vs. kjøp simulator: design

Dato: 2026-10-22
Status: godkendt i brainstorm, klar til implementeringsplan

## Formål

En statisk webapp, der viser hvornår det er billigere at købe end at leje bolig i Norge (udgangspunkt Bærum). Brugeren justerer forudsætninger og ser break-even-husleje i en matrix over ejertid og prisstigning, en nedbrydning af ejeromkostningen, og hvilken prisstigning en given husleje kræver.

Målgruppe: Fredrik og få andre (partner, familie, rådgiver), der får et link. UI på norsk bokmål. Hostet på GitHub Pages fra et offentligt repo `FredNors/bolig`.

Succeskriterier:

- Modellen reproducerer alle referencetal fra handoff'et (se Tests).
- Et scenarie kan deles via URL og åbner identisk hos modtageren.
- Desktop-layout er primært; på mobil stables panelerne og matrixen kan scrolles.
- Deploy sker automatisk ved push til `main`, og fejlende tests blokerer deploy.

Ikke i første version: fuld fellesgjeld-model, formuesskatt, diskontering, renterisiko, flere sprog (men tekster samles i én fil).

## Modellen

Alle beløb er nominelle NOK uden diskontering. Omkostningen ved at eje over `years` år sammenlignes med summen af husleje over samme periode.

### Input og defaults

| Nøgle | Default | Beskrivelse |
|---|---|---|
| `ownershipType` | `selveier` | `selveier` eller `borettslag` |
| `price` | 9 000 000 | Købspris (totalpris) |
| `equity` | 2 000 000 | Egenkapital |
| `rate` | 0.06 | Effektiv årlig lånerente |
| `loanYears` | 30 | Løbetid, annuitetslån |
| `taxRate` | 0.22 | Skatteværdi af rentefradrag |
| `years` | 3 | Ejertid i hele år (1 til 10) |
| `priceGrowth` | 0.00 | Årlig boligprisstigning |
| `inflation` | 0.03 | Årlig inflation (driver drift) |
| `altReturn` | 0.03 | Afkast efter skat på egenkapital i lejescenariet |
| `docFeeRate` | 0.025 | Dokumentavgift (tvunget 0 ved borettslag) |
| `registrationFee` | 1 090 | Tinglysing |
| `bankFee` | 5 000 | Etableringsgebyr |
| `sellCostRate` | 0.02 | Salgsomkostninger som andel af salgspris |
| `maintenanceRate` | 0.01 | Vedligeholdsreserve, andel af købspris pr. år |
| `insurance` | 15 000 | Bygningsforsikring pr. år |
| `municipalFees` | 18 000 | Kommunale gebyrer pr. år |
| `propertyTax` | 0 | Eiendomsskatt pr. år |
| `commonCosts` | 0 | Felleskostnader pr. år (vises kun ved borettslag) |
| `taxGain` | false | Beskat gevinst ved salg med 22 % |
| `rentGrowth` | 0.03 | Årlig lejestigning |
| `startRent` | 35 000 | Husleje pr. md. i år 1 |

Validering (clamp ved input og ved URL-parse): `years` 1 til 10 heltal, `loanYears` 1 til 40, `rate` 0 til 0.20, `priceGrowth` −0.10 til 0.20, øvrige procenter 0 til 1, beløb ≥ 0, `equity` ≤ `price`.

### Beregning

```
effectiveDocFeeRate = ownershipType == 'borettslag' ? 0 : docFeeRate
loan        = price - equity
rm          = (1 + rate)^(1/12) - 1
n           = loanYears * 12
pmt         = loan * rm / (1 - (1 + rm)^-n)

bal = loan; totalInterest = 0
for m in 1..years*12:
    i = bal * rm
    totalInterest += i
    bal -= (pmt - i)
principalPaid = loan - bal

netInterest   = totalInterest * (1 - taxRate)
buyCosts      = price * effectiveDocFeeRate + registrationFee + bankFee
salePrice     = price * (1 + priceGrowth)^years
sellCosts     = salePrice * sellCostRate
grossGain     = salePrice - price
gain          = taxGain ? grossGain * (1 - 0.22) : grossGain   // tab giver tilsvarende fradrag
runningYear0  = price * maintenanceRate + insurance + municipalFees + propertyTax + commonCosts
running       = sum over y=0..years-1 of runningYear0 * (1 + inflation)^y
opportunity   = (equity + buyCosts) * ((1 + altReturn)^years - 1)

ownCost       = netInterest + buyCosts + sellCosts + running + opportunity - gain
rentFactor    = sum over y=0..years-1 of 12 * (1 + rentGrowth)^y
breakEvenRent = ownCost / rentFactor
cashNeeded    = equity + buyCosts
```

Bemærk at `commonCosts` indgår i `runningYear0` uanset `ownershipType`; UI'et skjuler blot feltet (og nulstiller det) ved selveier.

### Omvendte beregninger

- `requiredGrowth(inputs, startRent)`: bisektion over `priceGrowth` i [−0.10, 0.20] indtil `ownCost == startRent * rentFactor`, 60 iterationer. Returnerer `null` hvis køb er billigere end leje selv ved −10 % eller dyrere selv ved +20 %.
- `minYearsToBreakEven(inputs, startRent)`: itererer `years` 1..10 og returnerer første år hvor `ownCost <= startRent * rentFactor`, ellers `null`.

### Modul-API (`src/model/`)

```ts
export interface Inputs { ...alle nøgler ovenfor undtagen startRent }
export interface OwnCostResult {
  pmt, totalInterest, netInterest, principalPaid, buyCosts, salePrice,
  grossGain, gain, sellCosts, running, opportunity, ownCost, rentFactor,
  breakEvenRent, cashNeeded: number
}
export const DEFAULT_INPUTS: Inputs
export function computeOwnCost(inputs: Inputs): OwnCostResult
export function requiredGrowth(inputs: Inputs, startRent: number): number | null
export function minYearsToBreakEven(inputs: Inputs, startRent: number): number | null
export function breakEvenMatrix(inputs: Inputs, years: number[], growths: number[]): number[][]
```

Modulet importerer intet fra React eller DOM.

## State og URL

Én hook `useInputs()` i `src/state/` holder `{ inputs: Inputs, startRent: number }`. Den valgte celle i matrixen er `inputs.years` og `inputs.priceGrowth`; klik på en celle opdaterer dem.

URL-synkronisering i `src/state/urlState.ts`:

- `serialize(state): URLSearchParams` skriver kun felter der afviger fra default.
- `parse(params): Partial<state>` ignorerer ukendte nøgler og ugyldige værdier og clamper gyldige.
- Procenter skrives som procent med op til to decimaler (`rate=6`, `priceGrowth=2.5`), beløb som heltal, `ownershipType` som `type=borettslag`, `taxGain` som `taxGain=1`.
- Hooken læser URL ved mount og skriver med `history.replaceState` ved hver ændring (ingen historik-spam).

## UI

Layout: venstre panel ca. 320 px med input, hovedområde til højre med tre visninger under hinanden. Under 900 px bredde stables panelet over hovedområdet; matrixen får vandret scroll.

Komponenter i `src/components/`:

- `InputPanel`: segmenteret toggle Selveier / Borettslag øverst. Fire grupper: Bolig og lån, Engangskostnader, Drift, Leiescenario. Talfelter med enhed; pris, egenkapital, rente, eietid og leie har også slider. Checkbox "Skattlegg gevinst (22 %)". Nederst boksen "Likviditet": månedlig ydelse og kontantbehov ved køb.
- `Matrix`: rækker eietid 1..10, kolonner prisvekst 0 til 5 % i trin af 0,5 (11 kolonner). Cellen viser break-even-leie. Grøn hvis under `startRent`, rød hvis over; intensitet efter relativ afstand (klippet ved ±50 %). Klik vælger celle. Advarsel over matrixen når `years == 1`: skattepligtig gevinst, med knap der slår `taxGain` til.
- `Breakdown`: Recharts stablet søjle for valgt celle: netto renter, kjøpskostnader, salgskostnader, drift, tapt avkastning som positive segmenter; verdistigning som negativt segment. Ved siden af en tabel med samme tal og sum `ownCost`.
- `GrowthCurve`: Recharts linje, x = eietid 1..10, y = `requiredGrowth`. Tekstlinje ovenover for valgt eietid: "Ved leie på 35 000 kr/mnd må boligen stige 2,36 % per år ved 3 års eietid." Huller i kurven hvor `requiredGrowth` er `null`.
- `Caveats`: foldbar sektion med forbeholdene fra handoff'et.

Formatering i `src/format.ts`: `Intl.NumberFormat('nb-NO')` giver mellemrum som tusindtalsseparator og komma som decimal. Beløb vises som "52 216 kr", procent som "2,36 %".

Alle UI-tekster i `src/i18n/nb.ts` som et fladt objekt.

Forbehold der vises i appen:

- Gevinst er skattefri kun ved mere end 1 års ejertid og 12 af seneste 24 måneders beboelse.
- Afdrag er ikke en omkostning (bygger egenkapital); likviditetsboksen viser det separat.
- Ikke medregnet: el, varme, internet, indboforsikring, formuesskatt, fellesgjeld, renterisiko, diskontering.
- Rentefradrag forudsætter fuld udnyttelse.
- Ved borettslag: læg renter og afdrag på fellesgjeld ind i felleskostnader.

## Tests

Vitest. Referencetal med defaults (price 9,0 mio., equity 2,0 mio., rente 6 %, inflation 3 %, altReturn 3 %):

Break-even-leie i år 1 (kr/md.). Tolerance ±1 for kolonnerne 0 % og 3,5 %, ±100 for 1 %, 2 % og 3 % (afrundet i kilden).

| Eietid | 0 % | 1 % | 2 % | 3 % | 3,5 % |
|---|---:|---:|---:|---:|---:|
| 1 år | 76 510 | 69 200 | 61 800 | 54 500 | 50 785 |
| 2 år | 58 567 | 51 300 | 43 900 | 36 500 | 32 779 |
| 3 år | 52 216 | 45 000 | 37 700 | 30 200 | 26 364 |
| 5 år | 46 475 | 39 400 | 32 100 | 24 400 | 20 492 |

Delresultater 3 år, 0 % (±1): pmt 41 256, totalInterest 1 203 330, netInterest 938 597, buyCosts 231 090, sellCosts 180 000, running 380 181, opportunity 206 882, ownCost 1 936 750.

Delresultater 5 år, 3,5 % (±1): totalInterest 1 976 234, netInterest 1 541 463, salePrice 10 689 177, gain 1 689 177, sellCosts 213 784, running 653 024, opportunity 355 355, ownCost 1 305 538.

`requiredGrowth` ved startRent 35 000 (±0,0001): 3 år 0,0236, 5 år 0,0161, 7 år 0,0121, 10 år 0,0079.

Yderligere modeltests: borettslag giver buyCosts = 6 090; taxGain reducerer gain med 22 %; negativ prisstigning giver negativ gain og højere ownCost; `requiredGrowth` returnerer null uden for intervallet.

URL-tests: rundtur serialize/parse giver samme state; defaults giver tom query; ugyldige værdier ignoreres.

Komponenttests (React Testing Library): ændring af startRent ændrer cellefarver; klik på celle opdaterer nedbrydningen; borettslag-toggle skjuler dokumentavgift og viser felleskostnader.

## Repo, build og deploy

- Vite + React + TypeScript, Recharts, Vitest, React Testing Library. `vite.config.ts` med `base: '/bolig/'`.
- Struktur: `src/model/`, `src/state/`, `src/components/`, `src/i18n/nb.ts`, `src/format.ts`, `src/App.tsx`, `src/main.tsx`.
- GitHub-repo `FredNors/bolig`, offentligt. Oprettes med `gh repo create` efter skift af aktiv gh-konto til FredNors; kræver bekræftelse før oprettelse.
- Workflow `.github/workflows/deploy.yml`: ved push til `main`: `npm ci`, `npm test`, `npm run build`, `actions/upload-pages-artifact` + `actions/deploy-pages`. Pages-kilde sættes til GitHub Actions.
- README: formål, modelbeskrivelse, referencetal, link til app, hvordan man kører lokalt.
