"use client";
import { useId, useState } from "react";
import { Icon } from "./Icons";
export function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className="accordion">
      <h2>
        <button
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
        >
          {title}
          <Icon name={open ? "minus" : "plus"} />
        </button>
      </h2>
      <div
        className={`accordion-panel ${open ? "open" : ""}`}
        id={id}
        inert={!open}
        aria-hidden={!open}
      >
        <div>
          <div className="accordion-copy">{children}</div>
        </div>
      </div>
    </section>
  );
}
