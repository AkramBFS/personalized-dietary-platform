"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  ChevronRight,
  MessageCircle,
  ScanLine,
  Activity,
  Cpu,
  Database,
  Terminal,
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
    path: "M778 262L764.5 254.5L760.5 236L764.5 207.5L786.5 173.5L816.5 147L846.5 126.5L876.5 121L900.5 116C906.167 114.6667 918.2 112 921 112C923.8 112 940.167 109 948 107.5H971L996.5 112H1017.5L1037.5 116L1055.5 121L1074.5 126.5L1084.5 132L1093.5 138L1109.5 147L1122 157L1133 169.5L1141 180L1150 195.5L1158 218L1162.5 241.5L1158 254.5L1150 262L1133 266.5L1115.5 269.5L1093.5 272H1074.5L1047.5 274H1026.5L1000 277.5H979.5H954.5H927H904.5L884 274L857.5 272H837L816.5 269.5L796 266.5L778 262Z",
    cardPos: { x: 65, y: 30 },
    anchorPos: { x: 50, y: 15 },
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
    path: "M816.5 353.5L826.5 359.5L843.5 364.5L863 368L882 371.5L901.5 374L923.5 376H943H966H993L1024 374L1050.5 369.5L1075 365L1093.5 360L1107 349V325.5L1102.5 316L1093.5 309.5L1071.5 302.5L1046 299L1016.5 295.5L993 292.5H968H943H923.5L901.5 295.5L882 298L863 301.5L843.5 305L822 313.5L814 319.5V353.5",
    cardPos: { x: 35, y: 35 },
    anchorPos: { x: 50, y: 30 },
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
    path: "M760 462.5L754.5 440V432.5L777 440L790 428.5L806.5 419.5L821.5 413L806.5 400.5L821.5 394H841L856 400.5L874.5 394L880.5 386L897 381L908 386L921 405H940H969L1001 394L1023 405L1039 394L1063 386L1082.5 394L1096.5 405L1107 416L1118.5 413L1141.5 419.5H1157.5L1173 428.5V436.5L1151 440L1157.5 449.5L1163 462.5H1151L1132.5 468.5L1109.5 475H1087L1074 462.5L1063 449.5L1051.5 445L1031.5 457.5H1014.5L1001 449.5L997 440H986.5L951.5 449.5H921L897 445H880.5L864 462.5L841 468.5L821.5 457.5C819.5 461.167 814.8 468.5 812 468.5H790L777 462.5H760Z",
    cardPos: { x: 65, y: 35 },
    anchorPos: { x: 50, y: 40 },
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
    path: "M829.5 572.5L817 580.5H810.5L801.5 556.5L790.5 545.5L785.5 534L790.5 521.5L782.5 508.5L790.5 499.5L810.5 490L829.5 486H852.5L873 478H896.5L917.5 473.5H944.5H972L996 481.5H1015L1033 478H1061.5L1087 481.5L1112 490L1130 495.5L1138 508.5L1130 539H1120L1112 526L1105.5 539L1093.5 556.5L1087 572.5L1075.5 590H1065L1056.5 572.5L1049 556.5L1033 550L1015 539L1007 530.5H996L983 539L964.5 530.5L944.5 550L922.5 556.5L908.5 545.5L896.5 526H878L835 550L829.5 572.5Z",
    cardPos: { x: 35, y: 45 },
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
    path: "M836 677.5L803 682L792.5 677.5L776.5 666.5C773.833 659.333 768.5 644.6 768.5 643V618.5L776.5 602.5L799.5 588.5L830 582C838.667 579.833 857 575.5 861 575.5C865 575.5 872 572.833 875 571.5H904.5L922 575.5L938.5 568H960.5H993.5L1003 571.5H1028L1045 568L1053.5 571.5L1063.5 591.5H1077L1087 575.5L1105.5 580L1124 588.5L1144 605.5L1153.5 625.5V638L1144 656.5L1137.5 673.5L1128.5 677.5L1119 673.5L1113.5 682L1105.5 677.5L1074 682H1055L1037.5 689H1015L997.5 693.5L978 689L957.5 693.5L942 689H919.5H904.5L892.5 693.5L875 689H858.5L850.5 682L836 677.5Z",
    cardPos: { x: 65, y: 55 },
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
    path: "M785.5 747.5L788.5 752.5L807 761.5C816.333 763.833 835.5 768.6 837.5 769C839.5 769.4 856 771.167 864 772L905.5 776H944.5L979.5 772L1008 765.5L1018 758H1047.5H1078L1104.5 755L1125.5 749L1133.5 741.5L1125.5 721L1107.5 713L1085.5 708L1067 705L1047.5 702.5L1028.5 700H1008H988.5H972.5H959L939.5 702.5L922.5 708L917 713H908H888.5H864L843 715L819.5 717.5L801.5 723L792.5 729L785.5 747.5Z",
    cardPos: { x: 35, y: 65 },
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
    path: "M760.5 838V845L754 841.5V838H746.5V834L741.5 828.5V805L746.5 799.5L739 791.5L746.5 783.5L754 786.5L759.5 791.5L763 788.5L767 781.5H774.5L778 788.5H785L797 793.5V786.5V779L803 776.5L810.5 779V788.5L818.5 793.5L821 786.5L824 783.5L826.5 788.5H830.5L844 793.5L854 786.5H863.5L864 779L875.5 783.5V776.5L879 773.5L891 776.5L934.5 779H941.5L950 783.5L953 788.5L964 793.5L972 788.5L982.5 777.5H988.5L992.5 772H1003.5L1014 776L1025.5 782L1035 779L1045.5 772H1053V779L1048.5 788.5L1055.5 791L1071.5 788.5L1083.5 784L1094 782L1098 779L1107 782L1118.5 776C1120.67 774.667 1125.5 772 1127.5 772C1129.5 772 1131 764.333 1131.5 760.5L1142 763.5V776L1152 782L1162 772L1168 776L1165.5 784L1173 779L1179 789.5L1189 795L1187 803.5H1181.5V834L1173 845H1165.5L1162 834L1152 829L1146.5 834H1138L1135.5 845L1118.5 848V841.5L1112 831.5L1107 834V838L1104 845L1107 852.5L1101 857.5L1079 866L1071.5 861L1061 857.5V848L1053 838L1037.5 831.5V838L1025.5 857.5H1014H1001L992.5 850L990 838L982.5 834L978.5 841.5L972 845L964 850L953 848L948 852.5L941.5 850L938 845L930 841.5L927 834L911.5 845L914.5 855V861L899 864L894.5 855H889L875.5 864L860 850L864 845V838L856 834H844L839.5 841.5L826.5 838L810.5 845H800.5L793.5 861H788L782 845L785 838H775.5L767 831L760.5 838Z",
    cardPos: { x: 65, y: 75 },
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
    path: "M768.5 933V910.5L781.5 898L798 891L821.5 885L847.5 881.5L878.5 876H914.5L936.5 872L966.5 869.5L1006 872H1020.5C1028.83 873.333 1045.9 876 1047.5 876C1049.1 876 1069.17 877.667 1079 878.5L1109.5 884.5L1140 895L1151 903.5L1154 917V951L1136 974.5L1112 989C1102 991.833 1081.4 997.5 1079 997.5C1076.6 997.5 1053 1000.833 1041.5 1002.5L1011.5 1006H966.5H914.5L878.5 1002.5L847.5 997.5L821.5 993.5L798 984.5L781.5 973L768.5 952.5V933Z",
    cardPos: { x: 35, y: 80 },
    anchorPos: { x: 50, y: 90 },
  },
];

export default function UnifiedHeroSection() {
  const { openChatbot } = useChatbot();
  const triggerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const scanLineRef = useRef<HTMLDivElement>(null);
  const hudContainerRef = useRef<HTMLDivElement>(null);

  const [activeFood, setActiveFood] = useState<(typeof FOOD_DATA)[0] | null>(
    null,
  );
  const lastActiveFood = useRef<(typeof FOOD_DATA)[0] | null>(null);
  const [hudSize, setHudSize] = useState({ width: 0, height: 0 });

  if (activeFood) lastActiveFood.current = activeFood;

  // Track responsive bounds mapping for sliced SVGs
  useEffect(() => {
    if (!hudContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setHudSize({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height,
        });
      }
    });
    observer.observe(hudContainerRef.current);
    return () => observer.disconnect();
  }, []);

  const getMappedCoords = (pos: { x: number; y: number }) => {
    if (!hudSize.width || !hudSize.height) return pos;

    const { width: winW, height: winH } = hudSize;
    const vidRatio = 1920 / 1080;
    const winRatio = winW / winH;

    let actualW = winW;
    let actualH = winH;

    // Simulate "xMidYMid slice" to translate 1920x1080 canvas coords to active screen bounds
    if (winRatio > vidRatio) {
      actualH = winW / vidRatio;
    } else {
      actualW = winH * vidRatio;
    }

    const xPixel = (pos.x / 100) * actualW;
    const xOffset = (actualW - winW) / 2;
    const mappedX = ((xPixel - xOffset) / winW) * 100;

    const yPixel = (pos.y / 100) * actualH;
    const yOffset = (actualH - winH) / 2;
    const mappedY = ((yPixel - yOffset) / winH) * 100;

    return { x: mappedX, y: mappedY };
  };

  const currentCardPos = activeFood
    ? getMappedCoords(activeFood.cardPos)
    : { x: 0, y: 0 };
  const currentAnchorPos = activeFood
    ? getMappedCoords(activeFood.anchorPos)
    : { x: 0, y: 0 };

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top top",
          end: () => `+=${4000 + window.innerHeight}`,
          scrub: 0.5,
          pin: true,
        },
      });

      // Fade out background overlay
      tl.to(
        overlayRef.current,
        { opacity: 0, duration: 1.5, ease: "power2.inOut" },
        0,
      );

      // Fade out & push up Hero Text
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

      // Scrub Video
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

      // Downward Scanline Effect
      tl.fromTo(
        scanLineRef.current,
        { opacity: 0, top: "0%" },
        { opacity: 1, top: "100%", duration: 4, ease: "none" },
        2.5,
      ).to(scanLineRef.current, { opacity: 0, duration: 0.5 }, 6.5);

      // Fade In HUD UI & Enable Pointer Events on completion
      tl.to(
        hudContainerRef.current,
        {
          autoAlpha: 1,
          duration: 0.5,
          onStart: () => {
            if (hudContainerRef.current)
              hudContainerRef.current.style.pointerEvents = "auto";
          },
          onReverseComplete: () => {
            setActiveFood(null);
            if (hudContainerRef.current)
              hudContainerRef.current.style.pointerEvents = "none";
          },
        },
        7.5,
      );

      tl.to({}, { duration: 2.5 });
    },
    { scope: triggerRef },
  );

  return (
    <main className="bg-black">
      <section
        id="hero-ai-section"
        ref={triggerRef}
        className="relative h-screen w-full bg-black overflow-hidden flex items-center justify-center font-mono"
      >
        <video
          ref={videoRef}
          src="/branding/HeroVideo.mp4"
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />

        <div ref={overlayRef} className="absolute inset-0 bg-black/80 z-10" />

        {/* ===== HERO CONTENT (Untouched) ===== */}
        <div
          ref={heroContentRef}
          className="relative z-20 mx-auto w-full max-w-7xl px-6 lg:px-8 font-sans"
        >
          <div className="max-w-3xl mx-auto text-center">
            <p className="mb-4 text-sm uppercase tracking-widest text-[#97E7CC] font-medium">
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
                variant="ghost"
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
          className="absolute left-0 right-0 h-[1px] shadow-[0_0_15px_#97E7CC] z-30 opacity-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, #97E7CC 0%, #A9EDD2 50%, #BFF5DD 100%)",
          }}
        />

        {/* ===== MASTER HUD CONTAINER (Controlled by GSAP autoAlpha) ===== */}
        <div
          ref={hudContainerRef}
          className="absolute inset-0 w-full h-full z-40 invisible opacity-0 pointer-events-none"
        >
          {/* Subtle Center Radar Anchor */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none opacity-20">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full animate-[spin_60s_linear_infinite]"
            >
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke="#97E7CC"
                strokeWidth="0.2"
                strokeDasharray="2 4"
              />
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="none"
                stroke="#A9EDD2"
                strokeWidth="0.1"
              />
              <path
                d="M50 0 L50 100 M0 50 L100 50"
                stroke="#BFF5DD"
                strokeWidth="0.1"
                opacity="0.5"
              />
            </svg>
          </div>

          {/* Corner Brackets */}
          <div className="absolute top-8 left-8 w-16 h-16 border-t border-l border-[#97E7CC]/40" />
          <div className="absolute top-8 right-8 w-16 h-16 border-t border-r border-[#97E7CC]/40" />
          <div className="absolute bottom-8 left-8 w-16 h-16 border-b border-l border-[#97E7CC]/40" />
          <div className="absolute bottom-8 right-8 w-16 h-16 border-b border-r border-[#97E7CC]/40" />

          {/* Top Status Bar */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-10 text-[10px] text-[#A9EDD2]/70 tracking-widest uppercase">
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-[#97E7CC]" /> SYSTEM STATUS:{" "}
              <span className="text-white">OPTIMAL</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-3 h-3 text-[#97E7CC]" /> NEURAL LINK:{" "}
              <span className="text-white">ACTIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-3 h-3 text-[#97E7CC]" /> MEMORY:{" "}
              <span className="text-white">12.4 GB</span>
            </div>
          </div>

          {/* Bottom System Log */}
          <div className="absolute bottom-10 left-12 flex flex-col gap-1 border-l border-[#97E7CC]/50 pl-4 py-1">
            <div className="flex items-center gap-2 text-[#97E7CC] text-xs font-bold tracking-tighter">
              <Terminal className="w-3 h-3" /> SYSTEM_LOG // METRICS_LOCKED
            </div>
            <div className="text-[10px] text-[#A9EDD2]/60 uppercase tracking-widest">
              Hover components to extract nutrient metadata
            </div>
          </div>

          {/* Interactive Food Scanner SVG Map */}
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

            <foreignObject
              x="0"
              y="0"
              width="1920"
              height="1080"
              mask="url(#food-mask)"
              className="pointer-events-none"
            >
              <div
                className={`w-full h-full bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${activeFood ? "opacity-100" : "opacity-0"}`}
              />
            </foreignObject>

            {FOOD_DATA.map((food) => (
              <path
                key={food.id}
                d={food.path}
                className={`cursor-crosshair transition-all duration-300 pointer-events-auto ${
                  activeFood?.id === food.id
                    ? "fill-[#97E7CC]/10 stroke-[#97E7CC] stroke-[1.5px] opacity-100"
                    : "fill-transparent stroke-[#97E7CC]/20 stroke-[0.5px] hover:fill-[#97E7CC]/5"
                }`}
                onMouseEnter={() => setActiveFood(food)}
                onMouseLeave={() => setActiveFood(null)}
              />
            ))}
          </svg>

          {/* JARVIS DATA CARD & CONNECTORS */}
          {activeFood && (
            <div className="absolute inset-0 z-30 pointer-events-none">
              <svg className="absolute inset-0 w-full h-full">
                {/* Angular Tech Connector */}
                <path
                  d={`M ${currentCardPos.x}% ${currentCardPos.y}% L ${currentAnchorPos.x}% ${currentCardPos.y}% L ${currentAnchorPos.x}% ${currentAnchorPos.y}%`}
                  fill="none"
                  stroke="#A9EDD2"
                  strokeWidth="1"
                  strokeDasharray="4 2"
                  className="opacity-70"
                />
                <circle
                  cx={`${currentAnchorPos.x}%`}
                  cy={`${currentAnchorPos.y}%`}
                  r="3"
                  fill="#97E7CC"
                  className="animate-pulse"
                />
                <circle
                  cx={`${currentCardPos.x}%`}
                  cy={`${currentCardPos.y}%`}
                  r="2"
                  fill="#97E7CC"
                />
              </svg>

              {/* Data Widget */}
              <div
                className="absolute w-72 bg-background/60 backdrop-blur-md border border-[#97E7CC]/30 p-4 shadow-[0_0_30px_rgba(151,231,204,0.1)] transition-all duration-300"
                style={{
                  left: `${currentCardPos.x}%`,
                  top: `${currentCardPos.y}%`,
                  // DYNAMIC TRANSFORM FIX: Push to left if cardPos.x < 50, otherwise push to right
                  transform:
                    activeFood.cardPos.x < 50
                      ? "translate(calc(-100% - 15px), -50%)"
                      : "translate(15px, -50%)",
                }}
              >
                {/* Top decorative line */}
                <div
                  className="absolute top-0 left-0 w-full h-[2px]"
                  style={{
                    background:
                      "linear-gradient(90deg, #97E7CC 0%, transparent 100%)",
                  }}
                />

                <div className="flex justify-between items-center mb-3 text-[9px] text-[#A9EDD2]/70 tracking-widest">
                  <span className="flex items-center gap-1">
                    <ScanLine className="w-3 h-3 text-[#97E7CC]" /> TARGET_ID:{" "}
                    {activeFood.id.substring(0, 8).toUpperCase()}
                  </span>
                  <span>CONF: {activeFood.confidence}</span>
                </div>

                <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                  {activeFood.name}
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-[#97E7CC]/20 pb-2">
                    <span className="text-[10px] text-[#A9EDD2]/60 uppercase tracking-widest">
                      Energy_Yield
                    </span>
                    <span className="text-2xl text-[#97E7CC]">
                      {activeFood.calories}
                      <span className="text-xs text-[#A9EDD2]/50 ml-1">
                        KCAL
                      </span>
                    </span>
                  </div>

                  {/* Gradient Progress Bars */}
                  {[
                    { label: "PRT", val: activeFood.protein, width: "70%" },
                    { label: "CRB", val: activeFood.carbs, width: "45%" },
                    { label: "FAT", val: activeFood.fats, width: "30%" },
                  ].map((nut) => (
                    <div key={nut.label} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-[#A9EDD2]/80">
                        <span>{nut.label}</span>
                        <span className="text-white">{nut.val}</span>
                      </div>
                      <div className="h-[1px] w-full bg-white/10">
                        <div
                          className="h-full shadow-[0_0_5px_#97E7CC]"
                          style={{
                            width: nut.width,
                            background:
                              "linear-gradient(90deg, #97E7CC 0%, #A9EDD2 50%, #BFF5DD 100%)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom decorative readouts */}
                <div className="mt-5 pt-3 border-t border-[#97E7CC]/20 text-[9px] text-[#A9EDD2]/50 leading-relaxed tracking-widest flex justify-between">
                  <span>STRUCTURAL_ANALYSIS</span>
                  <span className="text-[#97E7CC]">COMPLETE</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
