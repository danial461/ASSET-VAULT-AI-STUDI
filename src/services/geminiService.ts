import { GoogleGenAI, Type } from "@google/genai";
import { Asset, Category, CATEGORIES } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface ReceiptScanResult {
  merchantName?: string;
  itemName?: string;
  totalAmount?: number;
  purchaseDate?: string;
  currency?: string;
  taxAmount?: number;
  category?: Category;
  warrantyMonths?: number;
  serialNumber?: string;
}

export const analyzeAssetImage = async (base64Image: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: `Identify this physical asset from the image. Provide:
            1. A clear name for the item.
            2. The most relevant category from: ${CATEGORIES.join(', ')}.
            3. Estimated brand if visible.
            4. Current estimated market value in USD.
            5. Suggested realistic purchase price.
            6. Annual depreciation rate (e.g., 0.15 for 15%).` },
          { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          estimatedBrand: { type: Type.STRING },
          marketValue: { type: Type.NUMBER },
          suggestedPrice: { type: Type.NUMBER },
          depreciationRate: { type: Type.NUMBER }
        },
        required: ["name", "category", "marketValue", "suggestedPrice", "depreciationRate"]
      }
    }
  });

  return JSON.parse(response.text.trim());
};

export const analyzeReceiptImage = async (base64Image: string): Promise<ReceiptScanResult> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: `Extract data from this receipt image. Provide:
            - Merchant name
            - Main item name
            - Total amount
            - Purchase date (YYYY-MM-DD)
            - Category from: ${CATEGORIES.join(', ')}
            - Warranty period in months (if mentioned)
            - Serial number (if mentioned)` },
          { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          merchantName: { type: Type.STRING },
          itemName: { type: Type.STRING },
          totalAmount: { type: Type.NUMBER },
          purchaseDate: { type: Type.STRING },
          category: { type: Type.STRING },
          warrantyMonths: { type: Type.NUMBER },
          serialNumber: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text.trim());
};

export const revaluateAsset = async (name: string, category: string, purchasePrice: number, purchaseDate: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Estimate the current market value and depreciation rate for this item:
      Name: ${name}
      Category: ${category}
      Original Price: $${purchasePrice}
      Purchased On: ${purchaseDate}
      
      Current Date: ${new Date().toLocaleDateString()}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          marketValue: { type: Type.NUMBER },
          depreciationRate: { type: Type.NUMBER }
        },
        required: ["marketValue", "depreciationRate"]
      }
    }
  });

  return JSON.parse(response.text.trim());
};

export const geminiService = {
  getMaintenanceAdvice: async (asset: Asset) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an expert asset maintenance advisor. Provide specific, high-quality maintenance advice for the following asset:
        Name: ${asset.name}
        Category: ${asset.category}
        Brand: ${asset.estimatedBrand || 'Unknown'}
        Purchase Date: ${asset.purchaseDate || 'Unknown'}
        Current Market Value: $${asset.marketValue || 'Unknown'}

        Provide:
        1. A list of 3-5 maintenance tips.
        2. A recommended next maintenance date (format YYYY-MM-DD).
        3. A brief explanation of why this maintenance is important.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3-5 maintenance tips."
              },
              nextMaintenanceDate: {
                type: Type.STRING,
                description: "Recommended next maintenance date in YYYY-MM-DD format."
              },
              explanation: {
                type: Type.STRING,
                description: "Why this maintenance matters."
              }
            },
            required: ["tips", "nextMaintenanceDate", "explanation"]
          }
        }
      });

      return JSON.parse(response.text.trim());
    } catch (error) {
      console.error("Gemini Maintenance Error:", error);
      return null;
    }
  },

  getResellListing: async (asset: Asset) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a high-converting marketplace listing description for this asset. Make it sound professional, honest, and appealing.
        Name: ${asset.name}
        Category: ${asset.category}
        Brand: ${asset.estimatedBrand || 'Unknown'}
        Purchase Price: $${asset.purchasePrice || 'Unknown'}
        Current Est. Value: $${asset.marketValue || 'Unknown'}
        Serial Number: ${asset.serialNumber || 'N/A'}

        Provide:
        1. A catchy headline.
        2. A detailed description highlighting features and care.
        3. A suggested asking price range.
        4. Key bullet points for quick reading.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              description: { type: Type.STRING },
              suggestedPriceRange: { type: Type.STRING },
              keyFeatures: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["headline", "description", "suggestedPriceRange", "keyFeatures"]
          }
        }
      });

      return JSON.parse(response.text.trim());
    } catch (error) {
      console.error("Gemini Resell Error:", error);
      return null;
    }
  }
};
