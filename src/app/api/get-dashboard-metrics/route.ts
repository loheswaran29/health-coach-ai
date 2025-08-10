// src/app/api/get-dashboard-metrics/route.ts

import { NextResponse } from 'next/server';
import { initAdmin } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
const adminDb = initAdmin();

// Helper function to calculate sleep duration in hours
const calculateSleepDuration = (bedTime: string, wakeTime: string): number => {
    const [bedHour, bedMinute] = bedTime.split(':').map(Number);
    const [wakeHour, wakeMinute] = wakeTime.split(':').map(Number);

    let bedDate = new Date();
    bedDate.setHours(bedHour, bedMinute, 0, 0);

    let wakeDate = new Date();
    wakeDate.setHours(wakeHour, wakeMinute, 0, 0);

    // If wake time is earlier than bed time, it's the next day
    if (wakeDate < bedDate) {
        wakeDate.setDate(wakeDate.getDate() + 1);
    }

    const durationMillis = wakeDate.getTime() - bedDate.getTime();
    return durationMillis / (1000 * 60 * 60); // Convert to hours
};

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is missing." }, { status: 400 });
    }

    // Calculate the date 7 days ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoTimestamp = Timestamp.fromDate(oneWeekAgo);

    // Fetch data from the last 7 days
    const sleepQuery = adminDb.collection(`users/${userId}/sleep`).where('loggedAt', '>=', oneWeekAgoTimestamp);
    const workoutQuery = adminDb.collection(`users/${userId}/workouts`).where('loggedAt', '>=', oneWeekAgoTimestamp);
    const mealQuery = adminDb.collection(`users/${userId}/meals`).where('loggedAt', '>=', oneWeekAgoTimestamp);

    const [sleepSnapshot, workoutSnapshot, mealSnapshot] = await Promise.all([
      sleepQuery.get(),
      workoutQuery.get(),
      mealQuery.get(),
    ]);

    // --- Calculate Metrics ---

    // 1. Sleep Metric
    let avgSleepHours = 0;
    if (!sleepSnapshot.empty) {
        const totalSleepHours = sleepSnapshot.docs
            .map(doc => {
                const data = doc.data();
                return calculateSleepDuration(data.bedTime, data.wakeTime);
            })
            .reduce((sum, hours) => sum + hours, 0);
        avgSleepHours = totalSleepHours / sleepSnapshot.docs.length;
    }
    const avgSleepFormatted = `${avgSleepHours.toFixed(1)}h`;

    // 2. Workout Metric
    const weeklyWorkouts = workoutSnapshot.docs.length;
    const workoutFormatted = `${weeklyWorkouts}/5 days`; // Assuming a goal of 5 days

    // 3. Calories Metric
    let avgCalories = 0;
    if (!mealSnapshot.empty) {
        const totalCalories = mealSnapshot.docs
            .map(doc => doc.data().calories || 0)
            .reduce((sum, cals) => sum + cals, 0);
        
        // To get average per day, we need to count unique days
        const uniqueDays = new Set(mealSnapshot.docs.map(doc => 
            doc.data().loggedAt.toDate().toDateString()
        )).size;

        if (uniqueDays > 0) {
            avgCalories = totalCalories / uniqueDays;
        }
    }
    const caloriesFormatted = `${Math.round(avgCalories)}`;

    return NextResponse.json({
        sleep: { value: avgSleepFormatted, goal: '8.0h' },
        workout: { value: workoutFormatted, goal: '5 days' },
        calories: { value: caloriesFormatted, goal: '2,200' },
    });

  } catch (error) {
    console.error("Error in dashboard metrics API route:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard metrics." }, { status: 500 });
  }
}
