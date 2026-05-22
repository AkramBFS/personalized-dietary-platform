"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  ChevronRight,
  MessageCircle,
  ScanLine,
  CheckCircle2,
} from "lucide-react";
import { useChatbot } from "@/context/ChatbotContext";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const FOOD_DATA = [
  {
    id: "sesame-bun",
    name: "Toasted Sesame Bun",
    confidence: "99.5%",
    calories: 75,
    protein: "5g",
    carbs: "28g",
    fats: "3g",
    description:
      "A golden sesame bun with a soft interior and crisp toasted edge.",
    perGram: { calories: 2.15, protein: 0.14, carbs: 0.8, fats: 0.09 },
    path: "M778 258L764.5 250.5L760.5 232L764.5 203.5L786.5 169.5L816.5 143L846.5 122.5L876.5 117L900.5 112C906.167 110.6667 918.2 108 921 108C923.8 108 940.167 105 948 103.5H971L996.5 108H1017.5L1037.5 112L1055.5 117L1074.5 122.5L1084.5 128L1093.5 134L1109.5 143L1122 153L1133 165.5L1141 176L1150 191.5L1158 214L1162.5 237.5L1158 250.5L1150 258L1133 262.5L1115.5 265.5L1093.5 268H1074.5L1047.5 270H1026.5L1000 273.5H979.5H954.5H927H904.5L884 270L857.5 268H837L816.5 265.5L796 262.5L778 258Z",
    // EDIT THESE PERCENTAGES TO POSITION THE CARD AND LINE:
    cardPos: { x: 75, y: 20 }, // Card location (75% from left, 15% from top)
    anchorPos: { x: 50, y: 15 }, // Dot on the burger
  },
  {
    id: "tomato-slice",
    name: "Fresh Tomato",
    confidence: "98.2%",
    calories: 5,
    protein: "0.2g",
    carbs: "1g",
    fats: "0g",
    description: "A juicy tomato slice adding bright acidity and hydration.",
    perGram: { calories: 0.18, protein: 0.01, carbs: 0.04, fats: 0.0 },
    path: "M816.5 349.5L826.5 355.5L843.5 360.5L863 364L882 367.5L901.5 370L923.5 372H943H966H993L1024 370L1050.5 365.5L1075 361L1093.5 356L1107 345V321.5L1102.5 312L1093.5 305.5L1071.5 298.5L1046 295L1016.5 291.5L993 288.5H968H943H923.5L901.5 291.5L882 294L863 297.5L843.5 301L822 309.5L814 315.5V349.5",
    cardPos: { x: 20, y: 25 },
    anchorPos: { x: 50, y: 25 },
  },
  {
    id: "crispy-bacon",
    name: "Crispy Bacon Strips",
    confidence: "97.8%",
    calories: 90,
    protein: "6g",
    carbs: "0.5g",
    fats: "7g",
    description: "Savory crispy bacon with smoky crunch.",
    perGram: { calories: 4.5, protein: 0.3, carbs: 0.01, fats: 0.35 },
    path: "M760 458.5L754.5 436V428.5L777 436L790 424.5L806.5 415.5L821.5 409L806.5 396.5L821.5 390H841L856 396.5L874.5 390L880.5 382L897 377L908 382L921 401H940H969L1001 390L1023 401L1039 390L1063 382L1082.5 390L1096.5 401L1107 412L1118.5 409L1141.5 415.5H1157.5L1173 424.5V432.5L1151 436L1157.5 445.5L1163 458.5H1151L1132.5 464.5L1109.5 471H1087L1074 458.5L1063 445.5L1051.5 441L1031.5 453.5H1014.5L1001 445.5L997 436H986.5L951.5 445.5H921L897 441H880.5L864 458.5L841 464.5L821.5 453.5C819.5 457.167 814.8 464.5 812 464.5H790L777 458.5H760Z",
    cardPos: { x: 75, y: 35 },
    anchorPos: { x: 50, y: 35 },
  },
  {
    id: "cheddar-cheese",
    name: "Melted Cheddar Cheese",
    confidence: "96.5%",
    calories: 110,
    protein: "7g",
    carbs: "0.5g",
    fats: "9g",
    description: "Creamy melted cheddar that gives rich depth.",
    perGram: { calories: 3.14, protein: 0.2, carbs: 0.01, fats: 0.26 },
    path: "M829.5 568.5L817 576.5H810.5L801.5 552.5L790.5 541.5L785.5 530L790.5 517.5L782.5 504.5L790.5 495.5L810.5 486L829.5 482H852.5L873 474H896.5L917.5 469.5H944.5H972L996 477.5H1015L1033 474H1061.5L1087 477.5L1112 486L1130 491.5L1138 504.5L1130 535H1120L1112 522L1105.5 535L1093.5 552.5L1087 568.5L1075.5 586H1065L1056.5 568.5L1049 552.5L1033 546L1015 535L1007 526.5H996L983 535L964.5 526.5L944.5 546L922.5 552.5L908.5 541.5L896.5 522H878L835 546L829.5 568.5Z",
    cardPos: { x: 20, y: 45 },
    anchorPos: { x: 50, y: 45 },
  },
  {
    id: "beef-patty",
    name: "Flame-Grilled Beef Patty",
    confidence: "99.1%",
    calories: 250,
    protein: "20g",
    carbs: "0g",
    fats: "18g",
    description: "Juicy flame-grilled beef patty packed with protein.",
    perGram: { calories: 2.5, protein: 0.2, carbs: 0.0, fats: 0.18 },
    path: "M836 673.5L803 678L792.5 673.5L776.5 662.5C773.833 655.333 768.5 640.6 768.5 639V614.5L776.5 598.5L799.5 584.5L830 578C838.667 575.833 857 571.5 861 571.5C865 571.5 872 568.833 875 567.5H904.5L922 571.5L938.5 564H960.5H993.5L1003 567.5H1028L1045 564L1053.5 567.5L1063.5 587.5H1077L1087 571.5L1105.5 576L1124 584.5L1144 601.5L1153.5 621.5V634L1144 652.5L1137.5 669.5L1128.5 673.5L1119 669.5L1113.5 678L1105.5 673.5L1074 678H1055L1037.5 685H1015L997.5 689.5L978 685L957.5 689.5L942 685H919.5H904.5L892.5 689.5L875 685H858.5L850.5 678L836 673.5Z",
    cardPos: { x: 75, y: 55 },
    anchorPos: { x: 51, y: 55 },
  },
  {
    id: "red-onion",
    name: "Red Onion Rings",
    confidence: "94.4%",
    calories: 10,
    protein: "0.3g",
    carbs: "2g",
    fats: "0g",
    description: "Thin red onion rings offering mild sweetness and crunch.",
    perGram: { calories: 0.4, protein: 0.01, carbs: 0.05, fats: 0.0 },
    path: "M785.5 743.5L788.5 748.5L807 757.5C816.333 759.833 835.5 764.6 837.5 765C839.5 765.4 856 767.167 864 768L905.5 772H944.5L979.5 768L1008 761.5L1018 754H1047.5H1078L1104.5 751L1125.5 745L1133.5 737.5L1125.5 717L1107.5 709L1085.5 704L1067 701L1047.5 698.5L1028.5 696H1008H988.5H972.5H959L939.5 698.5L922.5 704L917 709H908H888.5H864L843 711L819.5 713.5L801.5 719L792.5 725L785.5 743.5Z",
    cardPos: { x: 20, y: 65 },
    anchorPos: { x: 50, y: 70 },
  },
  {
    id: "lettuce-leaf",
    name: "Fresh Green Lettuce",
    confidence: "98.9%",
    calories: 2,
    protein: "0.2g",
    carbs: "0.5g",
    fats: "0g",
    description: "Crisp green lettuce adding freshness and a light crunch.",
    perGram: { calories: 0.2, protein: 0.01, carbs: 0.05, fats: 0.0 },
    path: "M760.5 834V841L754 837.5V834H746.5V830L741.5 824.5V801L746.5 795.5L739 787.5L746.5 779.5L754 782.5L759.5 787.5L763 784.5L767 777.5H774.5L778 784.5H785L797 789.5V782.5V775L803 772.5L810.5 775V784.5L818.5 789.5L821 782.5L824 779.5L826.5 784.5H830.5L844 789.5L854 782.5H863.5L864 775L875.5 779.5V772.5L879 769.5L891 772.5L934.5 775H941.5L950 779.5L953 784.5L964 789.5L972 784.5L982.5 773.5H988.5L992.5 768H1003.5L1014 772L1025.5 778L1035 775L1045.5 768H1053V775L1048.5 784.5L1055.5 787L1071.5 784.5L1083.5 780L1094 778L1098 775L1107 778L1118.5 772C1120.67 770.667 1125.5 768 1127.5 768C1129.5 768 1131 760.333 1131.5 756.5L1142 759.5V772L1152 778L1162 768L1168 772L1165.5 780L1173 775L1179 785.5L1189 791L1187 799.5H1181.5V830L1173 841H1165.5L1162 830L1152 825L1146.5 830H1138L1135.5 841L1118.5 844V837.5L1112 827.5L1107 830V834L1104 841L1107 848.5L1101 853.5L1079 862L1071.5 857L1061 853.5V844L1053 834L1037.5 827.5V834L1025.5 853.5H1014H1001L992.5 846L990 834L982.5 830L978.5 837.5L972 841L964 846L953 844L948 848.5L941.5 846L938 841L930 837.5L927 830L911.5 841L914.5 851V857L899 860L894.5 851H889L875.5 860L860 846L864 841V834L856 830H844L839.5 837.5L826.5 834L810.5 841H800.5L793.5 857H788L782 841L785 834H775.5L767 827L760.5 834Z",
    cardPos: { x: 75, y: 75 },
    anchorPos: { x: 50, y: 78 },
  },
  {
    id: "toasted-sesame-bun-with-burger-sauce",
    name: "Bottom Bun & Sauce",
    confidence: "91.2%",
    calories: 160,
    protein: "0.5g",
    carbs: "2g",
    fats: "8g",
    description: "A creamy burger sauce layer on a toasted bottom bun.",
    perGram: { calories: 1.6, protein: 0.01, carbs: 0.02, fats: 0.08 },
    path: "M768.5 929V906.5L781.5 894L798 887L821.5 881L847.5 877.5L878.5 872H914.5L936.5 868L966.5 865.5L1006 868H1020.5C1028.83 869.333 1045.9 872 1047.5 872C1049.1 872 1069.17 873.667 1079 874.5L1109.5 880.5L1140 891L1151 899.5L1154 913V947L1136 970.5L1112 985C1102 987.833 1081.4 993.5 1079 993.5C1076.6 993.5 1053 996.833 1041.5 998.5L1011.5 1002H966.5H914.5L878.5 998.5L847.5 993.5L821.5 989.5L798 980.5L781.5 969L768.5 948.5V929Z",
    cardPos: { x: 20, y: 80 },
    anchorPos: { x: 50, y: 90 },
  },
];

export default function UnifiedHeroSection() {
  const { openChatbot } = useChatbot();

  const triggerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const scannerLayerRef = useRef<HTMLDivElement>(null);
  const scanLineRef = useRef<HTMLDivElement>(null);
  const scanCompleteRef = useRef<HTMLDivElement>(null);

  const [activeFood, setActiveFood] = useState<(typeof FOOD_DATA)[0] | null>(
    null,
  );
  const lastActiveFood = useRef<(typeof FOOD_DATA)[0] | null>(null);

  if (activeFood) {
    lastActiveFood.current = activeFood;
  }

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top top",
          // Calculate distance: 4000px + 1 viewport height for the overlap
          end: () => `+=${4000 + window.innerHeight}`,
          scrub: 0.5,
          pin: true,
        },
      });

      // 1. Fade out dark background overlay and animate Hero content upwards
      tl.to(
        overlayRef.current,
        { opacity: 0, duration: 1.5, ease: "power2.inOut" },
        0,
      );

      tl.to(
        heroContentRef.current,
        {
          opacity: 0,
          y: -100,
          duration: 1.5,
          ease: "power2.inOut",
          onComplete: () => {
            if (heroContentRef.current)
              heroContentRef.current.style.pointerEvents = "none";
          },
          onReverseComplete: () => {
            if (heroContentRef.current)
              heroContentRef.current.style.pointerEvents = "auto";
          },
        },
        0,
      );

      // 2. Begin Video Scrubbing
      const videoObj = { time: 0 };
      tl.to(
        videoObj,
        {
          time: 1,
          duration: 6,
          ease: "none",
          onUpdate: () => {
            if (videoRef.current && !isNaN(videoRef.current.duration)) {
              videoRef.current.currentTime =
                videoObj.time * videoRef.current.duration;
            }
          },
        },
        1.5,
      );

      // 3. Scanner Line sweeps down during the final portion of the video scrub
      tl.fromTo(
        scanLineRef.current,
        { opacity: 0, top: "0%" },
        { opacity: 1, top: "100%", duration: 4, ease: "none" },
        2.5,
      ).to(scanLineRef.current, { opacity: 0, duration: 0.5 }, 6.5);

      // 4. Video completes -> Render SVGs & show scan complete badge
      tl.to(scanCompleteRef.current, { opacity: 1, duration: 0.5 }, 7.5);
      tl.to(
        scannerLayerRef.current,
        {
          opacity: 1,
          duration: 0.5,
          onStart: () => {
            if (scannerLayerRef.current)
              scannerLayerRef.current.style.pointerEvents = "auto";
          },
          onReverseComplete: () => {
            if (scannerLayerRef.current)
              scannerLayerRef.current.style.pointerEvents = "none";
            setActiveFood(null);
          },
        },
        7.5,
      );

      // 5. THE MAGIC "WAIT" STATE
      // This empty animation lasts 2.5 "GSAP seconds" (mapping to the extra 100vh we added).
      // It forces the Hero to stay pinned and static while the natural scroll pulls the Content section up over it.
      tl.to({}, { duration: 2.5 });
    },
    { scope: triggerRef },
  );

  return (
    <main>
      <section
        id="hero-ai-section"
        ref={triggerRef}
        className="relative h-screen w-full bg-black overflow-hidden flex items-center justify-center"
      >
        {/* ===== BACKGROUND VIDEO ===== */}
        <video
          ref={videoRef}
          src="/branding/HeroVideo.mp4"
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />

        {/* ===== DARK OVERLAY (Fades out to reveal crisp video) ===== */}
        <div ref={overlayRef} className="absolute inset-0 bg-black/70 z-10" />

        {/* ===== HERO CONTENT ===== */}
        <div
          ref={heroContentRef}
          className="relative z-20 mx-auto w-full max-w-7xl px-6 lg:px-8"
        >
          <div className="max-w-3xl mx-auto text-center">
            <p className="mb-4 text-sm uppercase tracking-widest text-emerald-400 font-medium">
              SVMB / professional dietary assessment platform
            </p>

            <h1 className="font-syne text-white text-5xl leading-[1.05] md:text-6xl lg:text-7xl tracking-tight">
              Your personal
              <br />
              <span className="text-emerald-400">AI dietitian</span>,
              <br />
              powered by data
            </h1>

            <p className="mt-8 max-w-2xl mx-auto text-lg md:text-xl text-white/70 leading-relaxed">
              Track calories, analyze meals from photos, and get personalized
              nutrition guidance — all in one intelligent system built to adapt
              to you.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="pr-4.5 bg-emerald-500 hover:bg-emerald-600 text-black"
              >
                <Link href="/register">
                  Get started
                  <ChevronRight className="ml-1 opacity-70" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={openChatbot}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Ask the AI
              </Button>
            </div>
          </div>
        </div>

        {/* ===== SCANNING LINE ===== */}
        <div
          ref={scanLineRef}
          className="absolute left-0 right-0 h-[2px] bg-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,1)] z-30 opacity-0 pointer-events-none [will-change:top,opacity]"
        />

        {/* ===== AI SCAN COMPLETE OVERLAY (FLOATING BADGE) ===== */}
        <div
          ref={scanCompleteRef}
          className="absolute top-12 left-1/2 -translate-x-1/2 z-40 transition-all duration-700 opacity-0 pointer-events-none"
        >
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-full px-6 py-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium tracking-wide text-white">
              Scan Complete.{" "}
              <span className="text-emerald-400/80">
                Hover to inspect ingredients.
              </span>
            </span>
          </div>
        </div>

        {/* ===== THE INTERACTIVE AI SCANNER LAYER ===== */}
        <div
          ref={scannerLayerRef}
          className="absolute inset-0 w-full h-full transition-opacity duration-500 opacity-0 pointer-events-none z-30"
        >
          {/* THE UNIFIED SVG LAYER */}
          <svg
            className="absolute inset-0 w-full h-full z-10"
            viewBox="0 0 1920 1080"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <mask id="food-mask">
                <rect x="0" y="0" width="1920" height="1080" fill="white" />
                {(activeFood || lastActiveFood.current) && (
                  <path
                    d={activeFood?.path || lastActiveFood.current?.path}
                    fill="black"
                  />
                )}
              </mask>
            </defs>

            {/* Masked Blur Overlay */}
            <foreignObject
              x="0"
              y="0"
              width="1920"
              height="1080"
              mask="url(#food-mask)"
            >
              <div
                className={`w-full h-full backdrop-blur-md bg-black/60 transition-opacity duration-500 ${
                  activeFood ? "opacity-100" : "opacity-0"
                }`}
              />
            </foreignObject>

            {/* Interactive Mapping Paths */}
            {FOOD_DATA.map((food) => (
              <path
                key={food.id}
                d={food.path}
                className={`
                  cursor-crosshair transition-all duration-300
                  ${
                    activeFood?.id === food.id
                      ? "fill-emerald-400/10 stroke-emerald-400 stroke-[2px]"
                      : "fill-transparent stroke-transparent hover:fill-white/10 hover:stroke-white/50 hover:stroke-[1px]"
                  }
                `}
                onMouseEnter={() => setActiveFood(food)}
                onMouseLeave={() => setActiveFood(null)}
              />
            ))}
          </svg>

          {/* ELEGANT CARDS & CONNECTING LINES */}
          {activeFood && (
            <div className="absolute inset-0 z-30 pointer-events-none">
              {/* Connecting Line Vector */}
              <svg className="absolute inset-0 w-full h-full drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                <defs>
                  <linearGradient
                    id="line-gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                <line
                  x1={`${activeFood.cardPos.x}%`}
                  y1={`${activeFood.cardPos.y}%`}
                  x2={`${activeFood.anchorPos.x}%`}
                  y2={`${activeFood.anchorPos.y}%`}
                  stroke="url(#line-gradient)"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />

                {/* Glowing Anchor Point */}
                <circle
                  cx={`${activeFood.anchorPos.x}%`}
                  cy={`${activeFood.anchorPos.y}%`}
                  r="12"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="1.5"
                  className="animate-ping opacity-60"
                />
                <circle
                  cx={`${activeFood.anchorPos.x}%`}
                  cy={`${activeFood.anchorPos.y}%`}
                  r="6"
                  fill="rgba(52, 211, 153, 0.2)"
                />
                <circle
                  cx={`${activeFood.anchorPos.x}%`}
                  cy={`${activeFood.anchorPos.y}%`}
                  r="3"
                  fill="#34d399"
                />

                {/* Card Connection Dot */}
                <circle
                  cx={`${activeFood.cardPos.x}%`}
                  cy={`${activeFood.cardPos.y}%`}
                  r="3"
                  fill="#34d399"
                />
              </svg>

              {/* The Glassmorphic Data Card */}
              <div
                className="absolute w-72 bg-white/5 backdrop-blur-2xl border border-white/20 p-5 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 animate-in fade-in zoom-in-95"
                style={{
                  left: `${activeFood.cardPos.x}%`,
                  top: `${activeFood.cardPos.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="flex justify-between items-start border-b border-white/10 pb-3 mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white tracking-wide">
                      {activeFood.name}
                    </h3>
                    <div className="text-emerald-400 text-xs tracking-wider uppercase mt-1 flex items-center gap-1">
                      <ScanLine className="w-3 h-3" />
                      Confidence: {activeFood.confidence}
                    </div>
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-light text-white">
                    {activeFood.calories}
                  </span>
                  <span className="text-xs text-white/50 uppercase tracking-widest">
                    kcal
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/5 rounded-xl py-2 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="text-[10px] text-white/50 uppercase">
                      Pro
                    </div>
                    <div className="text-sm text-white font-medium">
                      {activeFood.protein}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl py-2 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="text-[10px] text-white/50 uppercase">
                      Carb
                    </div>
                    <div className="text-sm text-white font-medium">
                      {activeFood.carbs}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl py-2 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="text-[10px] text-white/50 uppercase">
                      Fat
                    </div>
                    <div className="text-sm text-white font-medium">
                      {activeFood.fats}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
