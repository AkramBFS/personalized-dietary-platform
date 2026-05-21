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
    path: "M769 234L770.5 246.5L778.5 252L792.5 256L814.5 261L850 263.5L878.5 265.5L937 267H975.5H1017.5L1053 266L1078.5 264.5L1101 262.5L1119.5 260L1140.5 257.5L1158.5 253L1164.5 247.5L1169 241L1168.5 228L1166.5 220L1165.5 210L1162 199.5L1159 193L1156.5 185.5L1153.5 181V175L1149.5 168.5L1146 166L1141 164.5L1138.5 160L1132.5 152.5L1126 149.5L1124.5 144.5L1118.5 139L1110.5 138L1109 135L1104.5 131.5L1100 127.5L1091 125L1089 122.5L1084.5 121.5H1082L1079 117L1074.5 114.5L1065.5 116L1059.5 111L1052 110.5L1044.5 108L1038.5 105L1030.5 104L1020 103.5L1009 104L1000.5 101H996.5L994 104L992 101H987.5H978.5L974 103.5L965 101L957 103.5L943 101H936.5L932 103.5L929 101H924L917 107L912 105H905.5L899.5 107H892L884.5 108L879.5 112L872 112.5L868 116.5H857.5L848.5 124L837.5 126.5L830 132L825.5 139.5L816.5 141L808 147L803 158.5L793 161L787.5 175.5L782 180.5L777 190L774 198.5V208.5L769 234Z",
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
    path: "M822 344V316.5C824.167 313.167 828.8 306.3 830 305.5C831.2 304.7 839.5 301.5 843.5 300C849.167 298.667 860.8 296 862 296C863.2 296 870.833 294 874.5 293C882.167 291.5 897.8 288.5 899 288.5C900.5 288.5 916.5 286 918 286C919.2 286 931.333 285 937 285H958.5H991.5L1015.5 286L1039 288.5L1071.5 293L1098.5 301L1115 311.5V316.5V341L1108 347L1087 357.5C1075.5 359.5 1052.2 363.6 1051 364C1049.8 364.4 1031.5 366.833 1022.5 368H980H951L926 366.5L903.5 364L872.5 359L852.5 357L830 350L822 344Z",
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
    path: "M787.5 455H771L763 446.5L767 440.5L758.5 430.5L767 425.5L775.5 430.5H785.5L793 425.5L805.5 415.5L819 407L832 405L823.5 401.5L821 397L814 394L819 387.5H832H849.5L864 391.5C866.333 390.833 871.7 389.1 874.5 387.5C877.3 385.9 881.667 385.167 883.5 385L892 375.5H903.5H914L924 385L932 397C934 396 938.7 394 941.5 394H952L966.5 397H978L988.5 389.5L1006.5 387.5L1018.5 391.5L1029 397L1036.5 394C1039 391.667 1044.9 386.6 1048.5 385C1053 383 1059.5 380.5 1064.5 380.5H1071.5L1088 385L1099.5 391.5L1106.5 402.5L1116.5 408L1124.5 405.5L1137.5 410L1148 415.5L1163.5 413.5H1173L1182.5 420V426L1170.5 430.5L1157 434L1161 438L1170.5 450.5L1166.5 456H1152.5L1137.5 464L1120.5 467.5H1099.5L1088 462L1079 453.5L1071.5 442.5L1064.5 438L1053.5 440.5L1041.5 450.5H1029L1015.5 446.5L1006.5 440.5L1001 430.5L988.5 434L964 442.5C957.167 442.5 943.1 442.1 941.5 440.5C939.9 438.9 929.167 438.167 924 438C918.833 436.667 907.9 434 905.5 434H892L887 440.5L871 450.5L860 459.5H846L829 446.5L819 459.5H797.5L787.5 455Z",
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
    path: "M835 567.5L824 573L812.5 566L808.5 553.5C806.333 549.833 801.7 542.5 800.5 542.5C799.3 542.5 794.667 533 792.5 528.5V505.5L796 494L808.5 486.5L827.5 478.5H857.5L863 475L883 470H911L934 467H959.5H977.5L1000 470H1020L1039.5 467L1053.5 470H1082.5C1085.7 470 1093.83 473.333 1097.5 475L1115.5 481.5L1137 489L1143.5 497.5V509.5L1137 529H1125.5L1119 519.5L1112.5 529L1097.5 558L1082.5 580.5H1074.5L1056.5 551L1031.5 535L1007.5 522.5L991 529L974.5 522.5L963 529L952 541.5L936.5 550C932 548.167 923.3 541.5 922.5 541.5C921.7 541.5 914.167 533.5 910.5 529L903 519.5H883L841 542.5L835 567.5Z",
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
    path: "M804.5 674.5V668.5C803 668.333 799.7 667.7 798.5 666.5C797 665 791 661.5 787 659C783 656.5 782 648.5 781 647.5C780.2 646.7 777.333 640.833 776 638L778 630L776 620L778 607.5L783 598L792.5 591L796.5 585C798.667 585 803.3 585 804.5 585C805.7 585 810.667 581 813 579L826 576.5C831.333 575.333 842.2 572.9 843 572.5C843.8 572.1 855 570.667 860.5 570L875.5 565C878 563.667 883.5 561.1 885.5 561.5C887.5 561.9 900 561.667 906 561.5L915.5 565H938.5L951 559H970.5H995.5L1011.5 563.5H1027.5H1039L1052.5 559L1060 563.5L1071.5 581L1081 582.5L1088 577.5L1094 567L1111.5 569.5L1117 572.5L1118.5 575.5L1128.5 577.5L1130.5 581L1139 582.5L1145.5 588L1151 597.5L1156.5 605L1162 614L1160 619L1156.5 634.5L1153.5 642.5L1151 653.5L1145.5 658.5C1143.33 661.167 1139 666.7 1139 667.5C1139 668.3 1132 669.167 1128.5 669.5H1125.5L1123 673.5H1117L1106.5 669.5C1101.83 670.833 1091.6 673.5 1088 673.5C1084.4 673.5 1079.5 675.833 1077.5 677L1061.5 673.5L1042 680.5H1018L1012.5 683.5L988.5 680.5L969.5 683.5L948 680.5L926.5 683.5L909.5 680.5L895.5 686L885 680.5H863L855 672L839.5 668.5L819 672L804.5 676",
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
    path: "M820.5 755L797 744V722L804 717.5L821.5 710.5L841.5 707.5L891 703H924.5L939.5 698L970.5 690H1009L1054.5 693.5L1088 698L1116.5 703L1134 713.5L1141 735L1116.5 747.5L1091 750.5H1030.5L1004 761.5L963.5 766H904.5L867 761.5L820.5 755Z",
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
    path: "M800 850.5L806 837L816 834.5L819 837L831.5 834.5H846.5L853.5 827L861.5 821.5L875.5 831L870 842.5L875.5 854L885.5 856.5L894 850.5L902 848L908.5 856.5L921 850.5V837L932 827H935V834.5L946 837L953 842.5L960 840L971.5 842.5L981.5 834.5L993.5 821.5L999 831L1003 842.5L1010.5 850.5L1019 848H1031.5L1040 834.5L1046.5 827H1054.5L1062.5 834.5L1068.5 840V850.5L1080.5 854L1087.5 856.5L1109 848L1111.5 837L1114.5 831V821.5L1122.5 827L1128 837L1137 840L1142.5 831L1152.5 824.5L1162.5 821.5L1170.5 831L1177 840L1189.5 824.5V807.5V794.5L1197 789L1186.5 782L1180 770L1174 778.5V765.5L1162.5 770H1152.5L1147.5 757L1142.5 753L1132 765.5L1117.5 770C1112.33 770.833 1101.1 772.7 1097.5 773.5C1093 774.5 1085 775 1080.5 778.5C1076.9 781.3 1067 782 1062.5 782L1054.5 778.5L1062.5 770V763L1052 765.5L1036.5 773.5L1021 767.5L1003 763L988 770C985.333 774 979.5 782 977.5 782C975.5 782 968.667 783.667 965.5 784.5L957.5 778.5L946 770L938.5 767.5H902L899 770L891.5 767.5L883 765.5L881 776.5L877.5 771H870V778.5L861.5 776.5C859.167 778.167 854 781.8 852 783C850 784.2 844.167 782.833 841.5 782H834L831.5 776.5L827 778.5C828.5 780.5 830.6 784.5 827 784.5C823.4 784.5 819.167 777.833 817.5 774.5L812 767.5L806 771L802.5 778.5L806 783L794.5 782L784.5 778.5L782.5 772L774.5 774.5L768 782L761.5 778.5L755.5 774.5L748.5 778.5V788.5L753 792.5L748.5 804V814L753 821.5L755.5 831L761.5 827V834.5L768 837L770 828L774.5 821.5L782.5 827L791 828L788.5 834.5L791 840",
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
    path: "M776.5 935V900.5L797.5 885.5L820.5 878.5L843.5 874C855.667 872.333 880.6 868.8 883 868C885.4 867.2 899 865.667 905.5 865L936.5 863.5H971.5H1009L1041.5 866C1049.67 867.333 1067.4 870.1 1073 870.5C1078.6 870.9 1102 875 1113 877C1122.33 878.667 1141.9 882.3 1145.5 883.5C1149.1 884.7 1156.33 893 1159.5 897V948L1131.5 974.5L1085.5 988L1021 997.5H962H903.5L847 988L811 980L789.5 966L776.5 935Z",
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
          end: "+=4000",
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

      // 2. Begin Video Scrubbing *only* after hero text is completely gone (starts at 1.5s relative timeline mark)
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
            setActiveFood(null); // Clear active card when scrolling backwards
          },
        },
        7.5,
      );
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
