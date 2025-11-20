import { GoogleGenAI } from "@google/genai";
import { ShopSettings } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateFooterMessage = async (settings: ShopSettings): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key is missing. Returning default message.");
    return "Obrigado pela preferência! Volte sempre.";
  }

  try {
    const prompt = `Gere uma frase de agradecimento curta, calorosa e criativa (máximo 100 caracteres) para colocar no rodapé de um cupom não fiscal.
    O nome do estabelecimento é "${settings.shopName}".
    O estilo deve ser informal e simpático.
    Responda apenas com a frase.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || "Obrigado pela preferência!";
  } catch (error) {
    console.error("Error generating message:", error);
    return "Obrigado e volte sempre!";
  }
};