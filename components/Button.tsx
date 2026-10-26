import type { ButtonHTMLAttributes } from "react";
export function Button({ variant = "outline", className = "", type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "outline" | "primary" }) {
 return <button type={type} className={`button button-${variant} ${className}`} {...props} />;
}

