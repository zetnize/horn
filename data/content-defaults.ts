import { products } from "./products";
import type { Content } from "@/lib/content-schema";
export const defaultContent: Content = {
  revision: 0,
  products: products.map((p) => ({
    ...p,
    sizes: [...p.sizes],
    images: [...p.images],
    hidden: false,
    delivery: "Информация о доставке пока не предоставлена.",
    care: "Информация о составе и уходе пока не предоставлена.",
  })),
  settings: {
    heroImage: "/assets/hero-placeholder.svg",
    heroAlt: "Фотография гор Кавказа — изображение ожидается",
    heroCaption: "[born in the mountains]",
    brandCopy:
      "NORTHIA — бренд одежды, вдохновлённый культурой и духом Кавказа. Мы соединяем традиции с современным стилем, создавая вещи с характером, смыслом и вниманием к деталям.",
    catalogTitle: "BASE DROP>",
    dropImage: "/assets/hero-placeholder.svg",
    dropAlt: "Новая коллекция NORTHIA — изображение ожидается",
    dropCaption: "[drop 5] soon...",
    dropCopy:
      "Уже в ноябре мы представим новую коллекцию NORTHIA. Хотите узнать о старте продаж первыми? Присоединяйтесь к листу ожидания, заполнив короткую форму по кнопке ниже.",
    preorderIntro:
      "После заполнения формы мы свяжемся с вами для подтверждения заказа и оформления оплаты. В связи с большим количеством обращений время ответа может быть увеличено до 2 дней 🤍\n\nМы выпускаем коллекции ограниченными тиражами по предзаказу. Это позволяет нам сосредоточиться на качестве каждой вещи и сохранить эксклюзивность каждой партии 🖇️\n\nСрок отправки: 1-5 дней\nСпасибо за доверие 🩶",
    waitlistIntro:
      "Оставьте имя и контакт, чтобы узнать о старте продаж новой коллекции NORTHIA.",
    telegram: "",
    channel: "",
    legalName: "ИП ЛОЛАЕВА ВИКТОРИЯ",
  },
};
