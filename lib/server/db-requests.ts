import "server-only";
import { randomUUID } from "node:crypto";
import type { PreorderInput, WaitlistInput } from "@/lib/validation";
import { database } from "./database";

export async function saveOrder(input: PreorderInput, sql = database()) {
  // Keep the server catalog snapshot stable until the order has been inserted.
  return sql.begin(async (tx) => {
    await tx`select revision from northia.site where id=true for share`;
    const rows =
      await tx`select slug,data from northia.products where slug in ${tx(input.items.map((i) => i.slug))}`;
    const items = input.items.map((item) => {
      const product = rows.find((p) => p.slug === item.slug)?.data;
      if (!product || product.hidden || !product.sizes.includes(item.size))
        throw new Error("UNAVAILABLE_PRODUCT");
      return {
        ...item,
        name: product.name,
        color: product.color,
        price: product.price,
      };
    });
    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const id = randomUUID();
    const customer = {
      name: input.name,
      phone: input.phone,
      contact: input.contact,
      city: input.city,
      address: input.address,
      comment: input.comment,
    };
    await tx`insert into northia.orders(id,customer,items,total,consent_version) values(${id},${tx.json(customer)},${tx.json(items)},${total},${input.consentVersion})`;
    return id;
  });
}
export async function saveWaiting(input: WaitlistInput, sql = database()) {
  await sql`insert into northia.waitlist(id,name,contact,consent_version) values(${randomUUID()},${input.name},${input.contact},${input.consentVersion})`;
}
