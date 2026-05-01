"use client";

import { motion } from "framer-motion";
import {
  Utensils,
  Target,
  Stethoscope,
  Wallet,
  BadgeCheck,
  Leaf,
  Dumbbell,
  Star,
  StarHalf,
  ArrowRight,
  Loader2,
  ChevronDown,
} from "lucide-react";

// --- Data Models with Popover Options ---
const filterCategories = [
  {
    id: "diet",
    label: "Diet",
    icon: <Utensils className="w-8 h-8" />,
    options: [
      {
        label: "Keto",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&h=200&auto=format&fit=crop",
      },
      {
        label: "Vegan",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&h=200&auto=format&fit=crop",
      },
      {
        label: "Paleo",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&h=200&auto=format&fit=crop",
      },
      {
        label: "Low Carb",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&h=200&auto=format&fit=crop",
      },
      {
        label: "Mediterranean",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&h=200&auto=format&fit=crop",
      },
      {
        label: "Intermittent",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&h=200&auto=format&fit=crop",
      },
    ],
  },
  {
    id: "health-goals",
    label: "Health Goals",
    icon: <Target className="w-8 h-8" />,
    options: [
      {
        label: "Weight Loss",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&h=200&auto=format&fit=crop",
      },
      {
        label: "Muscle Gain",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&h=200&auto=format&fit=crop",
      },
      {
        label: "Better Sleep",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&h=200&auto=format&fit=crop",
      },
      {
        label: "Energy Boost",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&h=200&auto=format&fit=crop",
      },
      {
        label: "Longevity",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&h=200&auto=format&fit=crop",
      },
      {
        label: "Digestion",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&h=200&auto=format&fit=crop",
      },
    ],
  },
  {
    id: "medical",
    label: "Medical Conditions",
    icon: <Stethoscope className="w-8 h-8" />,
    options: [
      {
        label: "Diabetes",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&h=200&auto=format&fit=crop",
      },
      {
        label: "PCOS",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&h=200&auto=format&fit=crop",
      },
      {
        label: "Hypertension",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&h=200&auto=format&fit=crop",
      },
      {
        label: "Thyroid",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&h=200&auto=format&fit=crop",
      },
      {
        label: "Celiac",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&h=200&auto=format&fit=crop",
      },
      {
        label: "IBS/IBD",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&h=200&auto=format&fit=crop",
      },
    ],
  },
  {
    id: "price",
    label: "Price Range",
    icon: <Wallet className="w-8 h-8" />,
    options: [
      {
        label: "Price: Low to High",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&h=200&auto=format&fit=crop",
      },
      {
        label: "Price: High to Low",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&h=200&auto=format&fit=crop",
      },
    ],
  },
];

const featuredPlans = [
  {
    id: "metabolic-reset",
    title: "28-Day Metabolic Reset",
    price: "$49",
    description:
      "A comprehensive protocol designed to optimize insulin sensitivity and support sustainable fat loss.",
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    badge: {
      icon: <BadgeCheck className="w-4 h-4 mr-1.5" />,
      text: "Clinical Grade",
    },
    author: {
      name: "Dr. Sarah Jenkins",
      image: "https://i.pravatar.cc/150?u=sarah",
      rating: 4.5,
      reviews: 124,
    },
  },
  {
    id: "plant-based-vitality",
    title: "Plant-Based Vitality Protocol",
    price: "$35",
    description:
      "Ensure complete nutrient absorption and protein synthesis while following a strict vegan diet.",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    badge: {
      icon: <Leaf className="w-4 h-4 mr-1.5" />,
      text: "Vegetarian",
      bgClass: "bg-accent text-accent-foreground",
    },
    author: {
      name: "Marcus Chen, RD",
      image: "https://i.pravatar.cc/150?u=marcus",
      rating: 5,
      reviews: 89,
    },
  },
  {
    id: "performance-macros",
    title: "Performance Macros Guide",
    price: "$55",
    description:
      "Advanced macronutrient cycling for athletes looking to build lean mass without excess fat gain.",
    image:
      "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80",
    badge: {
      icon: <Dumbbell className="w-4 h-4 mr-1.5" />,
      text: "Muscle Gain",
    },
    author: {
      name: "Elena Rodriguez, CNS",
      image: "https://i.pravatar.cc/150?u=elena",
      rating: 4,
      reviews: 210,
    },
  },
];

// Icon Mapping Helpers
const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case "restaurant":
      return (
        <Utensils className="w-8 h-8 transition-transform duration-300 group-hover:scale-110 group-hover:text-primary" />
      );
    case "track_changes":
      return (
        <Target className="w-8 h-8 transition-transform duration-300 group-hover:scale-110 group-hover:text-primary" />
      );
    case "medical_services":
      return (
        <Stethoscope className="w-8 h-8 transition-transform duration-300 group-hover:scale-110 group-hover:text-primary" />
      );
    case "payments":
      return (
        <Wallet className="w-8 h-8 transition-transform duration-300 group-hover:scale-110 group-hover:text-primary" />
      );
    default:
      return <Target className="w-8 h-8" />;
  }
};

const getBadgeIcon = (iconName: string) => {
  switch (iconName) {
    case "verified":
      return <BadgeCheck className="w-4 h-4 mr-1.5" />;
    case "eco":
      return <Leaf className="w-4 h-4 mr-1.5" />;
    case "fitness_center":
      return <Dumbbell className="w-4 h-4 mr-1.5" />;
    default:
      return <BadgeCheck className="w-4 h-4 mr-1.5" />;
  }
};

export default function ClinicalNutritionPlans() {
  // Enhanced Star Rendering
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(
          <Star
            key={i}
            className="w-3.5 h-3.5 fill-primary text-primary"
          />,
        );
      } else if (i - 0.5 === rating) {
        stars.push(
          <StarHalf
            key={i}
            className="w-3.5 h-3.5 fill-primary text-primary"
          />,
        );
      } else {
        stars.push(<Star key={i} className="w-3.5 h-3.5 text-muted-foreground/40" />);
      }
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  return (
    <div className="bg-background text-foreground font-sans min-h-screen flex flex-col">
      <main className="flex-grow w-full max-w-[1280px] mx-auto px-6 md:px-8 py-12 flex flex-col gap-20 mt-8">
        {/* Improved Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden min-h-[480px] flex items-center shadow-xl group bg-secondary"
        >
          {/* Enhanced Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/50 to-transparent z-10 pointer-events-none"></div>

          <img
            alt="Fresh healthy salad spread placeholder"
            className="absolute inset-0 w-full h-full object-cover z-0 opacity-90 transition-transform duration-700 ease-out group-hover:scale-105"
            src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=2070&q=80"
          />

          <div className="relative z-20 text-left max-w-2xl px-8 md:px-16 py-12">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/20 border border-brand/30 text-brand text-sm font-semibold tracking-wide mb-6 backdrop-blur-md">
                <BadgeCheck className="w-4 h-4" />
                Evidence-Based Protocols
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6 tracking-tight"
            >
              Curated <span className="text-brand">Clinical</span>
              <br />
              Nutrition
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl font-light"
            >
              Discover evidence-based meal plans designed by registered
              dietitians and medical experts to meet your specific health goals.
            </motion.p>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="group flex items-center gap-3 bg-button-primary bg-btn-primary text-button-primary-foreground px-8 py-4 rounded-full font-semibold hover:opacity-90 transition-all duration-300 shadow-brand"
            >
              Explore Plans
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </motion.button>
          </div>
        </motion.section>

        {/* --- Etsy Style Category Circles with Popovers --- */}
        <section className="relative">
          <h2 className="text-2xl font-bold text-foreground mb-10 tracking-tight flex items-center gap-3">
            Browse through filters
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {filterCategories.map((category) => (
              <div
                key={category.id}
                className="relative group/popover flex flex-col items-center"
              >
                {/* Main Trigger Button */}
                <a
                  href="#"
                  className="flex flex-col items-center gap-4 group cursor-pointer"
                >
                  <div className="w-24 h-24 rounded-full bg-card shadow-sm border border-border flex items-center justify-center text-muted-foreground group-hover:bg-accent group-hover:border-brand/30 group-hover:text-brand transition-all duration-300 hover:scale-105 active:scale-95">
                    {category.icon}
                  </div>
                  <span className="font-semibold text-foreground group-hover:text-brand transition-colors">
                    {category.label}
                  </span>
                </a>

                {/* Pop-over Menu */}
                <div className="absolute top-[80%] left-1/2 -translate-x-1/2 pt-8 z-50 opacity-0 invisible group-hover/popover:opacity-100 group-hover/popover:visible transition-all duration-300 w-[500px]">
                  <div className="bg-card rounded-2xl shadow-2xl border border-border p-8 relative">
                    {/* Arrow Decor */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card rotate-45 border-t border-l border-border"></div>

                    <div className="grid grid-cols-3 gap-6">
                      {category.options.map((opt, idx) => (
                        <a
                          key={idx}
                          href="#"
                          className="flex flex-col items-center gap-3 group/item"
                        >
                          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-transparent group-hover/item:border-brand group-hover/item:shadow-lg group-hover/item:shadow-brand/20 transition-all duration-300 bg-muted">
                            <img
                              alt={opt.label}
                              className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500 opacity-90"
                              src={opt.image}
                            />
                          </div>
                          <span className="text-sm font-bold text-foreground group-hover/item:text-brand transition-colors">
                            {opt.label}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Plans Grid */}
        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-foreground tracking-tight">
                Featured Clinical Plans
              </h2>
              <p className="text-muted-foreground mt-2 text-lg">
                Top-rated protocols verified by our medical board.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
              >
                <div className="relative h-60 overflow-hidden bg-muted">
                  <img
                    alt={plan.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    src={plan.image}
                  />
                  <div
                    className={`absolute top-4 left-4 ${plan.badge.bgClass || "bg-card/95 text-foreground"} backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center shadow-sm`}
                  >
                    {plan.badge.icon}
                    {plan.badge.text}
                  </div>
                </div>

                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <h3 className="text-xl font-bold text-foreground line-clamp-2 leading-tight">
                      {plan.title}
                    </h3>
                    <span className="text-lg font-bold text-primary shrink-0">
                      {plan.price}
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-6 line-clamp-2 leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="mt-auto pt-5 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
                        <img
                          alt={plan.author.name}
                          className="w-full h-full object-cover"
                          src={plan.author.image}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {plan.author.name}
                        </p>
                        <div className="flex items-center mt-0.5">
                          {renderStars(plan.author.rating)}
                          <span className="text-xs font-medium ml-2 text-muted-foreground">
                            ({plan.author.reviews})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Styled Load More Button */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex justify-center mt-16"
          >
            <button className="group relative inline-flex items-center justify-center gap-2 px-10 py-3.5 text-base font-semibold text-primary transition-all duration-300 bg-card border-2 border-primary rounded-full hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              <span>Load More Plans</span>
              <Loader2 className="w-5 h-5 transition-transform duration-500 group-hover:rotate-180" />
            </button>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
