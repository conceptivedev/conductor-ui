import { AutocompleteProps } from "@mui/lab";
import { FC } from "react";
interface DropdownProps
  extends Omit<
    AutocompleteProps<T, Multiple, DisableClearable, FreeSolo>,
    "renderInput"
  > {
  label?: string;
}
declare const Dropdown: FC<DropdownProp>;
export default Dropdown;