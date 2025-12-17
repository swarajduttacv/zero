import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { PortfolioSummary, AIMessageResponse } from '../types';

/**
 * Initializes the AI client.
 * Uses process.env.API_KEY as mandated.
 */
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    // Return null rather than throwing immediately to allow the UI to handle it as a specific state
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

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
  userMessage: string
): Promise<AIMessageResponse> => {
  const ai = getAIClient();
  
  if (!ai) {
    return {
      analysis: "⚠️ **Gemini API Key Missing**: Please ensure the environment variable `API_KEY` is configured in your project settings.",
      visuals: { type: 'none', title: '', data: [] }
    };
  }

  // Use gemini-3-pro-preview for complex financial analysis tasks
  const modelId = 'gemini-3-pro-preview';

  const systemInstruction = `
    You are ZeroGPT, an elite financial AI assistant connected to the user's Zerodha profile.
    Current Portfolio: ${JSON.stringify(portfolio, null, 2)}
    
    Guidelines:
    - Provide deep technical analysis of holdings.
    - If suggesting a trade, ALWAYS use the 'propose_trade' tool.
    - Use Markdown for formatting.
    - Be concise but insightful.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: userMessage,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: [proposeTradeTool] }],
        temperature: 0.2,
      }
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === 'propose_trade') {
        const args = call.args as any;
        return {
          analysis: `I've prepared a **${args.transactionType}** order for **${args.quantity}** shares of **${args.symbol}**. Please review and confirm the execution.`,
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
      analysis: response.text || "I've analyzed your request but couldn't generate a text response. Please try again.",
      visuals: { type: 'none', title: '', data: [] } 
    };

  } catch (error: any) {
    console.error("AI Error:", error);
    return {
      analysis: `Failed to generate analysis: ${error.message}`,
      visuals: { type: 'none', title: '', data: [] }
    };
  }
};