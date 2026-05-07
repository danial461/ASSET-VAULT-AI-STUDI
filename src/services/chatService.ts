import { GoogleGenAI } from "@google/genai";
import { Asset } from "../types";

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export const chatService = {
  async askVault(question: string, assets: Asset[], history: ChatMessage[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const model = 'gemini-3-flash-preview';

    const assetContext = assets.map(a => `- ${a.name} (${a.category}): Purchase Price $${a.purchasePrice}, Market Value $${a.marketValue || a.purchasePrice}, Warranty: ${a.warrantyExpiry || 'N/A'}`).join('\n');

    const systemInstruction = `
      You are the AssetVault Assistant. You help users manage their physical possessions.
      You have access to their current vault inventory:
      ${assetContext}

      Use this data to answer questions about:
      - Total portfolio value and depreciation.
      - Warranty expiration dates.
      - Advice on insurance or maintenance.
      - General organization tips.

      Keep your tone helpful, technical, and slightly futuristic/Apple-inspired.
      Keep responses concise and well-formatted.
    `;

    const chat = ai.models.generateContent({
      model,
      contents: [
        ...history.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
        { role: 'user', parts: [{ text: question }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const response = await chat;
    return response.text;
  }
};
