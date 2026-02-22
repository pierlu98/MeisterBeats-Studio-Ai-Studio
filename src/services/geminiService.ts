/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateMusicalIdea(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert music producer. Generate a creative musical idea based on the following prompt. 
      Describe the drums, bassline, melody, and chord progression in a concise, inspiring way. 
      Prompt: ${prompt}`,
    });
    return response.text ?? 'Could not generate an idea. Please try again.';
  } catch (error) {
    console.error('Error generating musical idea:', error);
    return 'An error occurred while communicating with the AI. Please check the console for details.';
  }
}
