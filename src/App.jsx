import React, { useMemo, useRef, useState } from "react";
import { calculateDeal } from "./lib/calculations.js";
import CustomerView from "./components/CustomerView.jsx";
import DealerView from "./components/DealerView.jsx";
import MobileNav from "./components/MobileNav.jsx";
import PaymentGrid from "./components/PaymentGrid.jsx";
import ResultsPanel from "./components/ResultsPanel.jsx";
import ViewToggle from "./components/ViewToggle.jsx";

const INITIAL_DEAL = Object.freeze({
  salePrice: 38_750,
  manufacturerRebate: 1_500,
  cashDown: 2_500,
  tradeAllowance: 12_000,
  tradePayoff: 15_200,
  dealType: "finance",
  plateMode: "transfer",
  newPlateAmount: 0,
  rollNegativeEquity: true,
  apr: 6.49,
  termMonths: 72,
  optionalItems: [
    { id: "service-contract", name: "Service contract", amount: 2_195, taxable: false },
    { id: "gap-coverage", name: "GAP coverage", amount: 895, taxable: false },
  ],
});

const INITIAL_RATES = Object.freeze({
  36: 6.49,
  48: 6.49,
  60: 6.49,
  72: 6.49,
  84: 6.49,
});

const INITIAL_DOWN_PAYMENTS = Object.freeze([0, 1_000, 2_500, 4_000]);

const freshDeal = () => ({
  ...INITIAL_DEAL,
  optionalItems: INITIAL_DEAL.optionalItems.map((item) => ({ ...item })),
});

export default function App() {
  const [view, setView] = useState("dealer");
  const [dealInput, setDealInput] = useState(freshDeal);
  const [gridRates, setGridRates] = useState({ ...INITIAL_RATES });
  const [gridDownPayments, setGridDownPayments] = useState([...INITIAL_DOWN_PAYMENTS]);
  const [targetType, setTargetType] = useState("payment");
  const [targetValues, setTargetValues] = useState({
    payment: 650,
    outTheDoor: 40_000,
    amountFinanced: 40_000,
  });
  const [solverExpanded, setSolverExpanded] = useState(false);
  const [accordions, setAccordions] = useState({
    vehicle: true,
    trade: true,
    taxes: true,
    roll: true,
  });
  const targetInputRef = useRef(null);
  const itemCounter = useRef(1);

  const result = useMemo(() => calculateDeal(dealInput), [dealInput]);

  const updateField = (field, value) => {
    if (field === "dealType" && value === "cash") {
      setTargetType("outTheDoor");
    }
    if (field === "apr") {
      setGridRates((current) => ({ ...current, [dealInput.termMonths]: value }));
    }
    setDealInput((current) => {
      const next = { ...current, [field]: value };
      if (field === "termMonths") next.apr = Number(gridRates[value] ?? current.apr);
      return next;
    });
  };

  const updateItem = (index, patch) => {
    setDealInput((current) => ({
      ...current,
      optionalItems: current.optionalItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    }));
  };

  const addItem = (preset = {}) => {
    const id = `add-on-${itemCounter.current}`;
    itemCounter.current += 1;
    setDealInput((current) => ({
      ...current,
      optionalItems: [
        ...current.optionalItems,
        {
          id,
          name: preset.name ?? "Additional product",
          amount: preset.amount ?? 0,
          taxable: preset.taxable ?? false,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    setDealInput((current) => ({
      ...current,
      optionalItems: current.optionalItems.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const applyItemPatch = ({ index, amount }) => updateItem(index, { amount });

  const applyPatch = (patch) => {
    setDealInput((current) => ({ ...current, ...patch }));
    if (patch.termMonths && patch.apr !== undefined) {
      setGridRates((current) => ({ ...current, [patch.termMonths]: patch.apr }));
    } else if (patch.apr !== undefined) {
      setGridRates((current) => ({ ...current, [dealInput.termMonths]: patch.apr }));
    }
  };

  const resetDeal = () => {
    setDealInput(freshDeal());
    setGridRates({ ...INITIAL_RATES });
    setGridDownPayments([...INITIAL_DOWN_PAYMENTS]);
    setTargetType("payment");
    setTargetValues({ payment: 650, outTheDoor: 40_000, amountFinanced: 40_000 });
    setSolverExpanded(false);
    setAccordions({ vehicle: true, trade: true, taxes: true, roll: true });
    itemCounter.current = 1;
  };

  const setTargetValue = (type, value) => {
    setTargetValues((current) => ({ ...current, [type]: value }));
  };

  const activatePaymentTarget = (value) => {
    setTargetType("payment");
    setTargetValue("payment", value);
  };

  const paymentTargetProps = {
    paymentTarget: targetValues.payment,
    onPaymentTargetChange: (value) => setTargetValue("payment", value),
    onActivatePaymentTarget: activatePaymentTarget,
  };

  const targetProps = {
    targetType,
    targetValues,
    onTargetTypeChange: setTargetType,
    onTargetValueChange: setTargetValue,
    gridRates,
    expanded: solverExpanded,
    onExpandedChange: setSolverExpanded,
    onApplyPatch: applyPatch,
    onApplyItemPatch: applyItemPatch,
    onAddRoomItem: (amount) => addItem({ amount }),
    targetInputRef,
  };

  const applyGridScenario = ({ termMonths, apr, cashDown }) => {
    setDealInput((current) => ({ ...current, termMonths, apr, cashDown }));
    setGridRates((current) => ({ ...current, [termMonths]: apr }));
    document.getElementById("calculator-top")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToGrid = () => document.getElementById("payment-grid")?.scrollIntoView({ behavior: "smooth" });
  const scrollToPayment = () => {
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    document
      .getElementById(mobile ? "payment-results-mobile" : "payment-results")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="app-frame">
      <ViewToggle onReset={resetDeal} onViewChange={setView} view={view} />

      <div className="calculator-shell" id="calculator-top">
        {view === "dealer" ? (
          <>
            <div className="calculator-layout">
              <div className="calculator-left">
                <div className="page-intro">
                  <h1>Build the deal. See the payment.</h1>
                  <p>A fast estimate for the desk — adjust any figure and the payment updates instantly.</p>
                </div>
                <div className="mobile-results" id="payment-results-mobile">
                  <ResultsPanel dealInput={dealInput} result={result} {...paymentTargetProps} />
                </div>
                <DealerView
                  accordions={accordions}
                  addItem={addItem}
                  dealInput={dealInput}
                  removeItem={removeItem}
                  result={result}
                  targetProps={targetProps}
                  toggleAccordion={(name) => setAccordions((current) => ({ ...current, [name]: !current[name] }))}
                  updateField={updateField}
                  updateItem={updateItem}
                />
              </div>
              <div className="desktop-results" id="payment-results">
                <ResultsPanel dealInput={dealInput} result={result} {...paymentTargetProps} />
              </div>
            </div>

            {result.isFinanced ? (
              <button className="grid-jump" onClick={scrollToGrid} type="button">
                <span>Payment grid</span>
                <strong>Compare terms, rates, and down payments</strong>
              </button>
            ) : null}
          </>
        ) : (
          <>
            <div className="page-intro page-intro--customer">
              <h1>Your deal at a glance.</h1>
              <p>A clear estimate based on the figures selected with your salesperson.</p>
            </div>
            <CustomerView
              dealInput={dealInput}
              gridRates={gridRates}
              paymentTargetProps={paymentTargetProps}
              result={result}
            />
          </>
        )}
      </div>

      {view === "dealer" && result.isFinanced ? (
        <PaymentGrid
          dealInput={dealInput}
          downPayments={gridDownPayments}
          onApplyScenario={applyGridScenario}
          onDownPaymentChange={(index, value) =>
            setGridDownPayments((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))
          }
          onRateChange={(term, value) => setGridRates((current) => ({ ...current, [term]: value }))}
          rates={gridRates}
          result={result}
        />
      ) : null}

      <footer className="app-footer">
        <p>Estimates only. Actual payments may vary by lender, taxes, fees, credit approval, and final deal structure.</p>
        <p>No customer information is stored or sent anywhere.</p>
      </footer>

      {view === "dealer" && result.isFinanced ? (
        <MobileNav onGrid={scrollToGrid} onPayment={scrollToPayment} payment={result.monthlyPayment} />
      ) : null}
    </div>
  );
}
