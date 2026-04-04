import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { callMcpEndpoint } from '../api_mcp';

interface ActivePortfolioSymbolContextType {
    targetSymbol: string;
    targetExchange: string;
    loading: boolean;
    error: string | null;
}

const ActivePortfolioSymbolContext = createContext<ActivePortfolioSymbolContextType>({
    targetSymbol: 'BTC/USDT',
    targetExchange: 'binance',
    loading: true,
    error: null
});

export const ActivePortfolioSymbolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const defaultExchange = 'binance';
    const [error, setError] = useState<string | null>(null);
    const [targetSymbol, setTargetSymbol] = useState('BTC/USDT');
    const [targetExchange, setTargetExchange] = useState(defaultExchange);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        let timeoutId: NodeJS.Timeout;

        const fetchPortfolioPair = async () => {
            try {
                const portfolio = await callMcpEndpoint('MCP_PORTFOLIO', 'portfolio_value', { exchanges: [defaultExchange] });
                if (!active) return;

                if (portfolio && portfolio.portfolio) {
                    const coins = Object.keys(portfolio.portfolio);
                    if (coins.length > 0 && coins[0].toUpperCase() !== 'USDT') {
                        setTargetSymbol(`${coins[0].toUpperCase()}/USDT`);
                        setTargetExchange(defaultExchange);
                    }
                }
                setError(null);
            } catch (err: any) {
                if (active) {
                    console.warn("Could not fetch portfolio for dynamic pair, using default", err);
                    setError(err.message || 'Failed to fetch portfolio symbol');
                }
            } finally {
                if (active) {
                    setLoading(false);
                    // Use recursive timeout instead of setInterval to prevent overlapping requests
                    timeoutId = setTimeout(fetchPortfolioPair, 60000);
                }
            }
        };

        fetchPortfolioPair();

        return () => {
            active = false;
            clearTimeout(timeoutId);
        };
    }, [defaultExchange]);

    const value = useMemo(() => ({ targetSymbol, targetExchange, loading, error }), [targetSymbol, targetExchange, loading, error]);

    return (
        <ActivePortfolioSymbolContext.Provider value={value}>
            {children}
        </ActivePortfolioSymbolContext.Provider>
    );
};

export function useActivePortfolioSymbol() {
    return useContext(ActivePortfolioSymbolContext);
}
