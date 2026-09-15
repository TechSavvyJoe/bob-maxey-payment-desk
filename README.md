# Bob Maxey Payment Desk

A fast, mobile-friendly vehicle payment calculator for dealership sales conversations. It runs entirely in the browser and does not save or transmit customer information.

## What it includes

- Live payment, amount-financed, out-the-door, tax, fee, and trade-equity calculations
- Editable target payment, target out-the-door, and target amount-financed tools with exact adjustment options
- Editable term, APR, and total-down-payment rate grid; tap any payment to apply it
- Dealer View with calculation detail and a simplified Customer View using the same deal figures
- Michigan 6% sales tax and 2026 trade tax credit capped at $12,000, based on trade allowance rather than payoff
- Fixed dealership defaults: $280 taxable document fee and $34 taxable CRV fee
- Transfer fees: $10 plate transfer, $5 state transfer fee, and $15 cash or $16 financed title fee
- Editable new-plate amount that replaces the transfer/title group
- Service contracts, GAP, accessories, and other add-ons automatically included in amount financed on finance deals and in the cash total on cash deals
- Responsive mobile accordions, compact term cards, clear borders, and large touch-friendly fields

## Run locally

```bash
npm install
npm run dev
```

## Verify and build

```bash
npm test
npm run build
```

## Calculation notes

The Michigan trade tax credit is calculated from the trade allowance, capped at $12,000 for 2026. Trade payoff affects equity but does not reduce the tax credit. Manufacturer rebates are applied after sales tax. Optional products can be marked taxable when appropriate.

Sources:

- [Michigan Treasury RAB 2022-17](https://www.michigan.gov/taxes/rep-legal/rab/2022-revenue-administrative-bulletins/revenue-administrative-bulletin-2022-17)
- [Michigan Department of State Dealer Manual, Chapter 8](https://www.michigan.gov/-/media/Project/Websites/sos/01preston/Dealer_Manual_Chapter_8.pdf?rev=0add5ff85e614bca8738c37d0e0ab072)

This tool provides estimates only. Actual lender payments, taxes, state charges, and final deal figures should be confirmed in the dealership's approved systems.
