import { readContent } from "@/lib/server/content";
import { Icon } from "./Icons";
import Link from "next/link";
import { business } from "@/data/legal";
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
        <p>{business.name}</p>
        <p>
          ИНН {business.inn}
          <br />
          ОГРНИП {business.ogrnip}
        </p>
        <p>{business.address}</p>
        <p>
          <a href="tel:+79931841676">{business.phone}</a>
          <br />
          <a href={`mailto:${business.email}`}>{business.email}</a>
        </p>
        <details>
          <summary>Банковские реквизиты</summary>
          <dl className="bank-details">
            <dt>Расчётный счёт</dt>
            <dd>40802810100005508002</dd>
            <dt>Банк</dt>
            <dd>АО «ТБанк»</dd>
            <dt>БИК</dt>
            <dd>044525974</dd>
            <dt>ИНН банка</dt>
            <dd>7710140679</dd>
            <dt>Корреспондентский счёт</dt>
            <dd>30101810145250000974</dd>
            <dt>Адрес банка</dt>
            <dd>127287, г. Москва, ул. Хуторская 2-я, д. 38А, стр. 26</dd>
          </dl>
        </details>
        <nav className="legal-links" aria-label="Юридическая информация">
          <Link href="/legal/terms">Заказ, оплата, доставка и возврат</Link>
          <Link href="/legal/privacy">Политика обработки данных</Link>
          <Link href="/legal/consent">Согласие на обработку данных</Link>
        </nav>
      </div>
    </footer>
  );
}
