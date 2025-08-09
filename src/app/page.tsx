"use client";

// Welcome to your AI Health Coach App!
// This version has full database integration and AI daily summaries.

import React, { useState, useEffect, useRef } from 'react';

// STEP 1: Import Firebase services
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    addDoc, 
    collection, 
    serverTimestamp 
} from 'firebase/firestore';


// STEP 2: Your Firebase configuration is now active.
const firebaseConfig = {
  apiKey: "AIzaSyDiS6w3KDX8RMK7NUBqagyEv66Wd8pZsJk",
  authDomain: "health-coach-ai-app.firebaseapp.com",
  projectId: "health-coach-ai-app",
  storageBucket: "health-coach-ai-app.firebasestorage.app",
  messagingSenderId: "39441588402",
  appId: "1:39441588402:web:32a2e60b170f16850929ab"
};

// STEP 3: Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// --- ICONS (No changes here) ---
const MoonIcon = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>);
const DumbbellIcon = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m6 2-4 4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>);
const UtensilsIcon = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z"/></svg>);
const CameraIcon = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>);
const UserIcon = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const LogOutIcon = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>);
const ChevronLeftIcon = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>);
const SparklesIcon = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.96 9.96 12 3l2.04 6.96L21 12l-6.96 2.04L12 21l-2.04-6.96L3 12l6.96-2.04Z"/><path d="M3 3h.01"/><path d="M21 21h.01"/><path d="M21 3h.01"/><path d="M3 21h.01"/></svg>);


// --- Reusable Components ---
const Card = ({ children, className = '' }) => (<div className={`bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 backdrop-blur-sm ${className}`}>{children}</div>);
const Button = ({ children, onClick, className = '', variant = 'primary', type = 'button', disabled = false }) => {
    const baseClasses = 'w-full font-bold py-3 px-4 rounded-xl transition-transform transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
        secondary: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 focus:ring-gray-500',
    };
    return (<button onClick={onClick} type={type} className={`${baseClasses} ${variants[variant]} ${className}`} disabled={disabled}>{children}</button>);
};
const Input = ({ id, type = 'text', label, placeholder, value, onChange, required = true, disabled = false }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <input type={type} id={id} name={id} className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 disabled:opacity-70" placeholder={placeholder} value={value} onChange={onChange} required={required} disabled={disabled} />
    </div>
);
const Select = ({ id, label, value, onChange, children }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <select id={id} name={id} value={value} onChange={onChange} className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100">
            {children}
        </select>
    </div>
);
const Textarea = ({ id, label, placeholder, value, onChange }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <textarea id={id} name={id} rows="3" className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100" placeholder={placeholder} value={value} onChange={onChange}></textarea>
    </div>
);

// --- Page Components ---

const Header = ({ onNavigate }) => {
    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };
    return (
        <header className="flex justify-between items-center p-4 text-gray-900 dark:text-white">
            <h1 className="text-2xl font-bold">Health AI</h1>
            <div className="flex items-center space-x-4">
                <button onClick={() => onNavigate('profile')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><UserIcon className="w-6 h-6" /></button>
                <button onClick={handleLogout} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><LogOutIcon className="w-6 h-6" /></button>
            </div>
        </header>
    );
};

const Dashboard = ({ onNavigate, user, userData }) => {
    const name = userData?.name || 'User';
    const greeting = `Hello, ${name}!`;
    
    const [aiSummary, setAiSummary] = useState(`Click "Generate Daily Summary" to get your personalized insights for today!`);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateSummary = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch('/api/generate-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid, userProfile: userData }),
            });
            const data = await response.json();
            if (data.summary) {
                setAiSummary(data.summary);
            } else {
                setAiSummary("Could not generate a summary at this time. Please try again later.");
            }
        } catch (error) {
            console.error(error);
            setAiSummary("An error occurred while generating your summary.");
        } finally {
            setIsGenerating(false);
        }
    };

    const mockPlanData = {
        metrics: [
            { id: 1, name: 'Sleep', value: '7h 45m', goal: '8h', icon: MoonIcon, color: 'text-blue-500' },
            { id: 2, name: 'Workout', value: '3/5 days', goal: '5 days', icon: DumbbellIcon, color: 'text-orange-500' },
            { id: 3, name: 'Calories', value: '1,800', goal: '2,200', icon: UtensilsIcon, color: 'text-green-500' },
        ],
        mealPlan: { breakfast: "Protein smoothie with spinach and berries.", lunch: "Grilled chicken salad with mixed greens and vinaigrette.", dinner: "Salmon with quinoa and roasted asparagus." },
        workoutPlan: { title: "Full Body Strength (Day 3)", exercises: ["Squats: 3 sets of 10-12 reps", "Push-ups: 3 sets to failure", "Bent-over Rows: 3 sets of 10-12 reps", "Plank: 3 sets, 60-second hold"] }
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex justify-between items-start">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{greeting}</h2>
                <Button onClick={handleGenerateSummary} disabled={isGenerating} className="w-auto !py-2 flex items-center space-x-2">
                    <SparklesIcon className="w-5 h-5" />
                    <span>{isGenerating ? "Generating..." : "Generate Daily Summary"}</span>
                </Button>
            </div>
            <Card className="bg-blue-500/10 dark:bg-blue-900/30 border border-blue-500/20">
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">AI Daily Summary</h3>
                <p className="text-gray-700 dark:text-gray-300 min-h-[6rem]">{aiSummary}</p>
            </Card>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {mockPlanData.metrics.map(metric => (
                    <Card key={metric.id} className="text-center">
                        <metric.icon className={`w-8 h-8 mx-auto mb-2 ${metric.color}`} />
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{metric.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Goal: {metric.goal}</p>
                    </Card>
                ))}
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Today's Meal Plan</h3>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                        <li><strong>Breakfast:</strong> {mockPlanData.mealPlan.breakfast}</li>
                        <li><strong>Lunch:</strong> {mockPlanData.mealPlan.lunch}</li>
                        <li><strong>Dinner:</strong> {mockPlanData.mealPlan.dinner}</li>
                    </ul>
                </Card>
                <Card>
                    <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">{mockPlanData.workoutPlan.title}</h3>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                        {mockPlanData.workoutPlan.exercises.map((ex, i) => <li key={i}>{ex}</li>)}
                    </ul>
                </Card>
            </div>
            <Card>
                <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Log Your Day</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Button onClick={() => onNavigate('logMeal')} variant="secondary"><UtensilsIcon className="w-6 h-6 mx-auto mb-2" /> Log Meal</Button>
                    <Button onClick={() => onNavigate('logWorkout')} variant="secondary"><DumbbellIcon className="w-6 h-6 mx-auto mb-2" /> Log Workout</Button>
                    <Button onClick={() => onNavigate('logSleep')} variant="secondary"><MoonIcon className="w-6 h-6 mx-auto mb-2" /> Log Sleep</Button>
                </div>
            </Card>
        </div>
    );
};

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    name: name,
                    email: email,
                    createdAt: new Date(),
                    primaryGoal: 'Improve Longevity',
                });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md">
                <Card className="w-full">
                    <h2 className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                    <p className="text-center text-gray-600 dark:text-gray-400 mb-8">{isLogin ? 'Sign in to continue your journey.' : 'Start your health journey today.'}</p>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {!isLogin && <Input id="name" label="Full Name" placeholder="Alex Doe" value={name} onChange={e => setName(e.target.value)} />}
                        <Input id="email" type="email" label="Email Address" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                        <Input id="password" type="password" label="Password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <Button type="submit" disabled={loading}>{loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}</Button>
                    </form>
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="font-semibold text-blue-600 hover:text-blue-500 ml-1">{isLogin ? 'Sign Up' : 'Sign In'}</button>
                    </p>
                </Card>
            </div>
        </div>
    );
};

const ProfilePage = ({ onNavigate, user, userData, refreshData }) => {
    const [name, setName] = useState(userData?.name || '');
    const [goal, setGoal] = useState(userData?.primaryGoal || 'Improve Longevity');
    const [weight, setWeight] = useState(userData?.weight || '');
    const [height, setHeight] = useState(userData?.height || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, {
                name,
                primaryGoal: goal,
                weight: Number(weight),
                height: Number(height)
            });
            setMessage('Profile saved successfully!');
            await refreshData(); // Refresh data in the main app component
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Error saving profile.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6">
            <div className="flex items-center mb-6">
                <button onClick={() => onNavigate('dashboard')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 mr-2"><ChevronLeftIcon className="w-6 h-6 text-gray-900 dark:text-white" /></button>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile & Goals</h2>
            </div>
            <Card>
                <form className="space-y-6" onSubmit={handleSave}>
                    <Input id="profileName" label="Name" placeholder="Alex Doe" value={name} onChange={e => setName(e.target.value)} />
                    <Input id="profileEmail" label="Email" placeholder={userData?.email} value={userData?.email} onChange={()=>{}} disabled />
                    <Select id="goal" label="Primary Goal" value={goal} onChange={e => setGoal(e.target.value)}>
                        <option>Improve Longevity</option>
                        <option>Lose Weight</option>
                        <option>Build Muscle</option>
                        <option>Increase Energy</option>
                    </Select>
                    <Input id="weight" label="Current Weight (kg)" placeholder="75" type="number" value={weight} onChange={e => setWeight(e.target.value)} />
                    <Input id="height" label="Height (cm)" placeholder="180" type="number" value={height} onChange={e => setHeight(e.target.value)} />
                    {message && <p className="text-green-500 text-sm text-center">{message}</p>}
                    <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
                </form>
            </Card>
        </div>
    );
};

const LogMealPage = ({ onNavigate, user }) => {
    const [description, setDescription] = useState('');
    const [calories, setCalories] = useState('');
    const [manualSaveLoading, setManualSaveLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleManualSave = async (e) => {
        e.preventDefault();
        setManualSaveLoading(true);
        try {
            const mealsCollectionRef = collection(db, "users", user.uid, "meals");
            await addDoc(mealsCollectionRef, {
                description,
                calories: Number(calories),
                loggedAt: serverTimestamp()
            });
            onNavigate('dashboard');
        } catch (err) {
            console.error("Error saving meal:", err);
            setError("Failed to save meal.");
        } finally {
            setManualSaveLoading(false);
        }
    };

    const handleAnalyzeClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setAiLoading(true);
        setError('');
        
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/analyze-meal', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.error) {
                setError(result.error);
            } else {
                setDescription(result.description || '');
                setCalories(result.calories || '');
            }

        } catch (err) {
            console.error("Error analyzing meal:", err);
            setError("Failed to analyze image. Please try again.");
        } finally {
            setAiLoading(false);
        }
    };
    
    return (
        <div className="p-4 md:p-6">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
            />
            <div className="flex items-center mb-6">
                <button onClick={() => onNavigate('dashboard')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 mr-2"><ChevronLeftIcon className="w-6 h-6 text-gray-900 dark:text-white" /></button>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Log a Meal</h2>
            </div>
            <Card>
                <div className="space-y-6">
                    <Button variant="primary" onClick={handleAnalyzeClick} disabled={aiLoading}>
                        {aiLoading ? 'Analyzing...' : <><CameraIcon className="w-6 h-6 mx-auto mb-2" />Analyze Meal with Photo</>}
                    </Button>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-600" /></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or log manually</span></div></div>
                    <form className="space-y-4" onSubmit={handleManualSave}>
                        <Input id="mealDescription" label="Meal Description" placeholder="e.g., Grilled chicken, brown rice" value={description} onChange={e => setDescription(e.target.value)} />
                        <Input id="calories" label="Calories (optional)" placeholder="e.g., 550" type="number" value={calories} onChange={e => setCalories(e.target.value)} required={false} />
                        <Button type="submit" variant="secondary" disabled={manualSaveLoading}>{manualSaveLoading ? "Saving..." : "Save Meal"}</Button>
                    </form>
                </div>
            </Card>
        </div>
    );
};

const LogWorkoutPage = ({ onNavigate, user }) => {
    const [type, setType] = useState('');
    const [duration, setDuration] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const workoutsCollectionRef = collection(db, "users", user.uid, "workouts");
            await addDoc(workoutsCollectionRef, {
                type,
                duration: Number(duration),
                notes,
                loggedAt: serverTimestamp()
            });
            onNavigate('dashboard');
        } catch (err) {
            console.error("Error saving workout:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6">
            <div className="flex items-center mb-6"><button onClick={() => onNavigate('dashboard')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 mr-2"><ChevronLeftIcon className="w-6 h-6 text-gray-900 dark:text-white" /></button><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Log a Workout</h2></div>
            <Card>
                <form className="space-y-6" onSubmit={handleSave}>
                    <Input id="workoutType" label="Workout Type" placeholder="e.g., Full Body Strength" value={type} onChange={e => setType(e.target.value)} />
                    <Input id="duration" label="Duration (minutes)" type="number" placeholder="45" value={duration} onChange={e => setDuration(e.target.value)} />
                    <Textarea id="notes" label="Notes (optional)" placeholder="e.g., Felt strong on squats, increased weight." value={notes} onChange={e => setNotes(e.target.value)} />
                    <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Workout"}</Button>
                </form>
            </Card>
        </div>
    );
};

const LogSleepPage = ({ onNavigate, user }) => {
    const [bedTime, setBedTime] = useState('22:30');
    const [wakeTime, setWakeTime] = useState('06:30');
    const [quality, setQuality] = useState('Good');
    const [loading, setLoading] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const sleepCollectionRef = collection(db, "users", user.uid, "sleep");
            await addDoc(sleepCollectionRef, {
                bedTime,
                wakeTime,
                quality,
                loggedAt: serverTimestamp()
            });
            onNavigate('dashboard');
        } catch (err) {
            console.error("Error saving sleep:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6">
            <div className="flex items-center mb-6"><button onClick={() => onNavigate('dashboard')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 mr-2"><ChevronLeftIcon className="w-6 h-6 text-gray-900 dark:text-white" /></button><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Log Sleep</h2></div>
            <Card>
                <form className="space-y-6" onSubmit={handleSave}>
                    <Input id="sleepTime" label="Time Went to Bed" type="time" value={bedTime} onChange={e => setBedTime(e.target.value)} />
                    <Input id="wakeTime" label="Time Woke Up" type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} />
                    <Select id="quality" label="Sleep Quality" value={quality} onChange={e => setQuality(e.target.value)}>
                        <option>Excellent</option><option>Good</option><option>Fair</option><option>Poor</option>
                    </Select>
                    <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Sleep"}</Button>
                </form>
            </Card>
        </div>
    );
};


// --- Main App Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState('dashboard');

    const fetchUserData = async (currentUser) => {
        if (!currentUser) return;
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            setUserData(userDocSnap.data());
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                await fetchUserData(currentUser);
            } else {
                setUser(null);
                setUserData(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleNavigation = (page) => {
        setCurrentPage(page);
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard onNavigate={handleNavigation} user={user} userData={userData} />;
            case 'profile':
                return <ProfilePage onNavigate={handleNavigation} user={user} userData={userData} refreshData={() => fetchUserData(user)} />;
            case 'logMeal':
                return <LogMealPage onNavigate={handleNavigation} user={user} />;
            case 'logWorkout':
                return <LogWorkoutPage onNavigate={handleNavigation} user={user} />;
            case 'logSleep':
                return <LogSleepPage onNavigate={handleNavigation} user={user} />;
            default:
                return <Dashboard onNavigate={handleNavigation} user={user} userData={userData}/>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    return (
        <main className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans">
            <div className="max-w-4xl mx-auto">
                {user ? (
                    <>
                        <Header onNavigate={handleNavigation} />
                        {renderPage()}
                    </>
                ) : (
                    <AuthPage />
                )}
            </div>
        </main>
    );
}
