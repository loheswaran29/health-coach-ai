// src/app/api/generate-summary/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import { initAdmin } from '@/lib/firebase-admin'; // We will create this helper file

// Initialize Firebase Admin SDK
const adminDb = initAdmin();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { userId, userProfile } = await req.json();

    if (!userId || !userProfile) {
      return NextResponse.json({ error: "User information is missing." }, { status: 400 });
    }

    // Fetch recent data from Firestore using the correct Firebase Admin SDK syntax
    const sleepQuery = adminDb.collection(`users/${userId}/sleep`).orderBy('loggedAt', 'desc').limit(3);
    const workoutQuery = adminDb.collection(`users/${userId}/workouts`).orderBy('loggedAt', 'desc').limit(3);
    const mealQuery = adminDb.collection(`users/${userId}/meals`).orderBy('loggedAt', 'desc').limit(5);

    const [sleepSnapshot, workoutSnapshot, mealSnapshot] = await Promise.all([
      sleepQuery.get(),
      workoutQuery.get(),
      mealQuery.get(),
    ]);

    const recentSleep = sleepSnapshot.docs.map(doc => doc.data());
    const recentWorkouts = workoutSnapshot.docs.map(doc => doc.data());
    const recentMeals = mealSnapshot.docs.map(doc => doc.data());

    // Construct the detailed prompt for the AI
    const prompt = `
      Act as an expert holistic health and longevity coach named 'Health AI'.
      Your tone should be encouraging, insightful, and slightly informal.
      The user's name is ${userProfile.name} and their primary goal is "${userProfile.primaryGoal}".

      Here is their recent data:
      - User Profile: ${JSON.stringify(userProfile, null, 2)}
      - Recent Sleep: ${JSON.stringify(recentSleep, null, 2)}
      - Recent Workouts: ${JSON.stringify(recentWorkouts, null, 2)}
      - Recent Meals: ${JSON.stringify(recentMeals, null, 2)}

      Based on this data, provide a concise and actionable daily summary in 3-4 sentences. 
      Address the user by name.
      Start with a positive observation.
      Identify one key area for focus today.
      End with a motivational sentence.
      Do not use markdown formatting. Just return the plain text summary.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const summaryText = response.text();

    return NextResponse.json({ summary: summaryText });

  } catch (error) {
    console.error("Error in summary generation API route:", error);
    return NextResponse.json({ error: "Failed to generate summary." }, { status: 500 });
  }
}
