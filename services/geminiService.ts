
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
  
  // CRITICAL FIX: Prioritize userApiKey (from Settings) over process.env.API_KEY (Deployment)
  // This ensures that if the user enters a new key in the UI, it overrides the exhausted system key.
  const apiKey = (userApiKey || process.env.API_KEY || '').trim();
  
  if (!apiKey) {
    return {
      analysis: "❌ **Configuration Error**: No Gemini API Key found.\n\n**How to fix:**\n1. Go to the **Settings** tab in this app.\n2. Paste your Gemini API Key into the 'AI Configuration' field.\n3. Click **Save Configuration**.",
      visuals: { type: 'none', title: '', data: [] }
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `
    You are ZeroGPT, an elite financial AI assistant.
    Current Portfolio: ${JSON.stringify(portfolio, null, 2)}
    
    Guidelines:
    - Provide deep technical analysis.
    - If suggesting a trade, ALWAYS use the 'propose_trade' tool.
    - Use Markdown.
    - If asked for reports, summarize their holdings or transaction performance.
  `;

  // Helper function to execute generation with error handling and fallback
  const generate = async (modelId: string) => {
    return await ai.models.generateContent({
      model: modelId,
      contents: userMessage,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: [proposeTradeTool] }],
        temperature: 0.1,
      }
    });
  };

  try {
    // 1. Try with the powerful Pro model first
    try {
      const response = await generate('gemini-3-pro-preview');
      return processResponse(response);
    } catch (primaryError: any) {
      // 2. Fallback Mechanism
      // If we hit a quota limit (429) or overload (503), try the lighter Flash model
      if (primaryError.message.includes('429') || primaryError.message.includes('503') || primaryError.message.includes('quota')) {
        console.warn("ZeroGPT: Pro model quota exceeded. Falling back to Flash.");
        const fallbackResponse = await generate('gemini-2.5-flash'); // Use stable flash model as fallback
        return processResponse(fallbackResponse, true); // true = indicates fallback was used
      }
      throw primaryError; // Rethrow other errors (like invalid key)
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    let errorMsg = error.message;
    
    if (errorMsg.includes('403') || errorMsg.includes('API key')) {
      errorMsg = "Invalid API Key. Please check the key in your Settings tab.";
    } else if (errorMsg.includes('429')) {
      errorMsg = "API Quota Limit Reached. Please use a paid API key or wait a few minutes.";
    }

    return {
      analysis: `⚠️ **AI Error**: ${errorMsg}`,
      visuals: { type: 'none', title: '', data: [] }
    };
  }
};

// Helper to process the raw response into our App format
function processResponse(response: any, isFallback = false): AIMessageResponse {
  let analysisText = response.text || "No analysis could be generated.";
  
  if (isFallback) {
    analysisText += "\n\n*(Note: Switched to high-speed model due to traffic/quota limits on Pro model.)*";
  }

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
    analysis: analysisText,
    visuals: { type: 'none', title: '', data: [] } 
  };
}
