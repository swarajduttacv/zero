
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { PortfolioSummary, AIMessageResponse } from '../types';

// Define the available models in our ecosystem
const MODELS = {
  HEAVY_LIFTER: 'gemini-3-pro-preview',      // Top tier: Best reasoning
  LEGACY_POWER: 'gemini-2.5-pro-latest',     // Secondary tier: Strong reasoning
  SPEED_BALANCED: 'gemini-3-flash-preview',  // Third tier: Good balance
  FALLBACK_LIGHT: 'gemini-2.5-flash-latest'  // Final fallback: High speed
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

/**
 * Detects if the user's intent is a "Heavy" task (Trading/Money) or "Light" task (Info).
 */
const getPriorityQueue = (message: string): string[] => {
  const input = message.toLowerCase();
  
  // Keywords indicating a transactional or complex reasoning request
  const heavyKeywords = [
    'buy', 'sell', 'trade', 'order', 'invest', 'purchase', 'short', 
    'balance', 'rebalance', 'strategy', 'predict', 'forecast', 'hedging', 'risk'
  ];

  const isHeavyTask = heavyKeywords.some(kw => input.includes(kw));

  if (isHeavyTask) {
    // Heavy Task Priority Tree: 
    // 1. Gemini 3 Pro (State of the art)
    // 2. Gemini 2.5 Pro (Robust fallback)
    // 3. Gemini 3 Flash (Fast reasoning)
    // 4. Gemini 2.5 Flash (Safety net)
    return [MODELS.HEAVY_LIFTER, MODELS.LEGACY_POWER, MODELS.SPEED_BALANCED, MODELS.FALLBACK_LIGHT];
  } else {
    // Light Task Priority Tree (Info/Summary):
    // 1. Gemini 3 Flash (Best speed/quality ratio)
    // 2. Gemini 2.5 Flash (Ultra fast)
    // We skip the Pro models for simple info retrieval to save quota/latency
    return [MODELS.SPEED_BALANCED, MODELS.FALLBACK_LIGHT];
  }
};

export const analyzePortfolio = async (
  portfolio: PortfolioSummary, 
  userMessage: string,
  userApiKey?: string
): Promise<AIMessageResponse> => {
  
  // 1. Auth Resolution: Settings > Environment
  const apiKey = (userApiKey || process.env.API_KEY || '').trim();
  
  if (!apiKey) {
    return {
      analysis: "❌ **Configuration Error**: No Gemini API Key found.\n\n**How to fix:**\n1. Go to the **Settings** tab in this app.\n2. Paste your Gemini API Key into the 'AI Configuration' field.\n3. Click **Save Configuration**.",
      visuals: { type: 'none', title: '', data: [] }
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  // 2. Build Context
  const systemInstruction = `
    You are ZeroGPT, an elite financial AI assistant.
    Current Portfolio: ${JSON.stringify(portfolio, null, 2)}
    
    Guidelines:
    - Provide deep technical analysis.
    - If suggesting a trade, ALWAYS use the 'propose_trade' tool.
    - Use Markdown.
    - Keep responses concise but insightful.
  `;

  // 3. Determine Priority Queue based on Intent
  const modelQueue = getPriorityQueue(userMessage);
  let lastError: Error | null = null;
  let successModel = '';

  // 4. Execution Loop (The "Priority Tree")
  for (const modelId of modelQueue) {
    try {
      console.log(`ZeroGPT: Attempting generation with ${modelId}...`);
      
      const response = await ai.models.generateContent({
        model: modelId,
        contents: userMessage,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: [proposeTradeTool] }],
          temperature: modelId.includes('pro') ? 0.4 : 0.2, // Higher creativity for Pro models, strictness for Flash
        }
      });

      // If successful, return immediately
      return processResponse(response, modelId);

    } catch (error: any) {
      console.warn(`ZeroGPT: Model ${modelId} failed.`, error.message);
      lastError = error;

      // Check if we should retry with the next model
      // We retry on Quota (429), Overloaded (503), or Timeout
      const isRecoverable = error.message.includes('429') || 
                            error.message.includes('503') || 
                            error.message.includes('quota') ||
                            error.message.includes('overloaded') ||
                            error.message.includes('fetch failed');

      if (isRecoverable) {
        // Continue loop to next model in queue
        continue;
      } else {
        // If it's an Auth error (403) or Bad Request (400), abort immediately.
        break;
      }
    }
  }

  // 5. Final Error Handling (if all models failed)
  console.error("Gemini API Fatal Error:", lastError);
  let errorMsg = lastError?.message || "Unknown error occurred.";
  
  if (errorMsg.includes('403') || errorMsg.includes('API key')) {
    errorMsg = "Invalid API Key. Please check the key in your Settings tab.";
  } else if (errorMsg.includes('429')) {
    errorMsg = "All available AI models (Pro & Flash) are currently busy or quota limits reached. Please try again in a minute.";
  }

  return {
    analysis: `⚠️ **AI Service Unavailable**: ${errorMsg}`,
    visuals: { type: 'none', title: '', data: [] }
  };
};

// Helper to process the raw response into our App format
function processResponse(response: any, usedModel: string): AIMessageResponse {
  let analysisText = response.text || "No analysis could be generated.";
  
  // Clean up model name for display
  const modelNameClean = usedModel
    .replace('gemini-', '')
    .replace('-preview', '')
    .replace('-latest', '')
    .replace(/-/g, ' ')
    .toUpperCase();
    
  // Visual indicator for which model was used (color coded)
  let badgeColor = '#94a3b8'; // Default gray
  if (modelNameClean.includes('3 PRO')) badgeColor = '#a855f7'; // Purple
  else if (modelNameClean.includes('2.5 PRO')) badgeColor = '#ec4899'; // Pink
  else if (modelNameClean.includes('FLASH')) badgeColor = '#eab308'; // Yellow

  const footer = `\n\n<span style="font-size: 10px; opacity: 0.7; font-family: monospace; color: ${badgeColor}; border: 1px solid ${badgeColor}; padding: 2px 6px; border-radius: 4px;">⚡ ${modelNameClean}</span>`;

  if (response.functionCalls && response.functionCalls.length > 0) {
    const call = response.functionCalls[0];
    if (call.name === 'propose_trade') {
      const args = call.args as any;
      return {
        analysis: `Prepared a **${args.transactionType}** order for **${args.quantity}** shares of **${args.symbol}**.` + footer,
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
    analysis: analysisText + footer,
    visuals: { type: 'none', title: '', data: [] } 
  };
}
