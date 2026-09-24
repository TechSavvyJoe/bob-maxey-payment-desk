import { useMemo, useRef, useState } from "react";
import { calculateDeal } from "./lib/calculations.js";
import CustomerView from "./components/CustomerView.jsx";
import DealerView from "./components/DealerView.jsx";
import MobileNav from "./components/MobileNav.jsx";
import PaymentGrid from "./components/PaymentGrid.jsx";
import QuickJumpNav from "./components/QuickJumpNav.jsx";
import ResultsPanel from "./components/ResultsPanel.jsx";
import ViewToggle from "./components/ViewToggle.jsx";

// Default rate-grid APRs: 6% through 60 months, 6.5% at 72, 7% at 84.
// These are just starting points — every rate is editable per deal.
const DEFAULT_APR_BY_TERM = Object.freeze({
  36: 6,
  48: 6,
  60: 6,
  72: 6.5,
  84: 7,
});

const INITIAL_DEAL = Object.freeze({
  salePrice: "",
  cashDown: "",
  tradeAllowance: "",
  tradePayoff: "",
  dealType: "finance",
  plateMode: "transfer",
  newPlateAmount: "",
  rollNegativeEquity: true,
  apr: DEFAULT_APR_BY_TERM[72],
  termMonths: 72,
  optionalItems: [],
});

const INITIAL_RATES = Object.freeze({ ...DEFAULT_APR_BY_TERM });

const INITIAL_DOWN_PAYMENTS = Object.freeze(["", "", "", ""]);

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
    payment: "",
    outTheDoor: "",
    amountFinanced: "",
  });
  const [mobileGridOpen, setMobileGridOpen] = useState(false);
  const [solverExpanded, setSolverExpanded] = useState(false);
  const [lastRoll, setLastRoll] = useState(null);
  const [resetCount, setResetCount] = useState(0);
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
      if (field === "termMonths") next.apr = gridRates[value] ?? current.apr;
      // Cash down only applies to financed deals — clear it so it can't
      // silently reapply if the dealer switches back to Finance later.
      if (field === "dealType" && value === "cash") next.cashDown = "";
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
          name: preset.name ?? "",
          amount: preset.amount ?? "",
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

  // One-step undo for target-solver suggestions: capture the deal (and the
  // rate grid, which a suggestion can also mutate) exactly as it was right
  // before a suggestion is applied, so "roll to a target" is always reversible.
  const captureUndo = (label) => setLastRoll({ dealInput, gridRates, label });

  const applyItemPatch = ({ index, amount }, label) => {
    captureUndo(label);
    updateItem(index, { amount });
  };

  const applyPatch = (patch, label) => {
    captureUndo(label);
    setDealInput((current) => ({ ...current, ...patch }));
    if (patch.termMonths && patch.apr !== undefined) {
      setGridRates((current) => ({ ...current, [patch.termMonths]: patch.apr }));
    } else if (patch.apr !== undefined) {
      setGridRates((current) => ({ ...current, [dealInput.termMonths]: patch.apr }));
    }
  };

  const undoLastRoll = () => {
    if (!lastRoll) return;
    setDealInput(lastRoll.dealInput);
    setGridRates(lastRoll.gridRates);
    setLastRoll(null);
  };

  const resetDeal = () => {
    if (!window.confirm("Reset this deal? All figures, trade, and add-ons will be cleared.")) return;
    setDealInput(freshDeal());
    setGridRates({ ...INITIAL_RATES });
    setGridDownPayments([...INITIAL_DOWN_PAYMENTS]);
    setTargetType("payment");
    setTargetValues({ payment: "", outTheDoor: "", amountFinanced: "" });
    setMobileGridOpen(false);
    setSolverExpanded(false);
    setAccordions({ vehicle: true, trade: true, taxes: true, roll: true });
    setLastRoll(null);
    setResetCount((current) => current + 1);
    itemCounter.current = 1;
  };

  const setTargetValue = (type, value) => {
    setTargetValues((current) => ({ ...current, [type]: value }));
  };

  const activatePaymentTarget = (value) => {
    setTargetType("payment");
    setTargetValue("payment", value);
    requestAnimationFrame(() => {
      targetInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      targetInputRef.current?.focus();
      targetInputRef.current?.select?.();
    });
  };

  const paymentTargetProps = {
    paymentTarget: targetValues.payment,
    onPaymentTargetChange: (value) => setTargetValue("payment", value),
    onActivatePaymentTarget: activatePaymentTarget,
    resetSignal: resetCount,
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
    onAddRoomItem: (amount, label) => {
      captureUndo(label);
      addItem({ amount });
    },
    lastRoll,
    onUndoRoll: undoLastRoll,
    targetInputRef,
  };

  const applyGridScenario = ({ termMonths, apr, cashDown }) => {
    setDealInput((current) => ({ ...current, termMonths, apr, cashDown }));
    setGridRates((current) => ({ ...current, [termMonths]: apr }));
    if (window.matchMedia("(max-width: 760px)").matches) {
      setMobileGridOpen(false);
      document.getElementById("calculator-top")?.scrollIntoView({ behavior: "smooth" });
    }
    // On desktop, stay put so the dealer sees the cell's selected highlight
    // instead of the page jumping away right as they click it.
  };

  const scrollToGrid = () => {
    if (window.matchMedia("(max-width: 760px)").matches) {
      setMobileGridOpen(true);
      return;
    }
    document.getElementById("payment-grid")?.scrollIntoView({ behavior: "smooth" });
  };
  const scrollToPayment = () => {
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    document
      .getElementById(mobile ? "payment-results-mobile" : "payment-results")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={`app-frame ${mobileGridOpen ? "has-mobile-grid-open" : ""}`}>
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
                <QuickJumpNav />
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
          onMobileClose={() => setMobileGridOpen(false)}
          onDownPaymentChange={(index, value) =>
            setGridDownPayments((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))
          }
          onRateChange={(term, value) => {
            // updateField("apr", ...) already syncs gridRates for the current
            // term; only the other terms need a direct gridRates update.
            if (term === dealInput.termMonths) updateField("apr", value);
            else setGridRates((current) => ({ ...current, [term]: value }));
          }}
          rates={gridRates}
          result={result}
          mobileOpen={mobileGridOpen}
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
