
const sections = [
  { label: "Vehicle", target: "vehicle-section" },
  { label: "Trade", target: "trade-cash-section" },
  { label: "Fees", target: "taxes-fees-section" },
  { label: "Products", target: "products-addons-section" },
  { label: "Target", target: "target-solver" },
];

export default function QuickJumpNav() {
  const jump = (target) => {
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav aria-label="Jump to deal section" className="quick-jump-nav">
      {sections.map((section) => (
        <button key={section.target} onClick={() => jump(section.target)} type="button">
          {section.label}
        </button>
      ))}
    </nav>
  );
}
