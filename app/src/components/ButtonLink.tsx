import type { LinkProps } from "react-router-dom";
import { Link } from "react-router-dom";
import clsx from "clsx";

import styles from "./Button.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonLinkProps = LinkProps & {
  variant?: ButtonVariant;
  className?: string;
};

export const ButtonLink = ({ variant = "primary", className, ...props }: ButtonLinkProps) => (
  <Link {...props} className={clsx(styles.button, styles[variant], className)} />
);
