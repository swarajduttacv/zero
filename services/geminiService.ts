
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { PortfolioSummary, AIMessageResponse } from '../types';

// Lazy initialization
let aiClient: GoogleGenAI | null = null;

const getAIClient = () => {
    if (!aiClient) {
        let key = '';
        
        // Defensive check for process.env
        try {
            // @ts-ignore
            if (typeof process !== 'undefined' && process.env) {
                key = process.env.API_KEY || '';
            }
        } catch (e) {
            console.warn("Could not read process.env:", e);
        }

        if (!key) {
            console.error("API_KEY is missing. Ensure it is set in your environment variables.");
            // We do not throw here to prevent app crash on load. We throw only when usage is attempted.
        }
        
        if (key) {
            aiClient = new GoogleGenAI({ apiKey: key });
        }
    }
    
    if (!aiClient) {
        throw new Error("API Key is missing. Please verify your deployment environment variables (API_KEY).");
    }
    
    return aiClient;
};

// Define the tool for trading
const proposeTradeTool: FunctionDeclaration = {
  name: "propose_trade",
  description: "Propose a stock trade (buy or sell) based on the user's request. This does NOT execute the trade, but prepares it for user confirmation.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      symbol: {
        type: Type.STRING,
        description: "The stock symbol (e.g., RELIANCE, TCS).",
      },
      transactionType: {
        type: Type.STRING,
        enum: ["BUY", "SELL"],
        description: "Whether to buy or sell.",
      },
      quantity: {
        type: Type.NUMBER,
        description: "Number of shares.",
      },
      orderType: {
        type: Type.STRING,
        enum: ["MARKET", "LIMIT"],
        description: "Type of order. Default to MARKET unless specified.",
      },
      price: {
        type: Type.NUMBER,
        description: "Limit price if orderType is LIMIT.",
      },
    },
    required: ["symbol", "transactionType", "quantity", "orderType"],
  },
};

export const analyzePortfolio = async (
  portfolio: PortfolioSummary, 
  userMessage: string
): Promise<AIMessageResponse> => {
  
  const modelId = 'gemini-2.5-flash';

  const systemInstruction = `
    You are ZeroGPT, an intelligent financial assistant connected to the user's Zerodha account.
    
    USER PORTFOLIO (Live Data):
    ${JSON.stringify(portfolio, null, 2)}
    
    CAPABILITIES:
    1. Analyze performance, risk, and sectors.
    2. Propose trades using the 'propose_trade' tool if the user explicitly asks to buy/sell or asks for a concrete action plan that involves rebalancing.
    
    RULES:
    - If the user says "Buy X" or "Sell Y", USE THE TOOL 'propose_trade'.
    - Do not assume a trade is executed until the user confirms in the UI.
    - Be professional, concise, and data-driven.
    - Use Markdown for text.
  `;

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: modelId,
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: [proposeTradeTool] }],
        temperature: 0.2, 
      }
    });

    // Check for function calls
    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === 'propose_trade') {
        const args = call.args as any;
        return {
          analysis: `I have prepared a **${args.transactionType}** order for **${args.quantity}** shares of **${args.symbol}**. Please review and confirm via the secure panel below.`,
          tradeProposal: {
            symbol: args.symbol,
            transactionType: args.transactionType,
            quantity: args.quantity,
            orderType: args.orderType,
            price: args.price
          }
        };
      }
    }

    const text = response.text || "";
    let parsed;
    try {
        // Try to find JSON block if model outputs it
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
        } else {
            parsed = { analysis: text, visuals: { type: 'none', title: '', data: [] } };
        }
    } catch (e) {
        parsed = { analysis: text, visuals: { type: 'none', title: '', data: [] } };
    }

    return parsed as AIMessageResponse;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return {
      analysis: `I encountered an issue processing your request: ${error.message || 'Connection Error'}. Please check your API configuration.`,
      visuals: { type: 'none', title: '', data: [] }
    };
  }
};
