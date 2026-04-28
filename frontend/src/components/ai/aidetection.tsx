"use client";

import { useRef, useState } from "react";
import { ScanLine } from "lucide-react";
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
      "A golden sesame bun with a soft interior and crisp toasted edge to anchor the burger.",
    perGram: {
      calories: 2.15,
      protein: 0.14,
      carbs: 0.8,
      fats: 0.09,
    },
    path: "M769 220L770.5 232.5L778.5 238L792.5 242L814.5 247L850 249.5L878.5 251.5L937 253H975.5H1017.5L1053 252L1078.5 250.5L1101 248.5L1119.5 246L1140.5 243.5L1158.5 239L1164.5 233.5L1169 227L1168.5 214L1166.5 206L1165.5 196L1162 185.5L1159 179L1156.5 171.5L1153.5 167V161L1149.5 154.5L1146 152L1141 150.5L1138.5 146L1132.5 138.5L1126 135.5L1124.5 130.5L1118.5 125L1110.5 124L1109 121L1104.5 117.5L1100 113.5L1091 111L1089 108.5L1084.5 107.5H1082L1079 103L1074.5 100.5L1065.5 102L1059.5 97L1052 96.5L1044.5 94L1038.5 91L1030.5 90L1020 89.5L1009 90L1000.5 87H996.5L994 90L992 87H987.5H978.5L974 89.5L965 87L957 89.5L943 87H936.5L932 89.5L929 87H924L917 93L912 91H905.5L899.5 93H892L884.5 94L879.5 98L872 98.5L868 102.5H857.5L848.5 110L837.5 112.5L830 118L825.5 125.5L816.5 127L808 133L803 144.5L793 147L787.5 161.5L782 166.5L777 176L774 184.5V194.5L769 206V220Z",
  },
  {
    id: "tomato-slice",
    name: "Fresh Tomato",
    confidence: "98.2%",
    calories: 5,
    protein: "0.2g",
    carbs: "1g",
    fats: "0g",
    description:
      "A juicy tomato slice adding bright acidity, hydration, and a fresh pop of red.",
    perGram: {
      calories: 0.18,
      protein: 0.01,
      carbs: 0.04,
      fats: 0.0,
    },
    path: "M822 330V302.5C824.167 299.167 828.8 292.3 830 291.5C831.2 290.7 839.5 287.5 843.5 286C849.167 284.667 860.8 282 862 282C863.2 282 870.833 280 874.5 279C882.167 277.5 897.8 274.5 899 274.5C900.5 274.5 916.5 272 918 272C919.2 272 931.333 271 937 271H958.5H991.5L1015.5 272L1039 274.5L1071.5 279L1098.5 287L1115 297.5V302.5V327L1108 333L1087 343.5C1075.5 345.5 1052.2 349.6 1051 350C1049.8 350.4 1031.5 352.833 1022.5 354H980H951L926 352.5L903.5 350L872.5 345L852.5 343L830 336L822 330Z",
  },
  {
    id: "crispy-bacon",
    name: "Crispy Bacon Strips",
    confidence: "97.8%",
    calories: 90,
    protein: "6g",
    carbs: "0.5g",
    fats: "7g",
    description:
      "Savory crispy bacon with smoky crunch, boosting flavor with every bite.",
    perGram: {
      calories: 4.5,
      protein: 0.3,
      carbs: 0.01,
      fats: 0.35,
    },
    path: "M787.5 441H771L763 432.5L767 426.5L758.5 416.5L767 411.5L775.5 416.5H785.5L793 411.5L805.5 401.5L819 393L832 391L823.5 387.5L821 383L814 380L819 373.5H832H849.5L864 377.5C866.333 376.833 871.7 375.1 874.5 373.5C877.3 371.9 881.667 371.167 883.5 371L892 361.5H903.5H914L924 371L932 383C934 382 938.7 380 941.5 380H952L966.5 383H978L988.5 375.5L1006.5 373.5L1018.5 377.5L1029 383L1036.5 380C1039 377.667 1044.9 372.6 1048.5 371C1053 369 1059.5 366.5 1064.5 366.5H1071.5L1088 371L1099.5 377.5L1106.5 388.5L1116.5 394L1124.5 391.5L1137.5 396L1148 401.5L1163.5 399.5H1173L1182.5 406V412L1170.5 416.5L1157 420L1161 424L1170.5 436.5L1166.5 442H1152.5L1137.5 450L1120.5 453.5H1099.5L1088 448L1079 439.5L1071.5 428.5L1064.5 424L1053.5 426.5L1041.5 436.5H1029L1015.5 432.5L1006.5 426.5L1001 416.5L988.5 420L964 428.5C957.167 428.5 943.1 428.1 941.5 426.5C939.9 424.9 929.167 424.167 924 424C918.833 422.667 907.9 420 905.5 420H892L887 426.5L871 436.5L860 445.5H846L829 432.5L819 445.5H797.5L787.5 441Z",
  },
  {
    id: "cheddar-cheese",
    name: "Melted Cheddar Cheese",
    confidence: "96.5%",
    calories: 110,
    protein: "7g",
    carbs: "0.5g",
    fats: "9g",
    description:
      "Creamy melted cheddar that gives rich depth and a smooth finish to the stack.",
    perGram: {
      calories: 3.14,
      protein: 0.2,
      carbs: 0.01,
      fats: 0.26,
    },
    path: "M804.5 660.5V654.5C803 654.333 799.7 653.7 798.5 652.5C797 651 791 647.5 787 645C783 642.5 782 634.5 781 633.5C780.2 632.7 777.333 626.833 776 624L778 616L776 606L778 593.5L783 584L792.5 577L796.5 571C798.667 571 803.3 571 804.5 571C805.7 571 810.667 567 813 565L826 562.5C831.333 561.333 842.2 558.9 843 558.5C843.8 558.1 855 556.667 860.5 556L875.5 551C878 549.667 883.5 547.1 885.5 547.5C887.5 547.9 900 547.667 906 547.5L915.5 551H938.5L951 545H970.5H995.5L1011.5 549.5H1027.5H1039L1052.5 545L1060 549.5L1071.5 567L1081 568.5L1088 563.5L1094 553L1111.5 555.5L1117 558.5L1118.5 561.5L1128.5 563.5L1130.5 567L1139 568.5L1145.5 574L1151 583.5L1156.5 591L1162 600L1160 605L1156.5 620.5L1153.5 628.5L1151 639.5L1145.5 644.5C1143.33 647.167 1139 652.7 1139 653.5C1139 654.3 1132 655.167 1128.5 655.5H1125.5L1123 659.5H1117L1106.5 655.5C1101.83 656.833 1091.6 659.5 1088 659.5C1084.4 659.5 1079.5 661.833 1077.5 663L1061.5 659.5L1042 666.5H1018L1012.5 669.5L988.5 666.5L969.5 669.5L948 666.5L926.5 669.5L909.5 666.5L895.5 672L885 666.5H863L855 658L839.5 654.5L819 658L804.5 662",
  },
  {
    id: "beef-patty",
    name: "Flame-Grilled Beef Patty",
    confidence: "99.1%",
    calories: 250,
    protein: "20g",
    carbs: "0g",
    fats: "18g",
    description:
      "Juicy flame-grilled beef patty packed with protein and smoky char flavor.",
    perGram: {
      calories: 2.5,
      protein: 0.2,
      carbs: 0.0,
      fats: 0.18,
    },
    path: "M835 553.5L824 559L812.5 552L808.5 539.5C806.333 535.833 801.7 528.5 800.5 528.5C799.3 528.5 794.667 519 792.5 514.5V491.5L796 480L808.5 472.5L827.5 464.5H857.5L863 461L883 456H911L934 453H959.5H977.5L1000 456H1020L1039.5 453L1053.5 456H1082.5C1085.7 456 1093.83 459.333 1097.5 461L1115.5 467.5L1137 475L1143.5 483.5V495.5L1137 515H1125.5L1119 505.5L1112.5 515L1097.5 544L1082.5 566.5H1074.5L1056.5 537L1031.5 521L1007.5 508.5L991 515L974.5 508.5L963 515L952 527.5L936.5 536C932 534.167 923.3 527.5 922.5 527.5C921.7 527.5 914.167 519.5 910.5 515L903 505.5H883L841 528.5L835 553.5Z",
  },
  {
    id: "red-onion",
    name: "Red Onion Rings",
    confidence: "94.4%",
    calories: 10,
    protein: "0.3g",
    carbs: "2g",
    fats: "0g",
    description:
      "Thin red onion rings offering mild sweetness, crunch, and visual contrast.",
    perGram: {
      calories: 0.4,
      protein: 0.01,
      carbs: 0.05,
      fats: 0.0,
    },
    path: "M820.5 741L797 730V708L804 703.5L821.5 696.5L841.5 693.5L891 689H924.5L939.5 684L970.5 676H1009L1054.5 679.5L1088 684L1116.5 689L1134 699.5L1141 721L1116.5 733.5L1091 736.5H1030.5L1004 747.5L963.5 752H904.5L867 747.5L820.5 741Z",
  },
  {
    id: "lettuce-leaf",
    name: "Fresh Green Lettuce",
    confidence: "98.9%",
    calories: 2,
    protein: "0.2g",
    carbs: "0.5g",
    fats: "0g",
    description:
      "Crisp green lettuce adding freshness, lift, and a light crunch.",
    perGram: {
      calories: 0.2,
      protein: 0.01,
      carbs: 0.05,
      fats: 0.0,
    },
    path: "M800 836.5L806 823L816 820.5L819 823L831.5 820.5H846.5L853.5 813L861.5 807.5L875.5 817L870 828.5L875.5 840L885.5 842.5L894 836.5L902 834L908.5 842.5L921 836.5V823L932 813H935V820.5L946 823L953 828.5L960 826L971.5 828.5L981.5 820.5L993.5 807.5L999 817L1003 828.5L1010.5 836.5L1019 834H1031.5L1040 820.5L1046.5 813H1054.5L1062.5 820.5L1068.5 826V836.5L1080.5 840L1087.5 842.5L1109 834L1111.5 823L1114.5 817V807.5L1122.5 813L1128 823L1137 826L1142.5 817L1152.5 810.5L1162.5 807.5L1170.5 817L1177 826L1189.5 810.5V793.5V780.5L1197 775L1186.5 768L1180 756L1174 764.5V751.5L1162.5 756H1152.5L1147.5 743L1142.5 739L1132 751.5L1117.5 756C1112.33 756.833 1101.1 758.7 1097.5 759.5C1093 760.5 1085 761 1080.5 764.5C1076.9 767.3 1067 768 1062.5 768L1054.5 764.5L1062.5 756V749L1052 751.5L1036.5 759.5L1021 753.5L1003 749L988 756C985.333 760 979.5 768 977.5 768C975.5 768 968.667 769.667 965.5 770.5L957.5 764.5L946 756L938.5 753.5H902L899 756L891.5 753.5L883 751.5L881 762.5L877.5 757H870V764.5L861.5 762.5C859.167 764.167 854 767.8 852 769C850 770.2 844.167 768.833 841.5 768H834L831.5 762.5L827 764.5C828.5 766.5 830.6 770.5 827 770.5C823.4 770.5 819.167 763.833 817.5 760.5L812 753.5L806 757L802.5 764.5L806 769L794.5 768L784.5 764.5L782.5 758L774.5 760.5L768 768L761.5 764.5L755.5 760.5L748.5 764.5V774.5L753 778.5L748.5 790V800L753 807.5L755.5 817L761.5 813V820.5L768 823L770 814L774.5 807.5L782.5 813L791 814L788.5 820.5L791 826",
  },
  {
    id: "toasted-sesame-bun-with-burger-sauce",
    name: "Toasted Sesame Bun with Burger Sauce",
    confidence: "91.2%",
    calories: 160,
    protein: "0.5g",
    carbs: "2g",
    fats: "8g",
    description:
      "A creamy burger sauce layer with savory depth and a smooth finish.",
    perGram: {
      calories: 1.6,
      protein: 0.01,
      carbs: 0.02,
      fats: 0.08,
    },
    path: "M776.5 921V886.5L797.5 871.5L820.5 864.5L843.5 860C855.667 858.333 880.6 854.8 883 854C885.4 853.2 899 851.667 905.5 851L936.5 849.5H971.5H1009L1041.5 852C1049.67 853.333 1067.4 856.1 1073 856.5C1078.6 856.9 1102 861 1113 863C1122.33 864.667 1141.9 868.3 1145.5 869.5C1149.1 870.7 1156.33 879 1159.5 883V934L1131.5 960.5L1085.5 974L1021 983.5H962H903.5L847 974L811 966L789.5 952L776.5 921Z",
  },
];

export function AIDetection() {
  const triggerRef = useRef<HTMLElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerLayerRef = useRef<HTMLDivElement>(null);

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
          start: "center center",
          end: "+=3000",
          scrub: 0.5,
          pin: true,
        },
      });

      tl.to(wrapperRef.current, {
        width: "100vw",
        height: "100vh",
        maxWidth: "100%",
        borderRadius: "0px",
        ease: "power2.inOut",
        duration: 1,
      });

      tl.to(
        {},
        {
          duration: 2,
          onUpdate: function () {
            if (videoRef.current && videoRef.current.duration) {
              const currentProgress = this.progress();
              videoRef.current.currentTime =
                currentProgress * videoRef.current.duration;

              if (scannerLayerRef.current) {
                if (currentProgress > 0.95) {
                  scannerLayerRef.current.style.opacity = "1";
                  scannerLayerRef.current.style.pointerEvents = "auto";
                } else {
                  scannerLayerRef.current.style.opacity = "0";
                  scannerLayerRef.current.style.pointerEvents = "none";
                  setActiveFood(null);
                }
              }
            }
          },
        },
      );
    },
    { scope: triggerRef },
  );

  return (
    <section
      ref={triggerRef}
      className="relative h-screen flex items-center justify-center bg-[#010C0E]"
    >
      <div
        ref={wrapperRef}
        className="relative mx-auto w-[90vw] h-[50vh] md:h-[70vh] max-w-6xl rounded-3xl overflow-hidden bg-black/20 ring-1 ring-white/10 shadow-2xl flex items-center justify-center"
      >
        <video
          ref={videoRef}
          src="/branding/HeroVideo.mp4"
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* ===== THE INTERACTIVE AI SCANNER LAYER ===== */}
        <div
          ref={scannerLayerRef}
          className="absolute inset-0 w-full h-full transition-opacity duration-500 opacity-0 pointer-events-none"
        >
          <div className="absolute left-8 top-1/2 z-20 w-[320px] -translate-y-1/2 rounded-[28px] border border-white/10 bg-slate-950/95 p-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center gap-3 rounded-3xl bg-emerald-500/10 px-4 py-3 border border-emerald-400/20">
              <ScanLine className="w-5 h-5 text-emerald-300" />
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-200">
                  AI Scan Complete
                </p>
                <p className="text-sm font-semibold text-white">
                  Classic Burger - Total Nutrition
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Total Calories</span>
                <span className="text-lg font-bold text-emerald-300">
                  702 kcal
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Protein</span>
                <span className="text-sm font-semibold text-orange-400">
                  39.2g
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Carbohydrates</span>
                <span className="text-sm font-semibold text-yellow-300">
                  34.5g
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Fats</span>
                <span className="text-sm font-semibold text-red-300">45g</span>
              </div>
            </div>

            <p className="mt-4 rounded-3xl bg-white/5 border border-white/10 px-4 py-3 text-xs text-emerald-100">
              Hover over individual ingredients to see detailed per-gram
              nutrition breakdown.
            </p>
          </div>

          {/* ===== THE UNIFIED SVG LAYER ===== */}
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

            {/* 1. The Masked Blur Overlay */}
            <foreignObject
              x="0"
              y="0"
              width="1920"
              height="1080"
              mask="url(#food-mask)"
            >
              <div
                className={`w-full h-full backdrop-blur-md bg-black/40 transition-opacity duration-500 ${
                  activeFood ? "opacity-100" : "opacity-0"
                }`}
              />
            </foreignObject>

            {/* 2. The Interactive Mapping Paths */}
            {FOOD_DATA.map((food) => (
              <path
                key={food.id}
                d={food.path}
                className={`
                  cursor-crosshair transition-all duration-300
                  ${
                    activeFood?.id === food.id
                      ? "fill-emerald-400/5 stroke-emerald-400 stroke-[3px]"
                      : "fill-transparent stroke-transparent hover:fill-white/20 hover:stroke-white hover:stroke-2"
                  }
                `}
                onMouseEnter={() => setActiveFood(food)}
                onMouseLeave={() => setActiveFood(null)}
              />
            ))}
          </svg>

          {/* 3. The Floating Data Card */}
          {activeFood && (
            <div
              className="cnx
            absolute z-30 bottom-10 right-10 w-96 min-h-[380px] rounded-[32px] bg-gradient-to-br from-[#01373D] via-emerald-300/65 to-sky-500/70 border border-white/10 p-7 text-white shadow-[0_35px_80px_rgba(14,165,233,0.22)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-700 ease-in-out pointer-events-none"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight font-syne">
                    {activeFood.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-100">
                    {activeFood.description}
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-900 bg-white/80 px-3 py-1 rounded-full shadow-inner">
                  {activeFood.confidence}
                </span>
              </div>

              <div className="text-5xl font-black text-white mb-4">
                {activeFood.calories}
                <span className="text-base text-slate-200 font-medium ml-2">
                  kcal
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-[28px] bg-white/10 border border-white/15 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-200">
                    Per gram
                  </p>
                  <div className="mt-3 space-y-2 text-white">
                    <div className="flex justify-between text-sm">
                      <span>Calories</span>
                      <span>{activeFood.perGram.calories.toFixed(2)} kcal</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Protein</span>
                      <span>{activeFood.perGram.protein.toFixed(2)} g</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Carbs</span>
                      <span>{activeFood.perGram.carbs.toFixed(2)} g</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Fats</span>
                      <span>{activeFood.perGram.fats.toFixed(2)} g</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-[28px] bg-white/10 border border-white/15 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-200">
                    Nutrition snapshot
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-slate-100">
                    <div className="flex justify-between">
                      <span>Protein</span>
                      <span>{activeFood.protein}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Carbs</span>
                      <span>{activeFood.carbs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fats</span>
                      <span>{activeFood.fats}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
