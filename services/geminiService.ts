
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { PortfolioSummary, AIMessageResponse } from '../types';

/**
 * Safe API Client Factory
 * Updated to comply with mandatory @google/genai security guidelines.
 */
const getAIClient = () => {
    // CRITICAL: API key must be obtained exclusively from process.env.API_KEY.
    const key = process.env.API_KEY;
    
    if (!key) {
        throw new Error("ZeroGPT API Configuration Error: Environment variable API_KEY is not defined in this session.");
    }
    
    // CRITICAL: Initialize GoogleGenAI using a named parameter with the process.env string directly.
    return new GoogleGenAI({ apiKey: key });
};

// Tool Definitions
const proposeTradeTool: FunctionDeclaration = {
  name: "propose_trade",
  parameters: {
    type: Type.OBJECT,
    description: "Prepare a stock trade for user confirmation. Does not execute until user authorizes with passcode.",
    properties: {
      symbol: { type: Type.STRING, description: "Exchange symbol (e.g. INFY)" },
      transactionType: { type: Type.STRING, enum: ["BUY", "SELL"] },
      quantity: { type: Type.NUMBER },
      orderType: { type: Type.STRING, enum: ["MARKET", "LIMIT"] },
      price: { type: Type.NUMBER, description: "Limit price" },
    },
    required: ["symbol", "transactionType", "quantity", "orderType"],
  },
};

export const analyzePortfolio = async (
  portfolio: PortfolioSummary, 
  userMessage: string
): Promise<AIMessageResponse> => {
  
  // Basic Text Tasks: Recommended model for analysis
  const modelId = 'gemini-3-flash-preview';

  const systemInstruction = `
    You are ZeroGPT assistant. Analyze the user's live Zerodha portfolio:
    ${JSON.stringify(portfolio, null, 2)}
    
    - Propose trades via 'propose_trade' when requested.
    - Be data-driven and objective.
    - Use Markdown for responses.
  `;

  try {
    const ai = getAIClient();
    // Use ai.models.generateContent directly with the model name and prompt as per guidelines.
    const response = await ai.models.generateContent({
      model: modelId,
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: [proposeTradeTool] }],
        temperature: 0.1, 
      }
    });

    // Handle tool use by checking functionCalls property on response.
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === 'propose_trade') {
        const args = call.args as any;
        return {
          analysis: `Drafting a **${args.transactionType}** order for **${args.quantity}** units of **${args.symbol}**. Verify details below.`,
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

    // Direct access to .text property (not a method) as per SDK instructions.
    const text = response.text || "I was unable to generate an analysis at this time.";
    return { analysis: text, visuals: { type: 'none', title: '', data: [] } };

  } catch (error: any) {
    console.error("AI Analysis Failed:", error);
    return {
      analysis: `Intelligence Core Offline: ${error.message || 'Unknown network error'}.`,
      visuals: { type: 'none', title: '', data: [] }
    };
  }
};
