import { useContext } from "react";
import { ActivePortfolioSymbolContext } from "../context/contexts/ActivePortfolioSymbolContext";
export function useActivePortfolioSymbol() {
    return useContext(ActivePortfolioSymbolContext);
}
