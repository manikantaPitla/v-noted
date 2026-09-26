import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import React from "react";

export const Root = DropdownMenu.Root;
export const Trigger = DropdownMenu.Trigger;

export function Content({
  children,
  align = "start",
  side = "bottom",
  sideOffset = 6,
  className = "",
}: {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  className?: string;
}) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={`
          z-50 bg-surface-elevated border border-surface-border
          rounded-2xl shadow-panel outline-none overflow-hidden
          data-[state=open]:animate-pop-in data-[state=closed]:animate-fade-out
          ${className}
        `}
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
}

export function Item({
  children,
  onClick,
  className = "",
  destructive = false,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <DropdownMenu.Item
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer outline-none
        transition-colors duration-100 select-none
        data-[highlighted]:bg-surface-hover
        ${destructive ? "text-destructive data-[highlighted]:bg-destructive/10" : "text-text-secondary data-[highlighted]:text-text-primary"}
        ${disabled ? "opacity-40 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      {children}
    </DropdownMenu.Item>
  );
}

export function Separator() {
  return <DropdownMenu.Separator className="my-1 h-px bg-surface-border" />;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <DropdownMenu.Label className="px-3 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-widest">{children}</DropdownMenu.Label>;
}

export const Sub = DropdownMenu.Sub;

export function SubTrigger({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <DropdownMenu.SubTrigger
      className={`
        flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer outline-none
        transition-colors duration-100 select-none
        data-[highlighted]:bg-surface-hover text-text-secondary data-[highlighted]:text-text-primary
        ${className}
      `}
    >
      {children}
    </DropdownMenu.SubTrigger>
  );
}

export function SubContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.SubContent
        className={`
          z-50 bg-surface-elevated border border-surface-border
          rounded-2xl shadow-panel outline-none overflow-hidden
          min-w-[8rem] p-1
          data-[state=open]:animate-pop-in data-[state=closed]:animate-fade-out
          ${className}
        `}
      >
        {children}
      </DropdownMenu.SubContent>
    </DropdownMenu.Portal>
  );
}
