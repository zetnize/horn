"use client";
import { useEffect, useRef } from "react";
export function Dialog({ children, labelId, onDismiss, className="" }: { children:React.ReactNode; labelId:string; onDismiss:()=>void; className?:string }) {
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  const dialog=ref.current;
  const trigger=document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const previous=document.body.style.overflow;
  dialog?.showModal(); document.body.style.overflow="hidden";
  return ()=>{ dialog?.close(); document.body.style.overflow=previous; if(trigger?.isConnected) trigger.focus(); };
 },[]);
 return <dialog ref={ref} className={`dialog ${className}`} aria-labelledby={labelId} onKeyDown={event=>{
  if(event.key!=="Tab")return;
  const elements=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),[tabindex="0"]')).filter(element=>element.getClientRects().length>0);
  const first=elements[0],last=elements.at(-1);
  if(!first){event.preventDefault();event.currentTarget.focus();}
  else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }} onCancel={event=>{event.preventDefault();onDismiss();}} onClick={event=>{if(event.target===event.currentTarget)onDismiss();}}><div className="dialog-content">{children}</div></dialog>;
}

