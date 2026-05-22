import React from "react";
type SocialButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ReactNode;
  label: string;
};
export const SocialButton: React.FC<SocialButtonProps> = ({
  icon,
  label,
  className = "",
  ...props
}) => {
  return (
    <button
      type="button"
      className={[
        "flex items-center justify-center gap-2",
        "py-3.5 px-4",
        "bg-white dark:bg-slate-800",
        "border border-slate-200 dark:border-slate-700",
        "rounded-2xl",
        "hover:bg-slate-50 dark:hover:bg-slate-800/70",
        "transition-colors",
        "text-slate-900 dark:text-slate-100",
        "font-bold text-sm",
        className,
      ].join(" ")}
      {...props}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};
