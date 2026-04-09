"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Video,
  BarChart3,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Plus,
  Star,
  Flame,
  Target,
  RefreshCw,
  Camera,
  CalendarCheck,
  ListTodo,
  Droplets,
  Trophy,
  Menu,
  X,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  // --- UI STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [greeting, setGreeting] = useState("Hello");

  // --- DATA STATE ---
  const [dailyGoal] = useState(2000);
  const [meals, setMeals] = useState([
    {
      id: 1,
      emoji: "🥑",
      name: "Avocado Toast & Egg",
      time: "Breakfast • 8:30 AM",
      kcal: 420,
      status: "Logged",
      active: false,
    },
    {
      id: 2,
      emoji: "🥗",
      name: "Grilled Chicken Salad",
      time: "Lunch • 1:00 PM",
      kcal: 580,
      status: "Logged",
      active: false,
    },
    {
      id: 3,
      emoji: "🐟",
      name: "Baked Salmon",
      time: "Upcoming Dinner • 7:30 PM",
      kcal: 650,
      status: "Log Now",
      active: true,
    },
  ]);

  // Chart data for last 7 days (Intake vs Goal)
  const [chartData] = useState([
    { day: "Mon", intake: 1800, goal: 2000 },
    { day: "Tue", intake: 2100, goal: 2000 },
    { day: "Wed", intake: 1700, goal: 2000 },
    { day: "Thu", intake: 2300, goal: 2000 },
    { day: "Fri", intake: 1900, goal: 2000 },
    { day: "Sat", intake: 1600, goal: 2000 },
    { day: "Sun", intake: 1450, goal: 2000 },
  ]);

  // --- DERIVED CALCULATIONS ---
  const totalCalories = useMemo(
    () =>
      meals
        .filter((m) => m.status === "Logged")
        .reduce((acc, m) => acc + m.kcal, 0),
    [meals],
  );

  const remaining = dailyGoal - totalCalories;
  const progressPercent = Math.min(
    100,
    Math.floor((totalCalories / dailyGoal) * 100),
  );

  // --- LOGIC: Initialization ---
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // --- LOGIC: AI Processing Simulation ---
  const handleUpload = () => {
    setIsProcessing(true);
    // Simulate AI vision model detecting and segmenting food items
    setTimeout(() => {
      setMeals((prev) =>
        prev.map((meal) =>
          meal.active ? { ...meal, status: "Logged", active: false } : meal,
        ),
      );
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F0FFF4] text-slate-900 font-sans flex">
      {/* MOBILE SIDEBAR OVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white/80 backdrop-blur-md border-r border-emerald-100 
        transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        flex flex-col h-screen sticky top-0
      `}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2ECC71] flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <BarChart3 size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-emerald-900">
              Dieton
            </span>
          </div>
          <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <NavItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active
          />
          <NavItem icon={<UtensilsCrossed size={20} />} label="Meal Plans" />
          <NavItem icon={<Video size={20} />} label="Consultations" />
          <NavItem icon={<BarChart3 size={20} />} label="Analytics" />
          <NavItem icon={<Settings size={20} />} label="Settings" />
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/70 backdrop-blur-md border-b border-emerald-50 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 text-emerald-700"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="relative hidden sm:block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-[#2ECC71] w-64 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <button className="relative p-2 text-slate-500 hover:text-emerald-600 transition-colors">
              <Bell size={22} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 md:pl-6 border-l border-slate-200">
              <img
                src="/professionals/mj4.jpg"
                alt="User"
                className="w-9 h-9 rounded-full border-2 border-emerald-400 bg-white"
              />
              <div className="hidden sm:block">
                <p className="text-sm font-bold leading-tight">Souki</p>
                <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">
                  Pro Member
                </p>
              </div>
              <ChevronDown
                className="hidden sm:block text-slate-400"
                size={16}
              />
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* WELCOME SECTION */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                  {greeting}, Souki! 👋
                </h1>
                <p className="text-slate-500 text-sm md:text-base">
                  Here's your nutritional summary for today.
                </p>
              </div>
              <button
                onClick={handleUpload}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 active:scale-95 disabled:opacity-70"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Plus size={18} />
                )}
                {isProcessing ? "AI Analyzing..." : "Log New Meal"}
              </button>
            </div>

            {/* TOP STATS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatCard
                icon={<Star className="text-blue-500" size={20} />}
                bg="bg-blue-50"
                label="Current Plan"
                value="Hormonal Balance"
                footer="On track"
                footerColor="text-blue-500"
              />
              <StatCard
                icon={<Flame className="text-orange-500" size={20} />}
                bg="bg-orange-50"
                label="Calories Today"
                value={`${totalCalories} kcal`}
                progress={progressPercent}
              />
              <StatCard
                icon={<Target className="text-emerald-500" size={20} />}
                bg="bg-emerald-50"
                label="Remaining"
                value={`${remaining} kcal`}
                footer={`Daily goal: ${dailyGoal} kcal`}
              />
              <StatCard
                icon={<RefreshCw className="text-purple-500" size={20} />}
                bg="bg-purple-50"
                label="Next Consultation"
                value="Mar 12, 10:00"
                footer="Zoom Link Ready"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LEFT COLUMN: Progress & Meals */}
              <div className="lg:col-span-2 space-y-8">
                {/* CHART */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">
                        Weekly Progress
                      </h2>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                        Intake vs Target
                      </p>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorIntake"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#2ECC71"
                              stopOpacity={0.1}
                            />
                            <stop
                              offset="95%"
                              stopColor="#2ECC71"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#F1F5F9"
                        />
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#94A3B8", fontSize: 12 }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#94A3B8", fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="intake"
                          stroke="#2ECC71"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorIntake)"
                        />
                        <Area
                          type="monotone"
                          dataKey="goal"
                          stroke="#CBD5E1"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          fill="transparent"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* TODAY'S MEALS */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">Today's Meals</h2>
                    <button className="text-xs text-emerald-600 font-bold hover:underline">
                      See All
                    </button>
                  </div>
                  <div className="space-y-4">
                    {meals.map((meal, index) => (
                      <MealItem key={index} {...meal} />
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-8">
                {/* QUICK ACTIONS */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <ActionButton
                      icon={
                        isProcessing ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <Camera size={20} />
                        )
                      }
                      label={isProcessing ? "Analyzing..." : "Upload Meal"}
                      onClick={handleUpload}
                    />
                    <ActionButton
                      icon={<CalendarCheck size={20} />}
                      label="Book Consultation"
                    />
                    <ActionButton
                      icon={<ListTodo size={20} />}
                      label="View Digital Plan"
                      full
                    />
                  </div>
                </div>

                {/* MACRO BREAKDOWN */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <h2 className="text-lg font-bold mb-6 text-center">
                    Macro Breakdown
                  </h2>
                  <div className="flex justify-center mb-6">
                    <div className="relative w-36 h-36">
                      <svg
                        className="w-full h-full transform -rotate-90"
                        viewBox="0 0 36 36"
                      >
                        <circle
                          cx="18"
                          cy="18"
                          r="15.9"
                          fill="transparent"
                          stroke="#F1F5F9"
                          strokeWidth="3"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.9"
                          fill="transparent"
                          stroke="#3B82F6"
                          strokeWidth="3"
                          strokeDasharray="45 100"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.9"
                          fill="transparent"
                          stroke="#2ECC71"
                          strokeWidth="3"
                          strokeDasharray="30 100"
                          strokeDashoffset="-45"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.9"
                          fill="transparent"
                          stroke="#F97316"
                          strokeWidth="3"
                          strokeDasharray="20 100"
                          strokeDashoffset="-75"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-slate-800">
                          {progressPercent}%
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center leading-tight">
                          Current
                          <br />
                          Goal
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <MacroRow
                      dotColor="bg-blue-500"
                      label="Protein"
                      current="65g"
                      total="120g"
                    />
                    <MacroRow
                      dotColor="bg-emerald-500"
                      label="Carbs"
                      current="50g"
                      total="150g"
                    />
                    <MacroRow
                      dotColor="bg-orange-500"
                      label="Fats"
                      current="30g"
                      total="60g"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* --- HELPER SUB-COMPONENTS --- */

function NavItem({ icon, label, active = false }: any) {
  return (
    <a
      href="#"
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${active ? "bg-emerald-100 text-emerald-700" : "text-slate-500 hover:bg-emerald-50 hover:text-slate-900"}`}
    >
      {icon}
      {label}
    </a>
  );
}

function StatCard({
  icon,
  label,
  value,
  footer,
  footerColor = "text-slate-400",
  bg,
  progress,
}: any) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
      <div
        className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center shrink-0`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
          {label}
        </p>
        <h3 className="text-lg font-black truncate text-slate-800">{value}</h3>
        {progress !== undefined ? (
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        ) : (
          <p className={`text-[11px] font-bold mt-1 ${footerColor}`}>
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}

function MealItem({ emoji, name, time, kcal, status, active = false }: any) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-2xl transition-all border ${active ? "bg-emerald-50/50 border-emerald-200" : "hover:bg-slate-50 border-transparent"}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm border border-slate-100">
          {emoji}
        </div>
        <div>
          <h4 className="font-bold text-sm leading-tight text-slate-800">
            {name}
          </h4>
          <p className="text-[11px] font-semibold text-slate-400">{time}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-black text-sm text-slate-800">{kcal} kcal</p>
        <p
          className={`text-[10px] font-bold mt-1 uppercase tracking-tight ${status === "Log Now" ? "text-emerald-600 underline cursor-pointer" : "text-emerald-500"}`}
        >
          {status}
        </p>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, full = false, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700 transition-all group ${full ? "col-span-2" : ""}`}
    >
      <span className="mb-2 text-slate-400 group-hover:text-emerald-500 transition-colors">
        {icon}
      </span>
      <span className="text-xs font-bold leading-tight">{label}</span>
    </button>
  );
}

function MacroRow({ dotColor, label, current, total }: any) {
  return (
    <div className="flex items-center justify-between text-xs font-bold">
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`}></div>
        <span className="text-slate-400">{label}</span>
      </div>
      <span className="text-slate-700">
        {current} <span className="text-slate-300 font-medium">/ {total}</span>
      </span>
    </div>
  );
}
