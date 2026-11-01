import { createContext, useContext } from "react";

// Lets deeply nested components (FABs, modals, snackbar, pages) adapt to the
// split layout without passing a prop through every level.
export const LayoutContext = createContext(false);

export const useIsSplit = () => useContext(LayoutContext);
