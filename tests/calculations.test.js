import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CALCULATION_DEFAULTS,
  RATE_GRID_DEFAULTS,
  calculateDeal,
  calculatePayment,
  calculateRateGrid,
  fromCents,
  paymentFactor,
  solveAmountFinancedForPayment,
  solveCentValueForTarget,
  solveOptionalItemAmountForTarget,
  solveSalePriceForTarget,
  toCents,
} from '../src/lib/calculations.js';

test('currency helpers round decimal values to exact cents', () => {
  assert.equal(toCents('$1,234.565'), 123_457);
  assert.equal(toCents(1.005), 101);
  assert.equal(toCents(-1.005), -101);
  assert.equal(toCents('1e2'), 10_000);
  assert.equal(fromCents(123_457), 1_234.57);
  assert.throws(() => toCents(Number.NaN), /finite/);
});

test('exports the current Michigan constants and standard RATE grid terms', () => {
  assert.deepEqual(CALCULATION_DEFAULTS, {
    salesTaxRate: 0.06,
    tradeTaxCreditCap: 12_000,
    documentFee: 280,
    crvFee: 34,
    plateTransferFee: 10,
    additionalTransferFee: 5,
    cashTitleFee: 15,
    financeTitleFee: 16,
  });
  assert.deepEqual(RATE_GRID_DEFAULTS.termMonths, [36, 48, 60, 72, 84]);
  assert.deepEqual(RATE_GRID_DEFAULTS.downPayments, [0, 1_000, 2_000, 3_000, 5_000]);
});

test('matrix 1: standard financed deal includes taxable fixed fees', () => {
  const deal = calculateDeal({ salePrice: 30_000, apr: 6, termMonths: 60 });

  assert.equal(deal.fees.documentFee, 280);
  assert.equal(deal.fees.crvFee, 34);
  assert.equal(deal.fees.titleFee, 16);
  assert.equal(deal.fees.totalFees, 345);
  assert.equal(deal.taxBase, 30_314);
  assert.equal(deal.salesTax, 1_818.84);
  assert.equal(deal.outTheDoor, 32_163.84);
  assert.equal(deal.amountFinanced, 32_163.84);
  assert.equal(deal.payment, 621.82);
  assert.equal(deal.totalOfPayments, 37_309.03);
  assert.equal(deal.totalInterest, 5_145.19);
});

test('matrix 2: rebate is after tax, down only reduces amount financed, and 0% interest stays zero', () => {
  const deal = calculateDeal({
    salePrice: 25_000,
    manufacturerRebate: 2_000,
    cashDown: 3_000,
    apr: 0,
    termMonths: 60,
  });

  assert.equal(deal.taxBase, 25_314);
  assert.equal(deal.salesTax, 1_518.84);
  assert.equal(deal.outTheDoor, 24_863.84);
  assert.equal(deal.amountFinanced, 21_863.84);
  assert.equal(deal.payment, 364.4);
  assert.equal(deal.totalOfPayments, 21_863.84);
  assert.equal(deal.totalInterest, 0);
  assert.equal(deal.dueAtSigning, 3_000);
});

test('matrix 3: trade tax credit is capped at $12,000 and uses allowance, not payoff', () => {
  const deal = calculateDeal({
    salePrice: 40_000,
    tradeAllowance: 15_000,
    tradePayoff: 7_000,
    apr: 6.9,
    termMonths: 72,
  });

  assert.equal(deal.tradeTaxCredit, 12_000);
  assert.equal(deal.tradeEquity, 8_000);
  assert.equal(deal.taxBase, 28_314);
  assert.equal(deal.salesTax, 1_698.84);
  assert.equal(deal.amountFinanced, 34_043.84);
  assert.equal(deal.payment, 578.78);

  const differentPayoff = calculateDeal({
    salePrice: 40_000,
    tradeAllowance: 15_000,
    tradePayoff: 20_000,
    apr: 6.9,
    termMonths: 72,
  });
  assert.equal(differentPayoff.tradeTaxCredit, 12_000);
  assert.equal(differentPayoff.salesTax, deal.salesTax);
  assert.notEqual(differentPayoff.amountFinanced, deal.amountFinanced);
});

test('matrix 4: negative equity can be rolled or paid upfront', () => {
  const input = {
    salePrice: 35_000,
    tradeAllowance: 10_000,
    tradePayoff: 14_500,
    apr: 7.5,
    termMonths: 72,
  };
  const rolled = calculateDeal({ ...input, rollNegativeEquity: true });
  const paidUpfront = calculateDeal({ ...input, rollNegativeEquity: false });

  assert.equal(rolled.tradeEquity, -4_500);
  assert.equal(rolled.salesTax, 1_518.84);
  assert.equal(rolled.amountFinanced, 41_363.84);
  assert.equal(rolled.payment, 715.19);
  assert.equal(rolled.dueAtSigning, 0);

  assert.equal(paidUpfront.amountFinanced, 36_863.84);
  assert.equal(paidUpfront.payment, 637.38);
  assert.equal(paidUpfront.dueAtSigning, 4_500);
});

test('matrix 5: manufacturer rebate and dealer price discount have different tax effects', () => {
  const rebateDeal = calculateDeal({
    salePrice: 30_000,
    manufacturerRebate: 3_000,
    apr: 5,
    termMonths: 60,
  });
  const discountDeal = calculateDeal({ salePrice: 27_000, apr: 5, termMonths: 60 });

  assert.equal(rebateDeal.salesTax, 1_818.84);
  assert.equal(rebateDeal.amountFinanced, 29_163.84);
  assert.equal(rebateDeal.payment, 550.36);
  assert.equal(discountDeal.salesTax, 1_638.84);
  assert.equal(discountDeal.amountFinanced, 28_983.84);
  assert.equal(discountDeal.payment, 546.96);
});

test('matrix 6: only optional items marked taxable enter the tax base', () => {
  const deal = calculateDeal({
    salePrice: 32_000,
    manufacturerRebate: 1_000,
    cashDown: 2_000,
    apr: 8,
    termMonths: 72,
    optionalItems: [
      { id: 'service-contract', amount: 1_800, taxable: false },
      { id: 'accessory', amount: 500, taxable: true },
    ],
  });

  assert.equal(deal.taxableOptions, 500);
  assert.equal(deal.nonTaxableOptions, 1_800);
  assert.equal(deal.taxBase, 32_814);
  assert.equal(deal.salesTax, 1_968.84);
  assert.equal(deal.outTheDoor, 35_613.84);
  assert.equal(deal.amountFinanced, 33_613.84);
  assert.equal(deal.payment, 589.36);
});

test('matrix 7: new plate amount replaces every transfer and title fee', () => {
  const newPlate = calculateDeal({
    salePrice: 28_000,
    plateMode: 'new',
    newPlateAmount: 250,
    apr: 6.5,
    termMonths: 60,
  });
  const transfer = calculateDeal({
    salePrice: 28_000,
    plateMode: 'transfer',
    apr: 6.5,
    termMonths: 60,
  });

  assert.equal(newPlate.fees.newPlateAmount, 250);
  assert.equal(newPlate.fees.plateTransferFee, 0);
  assert.equal(newPlate.fees.additionalTransferFee, 0);
  assert.equal(newPlate.fees.titleFee, 0);
  assert.equal(newPlate.fees.totalFees, 564);
  assert.equal(newPlate.salesTax, 1_698.84);
  assert.equal(newPlate.outTheDoor, 30_262.84);
  assert.equal(newPlate.payment, 592.13);
  assert.equal(transfer.outTheDoor, 30_043.84);
  assert.equal(newPlate.outTheDoor - transfer.outTheDoor, 219);
});

test('matrix 8: cash transfer deal uses the $15 title fee', () => {
  const deal = calculateDeal({ salePrice: 20_000, dealType: 'cash' });

  assert.equal(deal.fees.titleFee, 15);
  assert.equal(deal.fees.totalFees, 344);
  assert.equal(deal.taxBase, 20_314);
  assert.equal(deal.salesTax, 1_218.84);
  assert.equal(deal.outTheDoor, 21_562.84);
  assert.equal(deal.dueAtSigning, 21_562.84);
  assert.equal(deal.amountFinanced, 0);
  assert.equal(deal.payment, 0);
});

test('matrix 9: reverse payment and dealer-price solvers hit target cents', () => {
  const target550 = solveAmountFinancedForPayment({
    targetPayment: 550,
    apr: 6,
    termMonths: 60,
  });
  const target650 = solveAmountFinancedForPayment({
    targetPayment: 650,
    apr: 6,
    termMonths: 60,
  });

  assert.equal(target550.amountFinanced, 28_449.06);
  assert.equal(target550.payment, 550);
  assert.equal(target550.exact, true);
  assert.equal(target650.amountFinanced, 33_621.61);
  assert.equal(target650.payment, 650);
  assert.equal(target650.exact, true);

  const dealerDiscount = solveSalePriceForTarget(
    { salePrice: 30_000, apr: 6, termMonths: 60 },
    { target: target550.amountFinanced, metric: 'amountFinanced' },
  );
  assert.equal(dealerDiscount.salePrice, 26_495.49);
  assert.equal(dealerDiscount.adjustment, 3_504.51);
  assert.equal(dealerDiscount.deal.salesTax, 1_608.57);
  assert.equal(dealerDiscount.deal.amountFinanced, 28_449.06);
  assert.equal(dealerDiscount.deal.payment, 550);

  const taxableRoom = solveOptionalItemAmountForTarget(
    {
      salePrice: 30_000,
      apr: 6,
      termMonths: 60,
      optionalItems: [{ id: 'taxable-accessory', amount: 0, taxable: true }],
    },
    { itemIndex: 0, target: target650.amountFinanced, metric: 'amountFinanced' },
  );
  assert.equal(taxableRoom.optionalItemAmount, 1_375.25);
  assert.equal(taxableRoom.deal.salesTax, 1_901.36);
  assert.equal(taxableRoom.deal.amountFinanced, 33_621.61);
  assert.equal(taxableRoom.deal.payment, 650);
});

test('matrix 10: target amount financed exposes the remaining gap after removing an item', () => {
  const base = {
    salePrice: 32_000,
    manufacturerRebate: 1_000,
    cashDown: 2_000,
    apr: 8,
    termMonths: 72,
    optionalItems: [
      { id: 'service-contract', amount: 1_800, taxable: false },
      { id: 'accessory', amount: 500, taxable: true },
    ],
  };
  const deal = calculateDeal(base);
  assert.equal(deal.cents.amountFinanced - toCents(33_000), toCents(613.84));

  const removeAccessory = solveOptionalItemAmountForTarget(base, {
    itemIndex: 1,
    target: 33_000,
    metric: 'amountFinanced',
  });
  assert.equal(removeAccessory.optionalItemAmount, 0);
  assert.equal(removeAccessory.deal.amountFinanced, 33_083.84);
  assert.equal(removeAccessory.difference, 83.84);
  assert.equal(removeAccessory.exact, false);

  const solvedWithExtraDown = calculateDeal({ ...base, cashDown: 2_613.84 });
  assert.equal(solvedWithExtraDown.amountFinanced, 33_000);
  assert.equal(solvedWithExtraDown.payment, 578.6);
});

test('matrix 11: OTD solver accounts for tax rounding at every candidate cent', () => {
  const solved = solveSalePriceForTarget(
    { salePrice: 30_000, apr: 6, termMonths: 60 },
    { target: 31_000, metric: 'outTheDoor' },
  );

  assert.equal(solved.salePrice, 28_902.04);
  assert.equal(solved.adjustment, 1_097.96);
  assert.equal(solved.deal.salesTax, 1_752.96);
  assert.equal(solved.deal.outTheDoor, 31_000);
  assert.equal(solved.exact, true);

  const postTaxRebate = calculateDeal({ salePrice: 30_000, manufacturerRebate: 1_163.84 });
  assert.equal(postTaxRebate.outTheDoor, 31_000);
  assert.equal(postTaxRebate.salesTax, 1_818.84);
});

test('matrix 12: RATE grid uses total down and independently editable row APRs', () => {
  const grid = calculateRateGrid(
    { salePrice: 30_000, apr: 6, termMonths: 60, cashDown: 777 },
    {
      rows: [
        { termMonths: 60, apr: 6 },
        { termMonths: 72, apr: 7 },
      ],
      downPayments: [0, 1_000, 2_000, 3_000, 5_000],
      customDownPayment: 4_321,
    },
  );

  assert.equal(grid.amountBeforeCashDown, 32_163.84);
  assert.deepEqual(
    grid.rows[0].cells.slice(0, 5).map((cell) => cell.payment),
    [621.82, 602.48, 583.15, 563.82, 525.15],
  );
  assert.deepEqual(
    grid.rows[1].cells.slice(0, 5).map((cell) => cell.payment),
    [548.36, 531.31, 514.26, 497.21, 463.12],
  );
  assert.equal(grid.columns.at(-1).label, 'Custom');
  assert.equal(grid.columns.at(-1).cashDown, 4_321);

  const selected = grid.rows[1].cells[2];
  assert.equal(selected.termMonths, 72);
  assert.equal(selected.apr, 7);
  assert.equal(selected.cashDown, 2_000);
  assert.equal(selected.amountFinanced, 30_163.84);
  assert.equal(selected.payment, 514.26);
});

test('optional products always follow the purchase with no per-item upfront switch', () => {
  const financeWithoutProduct = calculateDeal({
    salePrice: 30_000,
    apr: 6,
    termMonths: 60,
  });
  const financed = calculateDeal({
    salePrice: 30_000,
    apr: 6,
    termMonths: 60,
    optionalItems: [{ amount: 1_000, taxable: false }],
  });
  const cashWithoutProduct = calculateDeal({
    salePrice: 30_000,
    dealType: 'cash',
  });
  const cash = calculateDeal({
    salePrice: 30_000,
    dealType: 'cash',
    optionalItems: [{ amount: 1_000, taxable: false }],
  });

  assert.equal(
    financed.cents.amountFinanced - financeWithoutProduct.cents.amountFinanced,
    toCents(1_000),
  );
  assert.equal(financed.dueAtSigning, financeWithoutProduct.dueAtSigning);
  assert.equal(cash.cents.outTheDoor - cashWithoutProduct.cents.outTheDoor, toCents(1_000));
  assert.equal(cash.cents.dueAtSigning - cashWithoutProduct.cents.dueAtSigning, toCents(1_000));
});

test('cash trade settlement changes cash due, never tax, and retains add-ons', () => {
  const positiveEquity = calculateDeal({
    salePrice: 30_000,
    dealType: 'cash',
    tradeAllowance: 10_000,
    tradePayoff: 0,
    optionalItems: [{ amount: 2_000, taxable: false }],
  });
  const negativeEquity = calculateDeal({
    salePrice: 30_000,
    dealType: 'cash',
    tradeAllowance: 10_000,
    tradePayoff: 14_000,
    optionalItems: [{ amount: 2_000, taxable: false }],
  });

  assert.equal(positiveEquity.outTheDoor, 33_562.84);
  assert.equal(positiveEquity.dueAtSigning, 23_562.84);
  assert.equal(negativeEquity.dueAtSigning, 37_562.84);
  assert.equal(negativeEquity.salesTax, positiveEquity.salesTax);
});

test('excess trade equity becomes a cash customer credit instead of negative due', () => {
  const deal = calculateDeal({
    salePrice: 5_000,
    dealType: 'cash',
    tradeAllowance: 12_000,
    tradePayoff: 0,
  });

  assert.equal(deal.dueAtSigning, 0);
  assert.equal(deal.customerCredit, 6_656);
  assert.equal(deal.balanceAfterTrade, -6_656);
});

test('negative amount financed remains visible while payment is zero with a warning', () => {
  const deal = calculateDeal({ salePrice: 1_000, manufacturerRebate: 10_000 });

  assert.ok(deal.amountFinanced < 0);
  assert.equal(deal.payment, 0);
  assert.match(deal.paymentWarning, /Credits exceed/);
  assert.ok(deal.warnings.some((warning) => /Credits exceed/.test(warning)));
});

test('generic cent solver returns the closest attainable cent and calculation result', () => {
  const solution = solveCentValueForTarget({
    target: 5,
    min: 0,
    max: 10,
    evaluate: (candidateCents) => ({
      metricCents: candidateCents * 2,
      result: { candidateCents },
    }),
  });

  assert.equal(solution.value, 2.5);
  assert.equal(solution.metric, 5);
  assert.equal(solution.exact, true);
  assert.deepEqual(solution.result, { candidateCents: 250 });
});

test('view-only state never changes a deal result', () => {
  const input = {
    salePrice: 31_234.56,
    tradeAllowance: 7_500,
    tradePayoff: 2_500,
    cashDown: 1_250,
    apr: 7.25,
    termMonths: 72,
    optionalItems: [{ amount: 900, taxable: false }],
  };
  const dealer = calculateDeal({ ...input, view: 'dealer' });
  const customer = calculateDeal({ ...input, view: 'customer' });

  assert.deepEqual(customer, dealer);
});

test('payment helper uses full precision and validates term and APR', () => {
  const payment = calculatePayment({ principal: 32_163.84, apr: 6, termMonths: 60 });
  assert.equal(paymentFactor(0, 60), 1 / 60);
  assert.equal(payment.payment, 621.82);
  assert.equal(payment.totalOfPayments, 37_309.03);
  assert.throws(
    () => calculatePayment({ principal: 10_000, apr: -1, termMonths: 60 }),
    /APR cannot be negative/,
  );
  assert.throws(
    () => calculatePayment({ principal: 10_000, apr: 5, termMonths: 0 }),
    /positive whole number/,
  );
});
