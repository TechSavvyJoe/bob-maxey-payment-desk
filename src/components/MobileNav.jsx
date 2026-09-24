import { formatWholeCurrency } from "../lib/formatters.js";
import { ArrowIcon, GridIcon } from "./Icons.jsx";

export default function MobileNav({ payment, onGrid, onPayment }) {
  return (
    <nav aria-label="Mobile calculator shortcuts" className="mobile-nav">
      <button onClick={onGrid} type="button">
        <GridIcon size={22} />
        <span>Payment grid</span>
        <ArrowIcon direction="right" size={18} />
      </button>
      <span aria-hidden="true" className="mobile-nav__divider" />
      <button className="mobile-nav__payment" onClick={onPayment} type="button">
        <strong>{formatWholeCurrency(payment)}/mo</strong>
        <ArrowIcon direction="right" size={20} />
      </button>
    </nav>
  );
}
