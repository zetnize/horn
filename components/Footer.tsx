import { readContent } from "@/lib/server/content";
import { Icon } from "./Icons";
export async function Footer() {
  const { settings: links } = await readContent();
  return (
    <footer className="footer container" id="contacts">
      <h2>Быстрая связь</h2>
      <div className="contact-links">
        {[
          { label: "ТЕЛЕГРАМ", href: links.telegram },
          { label: "ТЕЛЕГРАМ-КАНАЛ", href: links.channel },
        ].map(({ label, href }) =>
          href ? (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="telegram" />
              {label}
            </a>
          ) : (
            <span
              key={label}
              className="contact-placeholder"
              aria-label={`${label}: адрес пока не указан`}
            >
              <Icon name="telegram" />
              <span>{label}</span>
            </span>
          ),
        )}
      </div>
      <div className="footer-legal">
        <p>Northia</p>
        <p>{links.legalName}</p>
      </div>
    </footer>
  );
}
