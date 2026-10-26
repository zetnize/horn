import type { Metadata } from "next";
import { RequestForm } from "@/components/RequestForm";
export const metadata:Metadata={title:"Форма предзаказа",description:"Оставьте заявку на предзаказ одежды NORTHIA.",robots:{index:false,follow:true}};
export default function PreorderPage(){return <RequestForm mode="preorder"/>;}

