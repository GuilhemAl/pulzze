import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";
import clsx from "clsx";

import styles from "./Button.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className, type = "button", ...props }, ref) => (
    <button
      {...props}
      ref={ref}
      type={type}
      className={clsx(styles.button, styles[variant], className)}
    />
  )
);

Button.displayName = "Button";
