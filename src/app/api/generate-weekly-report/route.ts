// src/app/api/generate-weekly-report/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import { initAdmin } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
const adminDb = initAdmin();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Helper function to calculate sleep duration in hours
const calculateSleepDuration = (bedTime: string, wakeTime: string): number => {
    const [bedHour, bedMinute] = bedTime.split(':').map(Number);
    const [wakeHour, wakeMinute] = wakeTime.split(':').map(Number);
    let bedDate = new Date();
    bedDate.setHours(bedHour, bedMinute, 0, 0);
    let wakeDate = new Date();
    wakeDate.setHours(wakeHour, wakeMinute, 0, 0);
    if (wakeDate < bedDate) {
        wakeDate.setDate(wakeDate.getDate() + 1);
    }
    const durationMillis = wakeDate.getTime() - bedDate.getTime();
    return parseFloat((durationMillis / (1000 * 60 * 60)).toFixed(1));
};

export async function POST(req: Request) {
  try {
    const { userId, userProfile } = await req.json();

    if (!userId || !userProfile) {
      return NextResponse.json({ error: "User information is missing." }, { status: 400 });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoTimestamp = Timestamp.fromDate(oneWeekAgo);

    const sleepQuery = adminDb.collection(`users/${userId}/sleep`).where('loggedAt', '>=', oneWeekAgoTimestamp).orderBy('loggedAt', 'asc');
    const workoutQuery = adminDb.collection(`users/${userId}/workouts`).where('loggedAt', '>=', oneWeekAgoTimestamp);
    const mealQuery = adminDb.collection(`users/${userId}/meals`).where('loggedAt', '>=', oneWeekAgoTimestamp);

    const [sleepSnapshot, workoutSnapshot, mealSnapshot] = await Promise.all([
      sleepQuery.get(),
      workoutQuery.get(),
      mealQuery.get(),
    ]);

    const weeklySleep = sleepSnapshot.docs.map(doc => doc.data());
    const weeklyWorkouts = workoutSnapshot.docs.map(doc => doc.data());
    const weeklyMeals = mealSnapshot.docs.map(doc => doc.data());

    // --- Prepare Data for Chart ---
    const chartData = sleepSnapshot.docs.map(doc => {
        const data = doc.data();
        const date = data.loggedAt.toDate();
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        return {
            name: day,
            sleep: calculateSleepDuration(data.bedTime, data.wakeTime),
        };
    });

    // --- AI Prompt ---
    const prompt = `
      Act as an expert holistic health and longevity coach named 'Health AI'.
      Your tone should be encouraging, insightful, and data-driven.
      The user's name is ${userProfile.name} and their primary goal is "${userProfile.primaryGoal}".

      Here is their data from the past 7 days:
      - User Profile: ${JSON.stringify(userProfile, null, 2)}
      - Weekly Sleep Data: ${JSON.stringify(weeklySleep, null, 2)}
      - Weekly Workout Data: ${JSON.stringify(weeklyWorkouts, null, 2)}
      - Weekly Meal Data: ${JSON.stringify(weeklyMeals, null, 2)}

      Based on this weekly data, generate a comprehensive progress report.
      Return the response as a single, clean JSON object with the following structure, and nothing else:
      {
        "highlights": [
          "A key positive achievement from the week. Be specific and encouraging.",
          "Another positive observation or win from the week."
        ],
        "trends": [
          "An insightful trend you noticed in the data (e.g., 'Your sleep quality seems best on days you work out').",
          "Another data-driven trend (e.g., 'Your calorie intake was most consistent on Monday and Tuesday')."
        ],
        "suggestions": [
          "A specific, actionable suggestion for the upcoming week based on their goal and data.",
          "Another actionable tip to help them improve or stay consistent."
        ]
      }
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    const jsonText = text.replace(/```json\n|```/g, '').trim();
    const report = JSON.parse(jsonText);

    // Combine AI report with chart data
    return NextResponse.json({ ...report, chartData });

  } catch (error) {
    console.error("Error in weekly report generation API route:", error);
    return NextResponse.json({ error: "Failed to generate weekly report." }, { status: 500 });
  }
}
