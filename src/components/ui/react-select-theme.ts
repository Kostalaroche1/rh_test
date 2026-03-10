import type { GroupBase, StylesConfig } from "react-select";

export type AppSelectOption = {
  value: string | number;
  label: string;
  [key: string]: unknown;
};

export const appReactSelectStyles: StylesConfig<
  AppSelectOption,
  false,
  GroupBase<AppSelectOption>
> = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderRadius: 10,
    borderColor: state.isFocused ? "var(--ring)" : "var(--border)",
    backgroundColor: "var(--card)",
    color: "var(--foreground)",
    boxShadow: state.isFocused ? "0 0 0 1px var(--ring)" : "none",
    "&:hover": { borderColor: "var(--ring)" },
  }),
  valueContainer: (base) => ({
    ...base,
    paddingLeft: 10,
    paddingRight: 10,
  }),
  placeholder: (base) => ({
    ...base,
    color: "var(--muted-foreground)",
  }),
  singleValue: (base) => ({
    ...base,
    color: "var(--foreground)",
  }),
  input: (base) => ({
    ...base,
    color: "var(--foreground)",
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: "var(--border)",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "var(--muted-foreground)",
    "&:hover": { color: "var(--foreground)" },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "var(--muted-foreground)",
    "&:hover": { color: "var(--foreground)" },
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 1000,
  }),
  menu: (base) => ({
    ...base,
    border: "1px solid var(--border)",
    borderRadius: 10,
    backgroundColor: "var(--popover)",
    overflow: "hidden",
    zIndex: 60,
  }),
  menuList: (base) => ({
    ...base,
    backgroundColor: "var(--popover)",
    paddingTop: 4,
    paddingBottom: 4,
  }),
  option: (base, state) => ({
    ...base,
    cursor: "pointer",
    backgroundColor: state.isSelected
      ? "var(--secondary)"
      : state.isFocused
      ? "var(--accent)"
      : "transparent",
    color: "var(--foreground)",
  }),
  noOptionsMessage: (base) => ({
    ...base,
    color: "var(--muted-foreground)",
  }),
};

export function getSelectPortalTarget(): HTMLElement | undefined {
  if (typeof window === "undefined") return undefined;
  return document.body;
}
