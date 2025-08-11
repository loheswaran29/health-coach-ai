// src/app/api/analyze-meal/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

// IMPORTANT: You must create a .env.local file in the root of your project
// and add your Gemini API key there.
// Example .env.local file:
// GEMINI_API_KEY=YOUR_API_KEY_HERE

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Function to convert a file buffer to a Gemini-compatible format
function fileToGenerativePart(buffer: Buffer, mimeType: string) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
}

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file = data.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const imagePart = fileToGenerativePart(buffer, file.type);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Analyze the food items in this image. 
      Provide a nutritional estimation.
      Identify the meal and list the primary ingredients.
      Estimate the total calories, protein, carbs, and fats.

      Return the response as a JSON object with the following structure:
      {
        "description": "A short description of the meal, e.g., 'Grilled chicken with roasted vegetables'",
        "calories": "A numerical value for the estimated calories, e.g., 450",
        "protein": "A numerical value for the estimated protein in grams, e.g., 35",
        "carbs": "A numerical value for the estimated carbs in grams, e.g., 20",
        "fats": "A numerical value for the estimated fats in grams, e.g., 15"
      }
      If you cannot determine the meal, return a JSON object with an error message:
      {
        "error": "Could not analyze the meal from the image."
      }
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    const text = response.text();
    
    // Clean the response text to ensure it's valid JSON
    const jsonText = text.replace(/```json\n|```/g, '').trim();

    // Parse the cleaned text as JSON
    const analysis = JSON.parse(jsonText);

    return NextResponse.json(analysis);

  } catch (error) {
    console.error("Error in meal analysis API route:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
