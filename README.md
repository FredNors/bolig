# Leie eller kjøpe?

En liten simulator som viser ved hvilken husleie det koster det samme å leie som å kjøpe bolig i Norge (utgangspunkt Bærum). Juster forutsetningene i venstre panel, og se break-even-leie per måned i en matrise over eietid (1 til 10 år) og årlig prisvekst (−5 % til +5 %), en nedbrytning av eiekostnaden for valgt celle, og hvilken prisvekst en gitt leie krever.

Alle valg ligger i URL-en, så et scenario kan deles som lenke.

App: https://frednors.github.io/bolig/

## Kjør lokalt

```bash
npm install
npm run dev
npm test
```

Krever Node 22.

## Modellen

Alle beløp er nominelle NOK uten diskontering. Kostnaden ved å eie over `years` år sammenlignes med summen av husleie over samme periode.

### Input og standardverdier

| Nøkkel | Standard | Beskrivelse |
|---|---|---|
| `ownershipType` | `selveier` | `selveier` eller `borettslag` (borettslag setter dokumentavgift til 0) |
| `price` | 9 000 000 | Kjøpesum |
| `equity` | 2 000 000 | Egenkapital |
| `rate` | 6 % | Effektiv årlig lånerente |
| `loanYears` | 30 | Nedbetalingstid, annuitetslån |
| `taxRate` | 22 % | Skatteverdi av rentefradrag |
| `years` | 3 | Eietid i hele år (1 til 10) |
| `priceGrowth` | 0 % | Årlig boligprisvekst |
| `inflation` | 3 % | Årlig inflasjon (driver drift) |
| `altReturn` | 3 % | Avkastning etter skatt på egenkapital i leiescenariet |
| `docFeeRate` | 2,5 % | Dokumentavgift |
| `registrationFee` | 1 090 | Tinglysing |
| `bankFee` | 5 000 | Etableringsgebyr |
| `sellCostRate` | 2 % | Salgskostnader som andel av salgspris |
| `maintenanceRate` | 1 % | Vedlikeholdsreserve, andel av kjøpesum per år |
| `insurance` | 15 000 | Bygningsforsikring per år |
| `municipalFees` | 18 000 | Kommunale avgifter per år |
| `propertyTax` | 0 | Eiendomsskatt per år |
| `commonCosts` | 0 | Felleskostnader per år (borettslag) |
| `taxGain` | av | Skattlegg gevinst ved salg med 22 % |
| `rentGrowth` | 3 % | Årlig leieøkning |
| `startRent` | 35 000 | Leie per måned i år 1 |

### Beregning

```
effectiveDocFeeRate = ownershipType == 'borettslag' ? 0 : docFeeRate
loan        = price - equity
rm          = (1 + rate)^(1/12) - 1
n           = loanYears * 12
pmt         = loan * rm / (1 - (1 + rm)^-n)

bal = loan; totalInterest = 0
for m in 1..years*12 while bal > 0:
    i = bal * rm
    totalInterest += i
    bal = max(0, bal - (pmt - i))
principalPaid = loan - bal                 // avdrag, ikke en kostnad

netInterest   = totalInterest * (1 - taxRate)
buyCosts      = price * effectiveDocFeeRate + registrationFee + bankFee
salePrice     = price * (1 + priceGrowth)^years
sellCosts     = salePrice * sellCostRate
grossGain     = salePrice - price
gain          = taxGain ? grossGain * 0.78 : grossGain
runningYear0  = price * maintenanceRate + insurance + municipalFees + propertyTax + commonCosts
running       = sum over y=0..years-1 of runningYear0 * (1 + inflation)^y
opportunity   = (equity + buyCosts) * ((1 + altReturn)^years - 1)

ownCost       = netInterest + buyCosts + sellCosts + running + opportunity - gain
rentFactor    = sum over y=0..years-1 of 12 * (1 + rentGrowth)^y
breakEvenRent = ownCost / rentFactor       // leie per måned i år 1
```

Omvendt beregning: gitt leie og eietid finnes prisveksten der `ownCost == startRent * rentFactor` ved halvering i intervallet −10 % til +20 %.

## Referansetall

Med standardverdiene. Break-even-leie i år 1 (kr/måned):

| Eietid | 0 % | 1 % | 2 % | 3 % | 3,5 % |
|---|---:|---:|---:|---:|---:|
| 1 år | 76 510 | 69 200 | 61 800 | 54 500 | 50 785 |
| 2 år | 58 567 | 51 300 | 43 900 | 36 500 | 32 779 |
| 3 år | 52 216 | 45 000 | 37 700 | 30 200 | 26 364 |
| 5 år | 46 475 | 39 400 | 32 100 | 24 400 | 20 492 |

Nødvendig prisvekst ved leie 35 000/måned: 3 år 2,36 %, 5 år 1,61 %, 7 år 1,21 %, 10 år 0,79 %.

Disse tallene er låst i `src/model/*.test.ts`.

## Forbehold

- Gevinst ved salg er skattefri bare hvis salget skjer mer enn 1 år etter kjøp og du har bodd der 12 av de siste 24 månedene. Appen advarer ved 1 års eietid.
- Avdrag er ikke regnet som kostnad (de bygger egenkapital). Terminbeløp og kontantbehov vises separat.
- Ikke medregnet: strøm, oppvarming, internett, innboforsikring, formuesskatt, fellesgjeld, renterisiko og diskontering.
- Rentefradraget forutsetter full utnyttelse.
- Ved borettslag: legg renter og avdrag på fellesgjeld inn i felleskostnader.

## Teknisk

Vite, React, TypeScript, Vitest og Recharts. Ingen backend. Deploy til GitHub Pages via GitHub Actions ved push til `main`; feilende tester blokkerer deploy.
