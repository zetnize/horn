# План

Все пять этапов реализованы локально. Результаты проверок — QA.md; недостающие материалы и внешняя настройка — TODO.md; запуск и Google Sheets — README.md. Публикация не выполнялась.

1. Фундамент: App Router, токены, типы, базовые компоненты.
2. /: Header, Hero, ProductCard, ProductGrid, Drop, Footer.
3. /product/[slug]: Slider, SizeChips, SizeGuideModal, Accordion, CartProvider.
4. /cart, /preorder, /waitlist: Menu, CartItems, Field, формы, подтверждения, временные API.
5. /api/preorder, /api/waitlist: zod, googleapis, серверный расчёт, защита, README, QA.

Поток: data/products.ts → серверные страницы → CartProvider (только slug,size,qty) → localStorage/формы → серверная валидация и расчёт → Google Sheets. Клиентские цены не доверенные. Google-модули только на сервере.
Оболочка app/layout.tsx; интерактивность в client-компонентах; стили/токены app/globals.css. После каждого этапа lint/typecheck/build и локальный коммит. Скриншоты output/playwright не коммитятся.
