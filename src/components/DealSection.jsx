import React from "react";
import { ChevronIcon } from "./Icons.jsx";

export default function DealSection({
  id,
  title,
  summary,
  icon: SectionIcon,
  open,
  onToggle,
  children,
  className = "",
}) {
  const contentId = `${id}-content`;

  return (
    <section className={`deal-section ${className}`}>
      <button
        aria-controls={contentId}
        aria-expanded={open}
        className="deal-section__header"
        onClick={onToggle}
        type="button"
      >
        {SectionIcon ? <SectionIcon className="deal-section__icon" size={25} /> : null}
        <span className="deal-section__title-wrap">
          <span className="deal-section__title">{title}</span>
          {summary ? <span className="deal-section__summary">{summary}</span> : null}
        </span>
        <ChevronIcon className="deal-section__chevron" direction={open ? "up" : "down"} size={22} />
      </button>
      <div className={`deal-section__content ${open ? "is-open" : "is-collapsed"}`} id={contentId}>
        {children}
      </div>
    </section>
  );
}
