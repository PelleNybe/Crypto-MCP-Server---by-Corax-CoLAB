import { authenticatedFetch } from "./auth";

export const callMcpEndpoint = async (mcp: string, method: string, params: any = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await authenticatedFetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mcp, method, params })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'MCP call failed');
      return data.data;
    } catch (err: any) {
      if (i === retries - 1) {
        throw new Error(`Failed after ${retries} retries: ${err.message}`, { cause: err });
      }
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
};
