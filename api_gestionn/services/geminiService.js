import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no está configurada en .env');
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  async generateContent(prompt) {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error en Gemini API:', error);
      throw new Error(`Error en Gemini AI: ${error.message}`);
    }
  }

  async generateJSONContent(prompt) {
    const text = await this.generateContent(prompt);
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No se encontró JSON válido en la respuesta');
      }
      return JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      throw new Error(`Error al parsear JSON: ${parseError.message}`);
    }
  }
}

// Singleton instance
export const geminiService = new GeminiService();