# NORTHIA
Только мобильная версия: резиновая вёрстка 360–430 px, на широком экране колонка max-width 430 px на нейтральном фоне. Без горизонтального скролла.
- Next.js App Router, TypeScript, Tailwind. Без UI-библиотек. Дополнительные runtime-пакеты: только zod и googleapis.
- Предзаказ без онлайн-оплаты.
- Дизайн строго по скриншотам/SVG. Не улучшать по вкусу. Визуальные значения — app/globals.css; оценки ≈ в design-tokens.md. Не хардкодить дизайн в компонентах.
- Фотографии не вырезать из макетов; отсутствующие заменять серыми плейсхолдерами. Текст дословно; неизвестное в TODO.md.
- Цены через formatPrice: 4 980 ₽. Коннектор справа от «Размерная сетка» не реализовывать.
- Семантический HTML, один h1 на страницу, lang=ru, alt, aria-label и видимый focus. Модалки: фокус внутри, Esc, возврат фокуса, блокировка фона.
- next/image: размеры/aspect-ratio и sizes; priority только hero и первое фото товара.
- Hover/active/focus, переходы 150–250 ms и prefers-reduced-motion.
- Шрифты: Actay, Actay Wide, Monochrome Sans, Helvetica Neue. Если нет файлов — fallback и TODO; после получения woff2 с кириллицей — next/font/local.
- Перед этапом анализировать код и читать design-tokens.md, PLAN.md, TODO.md. Сохранять архитектуру и работающие компоненты.
- После этапа: npm run lint, npm run typecheck, npm run build; исправить ошибки, обновить TODO.md, локальный git commit, перечислить изменённые файлы.
- Секреты не читать целиком и не печатать; .env.local не коммитить. Публикация, push, внешние записи и доступы — с отдельным разрешением.


<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
