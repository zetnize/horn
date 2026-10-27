"use client";
import Image from "next/image";
import { Dialog } from "./Dialog";
import { Icon } from "./Icons";
import type { ProductType } from "@/data/products";
export function SizeGuideModal({
  type,
  onClose,
}: {
  type: ProductType;
  onClose: () => void;
}) {
  return (
    <Dialog labelId="size-guide-title" onDismiss={onClose}>
      <div className="dialog-heading">
        <h2 id="size-guide-title">Размерная сетка</h2>
        <button
          className="icon-button"
          aria-label="Закрыть размерную сетку"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <Image
        className="size-guide-image"
        src={`/assets/size-${type}.png`}
        width={216}
        height={354}
        sizes="(max-width: 430px) 90vw, 390px"
        alt={`Размерная сетка: ${type === "tee" ? "футболка" : type === "hoodie" ? "худи" : "лонгслив"}; размеры изделия в сантиметрах`}
      />
    </Dialog>
  );
}
