import React, { useState, useEffect, createContext, useContext } from 'react';
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
        const fetchPortfolioPair = async () => {
            setLoading(true);
            try {
                const portfolio = await callMcpEndpoint('MCP_PORTFOLIO', 'portfolio_value', { exchanges: [defaultExchange] });
                if (!active) return;

                if (portfolio && portfolio.portfolio) {
                    const coins = Object.keys(portfolio.portfolio);
                    if (coins.length > 0) {
                        setTargetSymbol(`${coins[0].toUpperCase()}/USDT`);
                        setTargetExchange(defaultExchange);
                    }
                }
            } catch (err: any) {
                console.warn("Could not fetch portfolio for dynamic pair, using default", err);
                setError(err.message || 'Failed to fetch portfolio symbol');
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchPortfolioPair();
        const interval = setInterval(fetchPortfolioPair, 60000); // Check every minute to keep updated with Top 1

        return () => {
            active = false;
            clearInterval(interval);
        };
    }, [defaultExchange]);

    return (
        <ActivePortfolioSymbolContext.Provider value={{ targetSymbol, targetExchange, loading, error }}>
            {children}
        </ActivePortfolioSymbolContext.Provider>
    );
};

export function useActivePortfolioSymbol(defaultSymbol = 'BTC/USDT', defaultExchange = 'binance') {
    return useContext(ActivePortfolioSymbolContext);
}
