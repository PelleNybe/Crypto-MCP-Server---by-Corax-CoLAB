import { createContext } from 'react';

export interface ActivePortfolioSymbolContextType {
    targetSymbol: string | null;
    targetExchange: string | null;
    loading: boolean;
    error: string | null;
}

export const ActivePortfolioSymbolContext = createContext<ActivePortfolioSymbolContextType>({
    targetSymbol: null,
    targetExchange: null,
    loading: true,
    error: null
});
