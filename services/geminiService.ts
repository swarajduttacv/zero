import { GoogleGenAI, Type, Schema, FunctionDeclaration, Tool } from "@google/genai";
import { PortfolioSummary, AIMessageResponse, TradeOrder } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    analysis: {
      type: Type.STRING,
      description: "The textual answer. If a tool was used, describe what action is being proposed.",
    },
    visuals: {
      type: Type.OBJECT,
      description: "Optional visuals.",
      properties: {
        type: { type: Type.STRING, enum: ["bar", "pie", "line", "none"] },
        title: { type: Type.STRING },
        data: {
          type: Type.ARRAY,
          items: {
             type: Type.OBJECT,
             properties: { label: { type: Type.STRING }, value: { type: Type.NUMBER } }
          }
        },
      },
    },
  },
  required: ["analysis"],
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
    const response = await ai.models.generateContent({
      model: modelId,
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: [proposeTradeTool] }],
        // responseSchema: RESPONSE_SCHEMA, // Note: responseSchema behaves strictly with tools in some versions, so we might handle JSON parsing manually if tool is called.
        // Actually, with the new SDK, mixing tools and responseSchema can be tricky. 
        // Strategy: If tool is called, the SDK returns functionCalls. If not, it follows schema or text.
        // We will NOT set responseSchema here to allow the model to choose between Tool Call OR JSON text.
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

    // If no tool call, we expect text. Since we removed responseSchema to allow tool flexibility,
    // we need to parse the text if the model outputs JSON, or just return the text.
    // However, to maintain the "visuals" feature, we should instruct the model to output JSON if it's just text.
    // Let's do a second pass if needed, or better, use a simpler heuristic.
    
    // For this implementation, let's just parse the text if it looks like JSON, else wrap it.
    const text = response.text || "";
    let parsed;
    try {
        // Try to find JSON block
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

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      analysis: "I'm having trouble connecting to the intelligence engine right now. Please check your network.",
      visuals: { type: 'none', title: '', data: [] }
    };
  }
};