import React from "react";
type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
};
export const TextInput: React.FC<TextInputProps> = ({
  label,
  leftIcon,
  rightSlot,
  className = "",
  ...props
}) => {
  return (
    <div>
      {label ? (
        <label className="block text-sm font-semibold mb-2 ml-1 text-slate-700 dark:text-slate-300">
          {label}
        </label>
      ) : null}
      <div className="relative">
        {leftIcon ? (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </span>
        ) : null}
        <input
          {...props}
          className={[
            "w-full",
            leftIcon ? "pl-12" : "pl-4",
            rightSlot ? "pr-12" : "pr-4",
            "py-3.5",
            "bg-slate-50 dark:bg-slate-800",
            "border border-slate-200 dark:border-slate-700",
            "rounded-2xl",
            "text-slate-900 dark:text-slate-100",
            "placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "transition-all",
            className,
          ].join(" ")}
        />
        {rightSlot ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightSlot}
          </span>
        ) : null}
      </div>
    </div>
  );
};
