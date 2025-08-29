import dotenv from 'dotenv';
import { geminiService } from '../services/geminiService.js';

dotenv.config();

async function testConnection() {
  try {
    console.log('🔍 Probando conexión con Gemini AI...');
    const response = await geminiService.generateContent(
      'Responde con "OK" si la conexión funciona correctamente'
    );
    console.log('✅ Respuesta recibida:', response);
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('Posibles soluciones:');
    console.log('1. Verifica que GEMINI_API_KEY en .env sea correcta');
    console.log('2. Asegúrate de tener habilitada Gemini API en Google Cloud');
    console.log('3. Verifica tu conexión a internet');
    console.log('4. Revisa que tengas créditos en Google Cloud');
  }
}

testConnection();