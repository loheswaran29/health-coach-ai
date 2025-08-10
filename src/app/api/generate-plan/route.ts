// src/app/api/generate-plan/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import { initAdmin } from '@/lib/firebase-admin';

// Initialize Firebase Admin SDK
const adminDb = initAdmin();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { userId, userProfile } = await req.json();

    if (!userId || !userProfile) {
      return NextResponse.json({ error: "User information is missing." }, { status: 400 });
    }

    // Fetch recent data from Firestore
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

      Based on this data, generate a personalized daily plan.
      Return the response as a single, clean JSON object with the following structure, and nothing else:
      {
        "summary": "A concise and actionable daily summary in 3-4 sentences. Address the user by name, start with a positive observation, identify one key area for focus, and end with a motivational sentence.",
        "mealPlan": {
          "breakfast": "A healthy breakfast suggestion.",
          "lunch": "A healthy lunch suggestion.",
          "dinner": "A healthy dinner suggestion."
        },
        "workoutPlan": {
          "title": "A title for the workout, e.g., 'Full Body Strength' or 'Active Recovery Walk'",
          "exercises": [
            "Exercise 1: with sets and reps, e.g., 'Squats: 3 sets of 10-12 reps'",
            "Exercise 2: with sets and reps",
            "Exercise 3: with sets and reps",
            "Exercise 4: with sets and reps or duration"
          ]
        }
      }
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Clean the response text to ensure it's valid JSON
    const jsonText = text.replace(/```json\n|```/g, '').trim();
    const plan = JSON.parse(jsonText);

    return NextResponse.json(plan);

  } catch (error) {
    console.error("Error in plan generation API route:", error);
    return NextResponse.json({ error: "Failed to generate plan." }, { status: 500 });
  }
}
