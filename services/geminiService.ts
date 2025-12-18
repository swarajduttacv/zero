
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { PortfolioSummary, AIMessageResponse } from '../types';

const proposeTradeTool: FunctionDeclaration = {
  name: "propose_trade",
  parameters: {
    type: Type.OBJECT,
    description: "Suggest a stock trade for user confirmation.",
    properties: {
      symbol: { type: Type.STRING, description: "Exchange symbol (e.g., RELIANCE)" },
      transactionType: { type: Type.STRING, enum: ["BUY", "SELL"] },
      quantity: { type: Type.NUMBER },
      orderType: { type: Type.STRING, enum: ["MARKET", "LIMIT"] },
      price: { type: Type.NUMBER, description: "Required for LIMIT orders" },
    },
    required: ["symbol", "transactionType", "quantity", "orderType"],
  },
};

export const analyzePortfolio = async (
  portfolio: PortfolioSummary, 
  userMessage: string,
  userApiKey?: string
): Promise<AIMessageResponse> => {
  
  // Priority: 1. Environment Variable (Deployment) 2. User Settings (Runtime Fallback)
  // We trim to avoid issues with accidental whitespace from copy-pasting
  const apiKey = (process.env.API_KEY || userApiKey || '').trim();
  
  if (!apiKey) {
    return {
      analysis: "❌ **Configuration Error**: No Gemini API Key found.\n\n**How to fix:**\n1. Go to the **Settings** tab in this app.\n2. Paste your Gemini API Key into the 'API Key' field.\n3. Click **Save Configuration**.\n\nAlternatively, ensure `API_KEY` is set in your Vercel environment variables.",
      visuals: { type: 'none', title: '', data: [] }
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelId = 'gemini-3-pro-preview';

  const systemInstruction = `
    You are ZeroGPT, an elite financial AI assistant.
    Current Portfolio: ${JSON.stringify(portfolio, null, 2)}
    
    Guidelines:
    - Provide deep technical analysis.
    - If suggesting a trade, ALWAYS use the 'propose_trade' tool.
    - Use Markdown.
    - If asked for reports, summarize their holdings or transaction performance.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: userMessage,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: [proposeTradeTool] }],
        temperature: 0.1,
      }
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === 'propose_trade') {
        const args = call.args as any;
        return {
          analysis: `Prepared a **${args.transactionType}** order for **${args.quantity}** shares of **${args.symbol}**.`,
          tradeProposal: {
            symbol: args.symbol,
            transactionType: args.transactionType as 'BUY' | 'SELL',
            quantity: Number(args.quantity),
            orderType: args.orderType as 'MARKET' | 'LIMIT',
            price: args.price ? Number(args.price) : undefined
          }
        };
      }
    }

    return { 
      analysis: response.text || "No analysis could be generated.",
      visuals: { type: 'none', title: '', data: [] } 
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    let errorMsg = error.message;
    if (errorMsg.includes('403') || errorMsg.includes('API key')) {
      errorMsg = "Invalid API Key. Please check the key in your Settings tab.";
    }
    return {
      analysis: `⚠️ **AI Error**: ${errorMsg}`,
      visuals: { type: 'none', title: '', data: [] }
    };
  }
};
