import React, { useMemo } from "react";
import {
  calculateDeal,
  calculatePayment,
  fromCents,
  RATE_GRID_DEFAULTS,
  solveAmountFinancedForPayment,
  solveCentValueForTarget,
  solveOptionalItemAmountForTarget,
  solveSalePriceForTarget,
  toCents,
} from "../lib/calculations.js";
import { formatCurrency, formatNumber, formatWholeCurrency } from "../lib/formatters.js";
import { MoneyInput, SegmentedControl } from "./Fields.jsx";
import { ArrowIcon, ResetIcon } from "./Icons.jsx";

const STANDARD_TERMS = RATE_GRID_DEFAULTS.termMonths;

const metricLabel = {
  payment: "payment",
  outTheDoor: "out-the-door total",
  amountFinanced: "amount financed",
};

function solveAprForPayment(principal, termMonths, targetPayment) {
  const zeroPayment = calculatePayment({ principal, apr: 0, termMonths }).monthlyPayment;
  if (targetPayment < zeroPayment) return null;

  let low = 0;
  let high = 50;
  const highPayment = calculatePayment({ principal, apr: high, termMonths }).monthlyPayment;
  if (targetPayment > highPayment) return null;

  for (let iteration = 0; iteration < 70; iteration += 1) {
    const middle = (low + high) / 2;
    const payment = calculatePayment({ principal, apr: middle, termMonths }).monthlyPayment;
    if (payment < targetPayment) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

function resultLine(deal) {
  if (!deal.isFinanced) {
    const balance = deal.customerCredit > 0
      ? `Credit ${formatCurrency(deal.customerCredit)}`
      : `Cash due ${formatCurrency(deal.dueAtSigning)}`;
    return `${balance} · OTD ${formatCurrency(deal.outTheDoor)}`;
  }
  return `${formatWholeCurrency(deal.monthlyPayment)}/mo · AF ${formatWholeCurrency(deal.amountFinanced)} · OTD ${formatWholeCurrency(deal.outTheDoor)}`;
}

function buildSuggestions({ dealInput, result, targetType, targetValue, gridRates }) {
  if (targetValue === "" || Number(targetValue) <= 0) {
    return {
      direction: "reduce",
      gap: 0,
      metric: targetType === "outTheDoor" ? "outTheDoor" : "amountFinanced",
      targetMetric: 0,
      targetPaymentSolution: null,
      suggestions: [],
      empty: true,
    };
  }
  const targetPaymentSolution =
    targetType === "payment"
      ? solveAmountFinancedForPayment({
          targetPayment: targetValue,
          apr: dealInput.apr,
          termMonths: dealInput.termMonths,
        })
      : null;
  const metric = targetType === "outTheDoor" ? "outTheDoor" : "amountFinanced";
  const targetMetric = targetPaymentSolution?.amountFinanced ?? targetValue;
  const currentMetric = result[metric];
  const gap = currentMetric - targetMetric;
  const direction = gap >= 0 ? "reduce" : "increase";
  const amount = Math.abs(gap);
  const suggestions = [];

  const addSuggestion = (suggestion) => {
    if (Number.isFinite(suggestion.amount ?? 0) && Math.abs(suggestion.amount ?? 0) >= 0.005) {
      suggestions.push(suggestion);
    }
  };

  if (targetType !== "outTheDoor") {
    if (direction === "reduce") {
      const nextCash = dealInput.cashDown + amount;
      const nextDeal = calculateDeal({ ...dealInput, cashDown: nextCash });
      addSuggestion({
        id: "cash-down",
        title: "Add cash down",
        value: `+${formatCurrency(amount)}`,
        detail: resultLine(nextDeal),
        amount,
        patch: { cashDown: nextCash },
        iconDirection: "up",
      });
    } else if (dealInput.cashDown > 0) {
      const reduction = Math.min(amount, dealInput.cashDown);
      const nextCash = dealInput.cashDown - reduction;
      const nextDeal = calculateDeal({ ...dealInput, cashDown: nextCash });
      addSuggestion({
        id: "cash-down",
        title: "Lower cash down",
        value: `−${formatCurrency(reduction)}`,
        detail: resultLine(nextDeal),
        amount: reduction,
        patch: { cashDown: nextCash },
        iconDirection: "down",
      });
    }
  }

  try {
    const priceSolution = solveSalePriceForTarget(dealInput, {
      target: targetMetric,
      metric,
      maxSalePrice:
        direction === "increase"
          ? dealInput.salePrice + amount * 2 + 10_000
          : dealInput.salePrice,
    });
    const priceDelta = priceSolution.salePrice - dealInput.salePrice;
    if (Math.abs(priceDelta) >= 0.01) {
      addSuggestion({
        id: "sale-price",
        title: priceDelta < 0 ? "Reduce selling price" : "Selling-price room",
        value: `${priceDelta < 0 ? "−" : "+"}${formatCurrency(Math.abs(priceDelta))}`,
        detail: resultLine(priceSolution.deal),
        amount: Math.abs(priceDelta),
        patch: { salePrice: priceSolution.salePrice },
        iconDirection: priceDelta < 0 ? "down" : "up",
      });
    }
  } catch {
    // A price-only solution is not always possible for very small or extreme targets.
  }

  if (direction === "increase") {
    addSuggestion({
      id: "roll-room",
      title: "Available product room",
      value: `+${formatCurrency(amount)}`,
      detail: "Non-taxable product room at this target; verify eligibility and lender approval.",
      amount,
      addRoomItem: amount,
      iconDirection: "up",
    });
  }

  if (targetType !== "outTheDoor" && direction === "reduce") {
    try {
      const tradeSolution = solveCentValueForTarget({
        target: targetMetric,
        min: dealInput.tradeAllowance,
        max: dealInput.tradeAllowance + amount * 2 + 20_000,
        direction: "decreasing",
        evaluate: (candidateCents) => {
          const nextDeal = calculateDeal({
            ...dealInput,
            tradeAllowance: fromCents(candidateCents),
          });
          return { metricCents: nextDeal.cents.amountFinanced, result: nextDeal };
        },
      });
      const tradeIncrease = tradeSolution.value - dealInput.tradeAllowance;
      if (tradeIncrease >= 0.01) {
        addSuggestion({
          id: "trade",
          title: "Increase trade allowance",
          value: `+${formatCurrency(tradeIncrease)}`,
          detail: `${resultLine(tradeSolution.result)} · manager-controlled`,
          amount: tradeIncrease,
          patch: { tradeAllowance: tradeSolution.value },
          iconDirection: "up",
        });
      }
    } catch {
      // Trade-only adjustment may be outside the bounded practical range.
    }
  }

  if (direction === "reduce") {
    const itemIndex = dealInput.optionalItems
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => Number(item.amount) > 0)
      .sort((a, b) => Number(b.item.amount) - Number(a.item.amount))[0]?.index;
    if (Number.isInteger(itemIndex)) {
      try {
        const itemSolution = solveOptionalItemAmountForTarget(dealInput, {
          itemIndex,
          target: targetMetric,
          metric,
          maxAmount: dealInput.optionalItems[itemIndex].amount,
        });
        const reduction = dealInput.optionalItems[itemIndex].amount - itemSolution.optionalItemAmount;
        if (reduction >= 0.01) {
          addSuggestion({
            id: "option",
            title: `Reduce ${dealInput.optionalItems[itemIndex].name.trim() || "product or add-on"}`,
            value: `−${formatCurrency(reduction)}`,
            detail: resultLine(itemSolution.deal),
            amount: reduction,
            itemPatch: { index: itemIndex, amount: itemSolution.optionalItemAmount },
            iconDirection: "down",
          });
        }
      } catch {
        // One option may not be large enough to reach the target on its own.
      }
    }
  }

  if (targetType === "payment") {
    const termCandidate = STANDARD_TERMS.filter((term) => term > dealInput.termMonths)
      .map((term) => {
        const apr = Number(gridRates[term] ?? dealInput.apr);
        const payment = calculatePayment({
          principal: result.amountFinanced,
          apr,
          termMonths: term,
        }).monthlyPayment;
        return { term, apr, payment };
      })
      .find((candidate) => candidate.payment <= targetValue);

    if (termCandidate) {
      const nextDeal = calculateDeal({
        ...dealInput,
        termMonths: termCandidate.term,
        apr: termCandidate.apr,
      });
      addSuggestion({
        id: "term",
        title: `Use ${termCandidate.term} months`,
        value: `${formatWholeCurrency(termCandidate.payment)}/mo`,
        detail: `${formatNumber(termCandidate.apr)}% APR assumption · ${resultLine(nextDeal)}`,
        amount: termCandidate.term,
        patch: { termMonths: termCandidate.term, apr: termCandidate.apr },
        iconDirection: "right",
      });
    }

    const requiredApr = solveAprForPayment(
      Math.max(0, result.amountFinanced),
      dealInput.termMonths,
      targetValue,
    );
    if (requiredApr !== null && Math.abs(requiredApr - dealInput.apr) >= 0.01) {
      const nextDeal = calculateDeal({ ...dealInput, apr: requiredApr });
      addSuggestion({
        id: "apr",
        title: "APR needed",
        value: `${formatNumber(requiredApr)}%`,
        detail: `${resultLine(nextDeal)} · only if lender-approved`,
        amount: Math.abs(requiredApr - dealInput.apr),
        patch: { apr: Number(requiredApr.toFixed(2)) },
        iconDirection: requiredApr < dealInput.apr ? "down" : "up",
      });
    }
  }

  return {
    direction,
    gap: amount,
    metric,
    targetMetric,
    targetPaymentSolution,
    suggestions,
  };
}

export default function TargetSolver({
  dealInput,
  result,
  targetType,
  targetValues,
  onTargetTypeChange,
  onTargetValueChange,
  gridRates,
  expanded,
  onExpandedChange,
  onApplyPatch,
  onApplyItemPatch,
  onAddRoomItem,
  lastRoll,
  onUndoRoll,
  targetInputRef,
}) {
  const targetValue = targetValues[targetType];
  const solution = useMemo(
    () => buildSuggestions({ dealInput, result, targetType, targetValue, gridRates }),
    [dealInput, result, targetType, targetValue, gridRates],
  );
  const visibleSuggestions = expanded
    ? solution.suggestions
    : solution.suggestions.slice(0, 3);

  const targetSuffix = targetType === "payment" ? "/mo" : "";
  const summary = (() => {
    if (solution.empty) return "Enter a target amount to see adjustment options.";
    if (solution.gap < 0.01) return `The current ${metricLabel[targetType]} is already on target.`;
    if (solution.direction === "reduce") {
      return targetType === "payment"
        ? `To reach ${formatWholeCurrency(targetValue)}/mo, reduce the financed balance by ${formatCurrency(solution.gap)}.`
        : `Reduce the ${metricLabel[targetType]} by ${formatCurrency(solution.gap)} to reach the target.`;
    }
    return targetType === "payment"
      ? `There is ${formatCurrency(solution.gap)} of financed room before reaching ${formatWholeCurrency(targetValue)}/mo.`
      : `There is ${formatCurrency(solution.gap)} of room before reaching the target.`;
  })();

  const applySuggestion = (suggestion) => {
    if (suggestion.patch) onApplyPatch(suggestion.patch, suggestion.title);
    if (suggestion.itemPatch) onApplyItemPatch(suggestion.itemPatch, suggestion.title);
    if (suggestion.addRoomItem) onAddRoomItem(suggestion.addRoomItem, suggestion.title);
  };

  return (
    <section className="target-panel" id="target-solver">
      <div className="target-panel__heading">
        <div>
          <h2>Roll to a target</h2>
          <p>Set the number you want and compare exact ways to reach it.</p>
        </div>
        {solution.suggestions.length > 3 ? (
          <button
            aria-controls="suggestion-list"
            aria-expanded={expanded}
            className="text-action"
            onClick={() => onExpandedChange(!expanded)}
            type="button"
          >
            {expanded ? "Show fewer" : "See all options"}
            <ArrowIcon direction={expanded ? "up" : "right"} size={18} />
          </button>
        ) : null}
      </div>
      {lastRoll ? (
        <div className="target-undo" role="status">
          <span>
            Applied <strong>{lastRoll.label}</strong>.
          </span>
          <button className="undo-button" onClick={onUndoRoll} type="button">
            <ResetIcon size={17} />
            Undo, go back
          </button>
        </div>
      ) : null}
      <div className={`target-panel__body ${solution.empty ? "is-empty" : ""}`}>
        <div className="target-setup">
          <SegmentedControl
            className="target-tabs"
            label="Target type"
            onChange={onTargetTypeChange}
            options={result.isFinanced
              ? [
                  { label: "Payment", value: "payment" },
                  { label: "Out-the-door", value: "outTheDoor" },
                  { label: "Amount financed", value: "amountFinanced" },
                ]
              : [{ label: "Out-the-door", value: "outTheDoor" }]}
            value={targetType}
          />
          <div className="target-input-row">
            <label htmlFor="target-value">Target</label>
            <MoneyInput
              ariaLabel={`Target ${metricLabel[targetType]}`}
              id="target-value"
              onChange={(value) => onTargetValueChange(targetType, value)}
              ref={targetInputRef}
              value={targetValue}
            />
            <span>{targetSuffix}</span>
          </div>
          <p aria-live="polite" className="target-summary">{summary}</p>
        </div>
        <div className="suggestion-list" id="suggestion-list">
          {solution.empty ? (
            <p className="suggestion-empty">Enter a target above to see ways to reach it.</p>
          ) : null}
          {visibleSuggestions.map((suggestion) => (
            <article className="suggestion" key={suggestion.id}>
              <ArrowIcon direction={suggestion.iconDirection} size={21} />
              <div className="suggestion__copy">
                <strong>{suggestion.title}</strong>
                <span>{suggestion.detail}</span>
              </div>
              <div className="suggestion__action">
                <strong className="suggestion__value">{suggestion.value}</strong>
                <button
                  aria-label={`Apply ${suggestion.title}`}
                  className="apply-button"
                  onClick={() => applySuggestion(suggestion)}
                  type="button"
                >
                  Apply
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
