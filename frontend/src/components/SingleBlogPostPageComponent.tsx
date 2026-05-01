import {
  CalendarDays,
  UserCircle,
  Clock3,
  MessageSquare,
  Facebook,
  Twitter,
  Linkedin,
} from "lucide-react";
const articleData = {
  title:
    "Optimizing Gut Health: The Nutritionist's Guide to a Balanced Microbiome",
  category: "Nutrition & Wellness",
  publishDate: "October 26, 2023",
  author: {
    name: "Dr. Sarah Johnson, RD",
    title: "Registered Dietitian & Gut Health Specialist",
    bio: "Dr. Sarah Johnson is a leading expert in functional nutrition, specializing in gastrointestinal health and the gut microbiome. She has dedicated over 15 years to helping clients achieve optimal wellness through evidence-based dietary interventions. Sarah is passionate about empowering people to understand the powerful connection between food, digestion, and overall health.",
    avatar:
      "https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", // Placeholder headshot
  },
  readTime: "7 min read",
  commentsCount: 12,
  featureImage:
    "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", // Placeholder healthy food image
  contentParagraphs: [
    "The gut microbiome, a complex ecosystem of trillions of bacteria residing in our digestive tract, is increasingly recognized as a cornerstone of overall health. Research continues to unveil its profound influence on everything from digestion and immune function to mental health and chronic disease risk. As a nutritionist specializing in this area, I’ve seen firsthand the transformative impact that focusing on gut health can have on a person's well-being.",
    "A healthy gut is characterized by a diverse and balanced population of beneficial bacteria. However, factors like a poor diet (high in processed foods and sugar), chronic stress, lack of sleep, and overused antibiotics can disrupt this delicate balance, leading to a state called dysbiosis. This imbalance is linked to various health issues, including digestive distress (bloating, gas, IBD), skin problems, systemic inflammation, and even mood disorders.",
    "So, how can we nurture our gut microbiome? It starts with the food we eat. Incorporating a variety of fiber-rich plant foods—such as vegetables, fruits, whole grains, legumes, nuts, and seeds—is crucial. Fiber acts as 'prebiotics,' providing fuel for the beneficial bacteria to thrive. In addition to fiber, consuming 'probiotic' foods, which contain live beneficial bacteria, can help replenish the microbiome. Think fermented foods like yogurt, kefir, sauerkraut, kimchi, and miso.",
    "Beyond diet, other lifestyle factors play a vital role. Managing stress through practices like meditation or yoga, prioritizing 7-9 hours of quality sleep per night, and regular physical activity all contribute to a healthier gut environment. Remember, optimizing gut health is not a quick fix; it's a journey involving consistent dietary and lifestyle choices.",
    "In conclusion, supporting your gut microbiome is one of the most impactful things you can do for your long-term health. By understanding the connection between what you eat and the health of your 'inner garden,' you can empower yourself to make choices that cultivate vitality from the inside out. Consult with a qualified health professional or a registered dietitian to develop a personalized plan tailored to your unique gut health needs.",
  ],
};

const relatedPosts = [
  {
    title: "5 Simple Ways to Boost Your Immune System Naturally",
    image: "https://placehold.co/100x100?text=Immunity",
  },
  {
    title: "Understanding Food Intolerances vs. Allergies",
    image: "https://placehold.co/100x100?text=Food+Info",
  },
  {
    title: "Meal Prep Made Easy: Healthy Recipes for Busy Weeks",
    image: "https://placehold.co/100x100?text=Meal+Prep",
  },
];

export default function SingleBlogPostPageComponent() {
  return (
    <main className="max-w-7xl mx-auto w-full px-4 md:px-8 py-12 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
      {/* Left Column (Main Article Content - Scrollable) */}
      <section className="md:col-span-8 flex flex-col gap-8 mt-1">
        {/* Feature Image */}
        <div className="w-full h-auto overflow-hidden rounded-2xl shadow-lg">
          <img
            src={articleData.featureImage}
            alt="Healthy food feature for blog post"
            className="w-full h-[400px] object-cover"
          />
        </div>

        {/* Category Tag */}
        <span className="inline-block bg-muted text-primary text-sm font-bold px-4 py-1.5 rounded-full w-max border border-primary/10 tracking-wide uppercase">
          {articleData.category}
        </span>

        {/* Article Title */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight tracking-tight">
          {articleData.title}
        </h1>

        {/* Metadata Row */}
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground border-y border-border py-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            <span>{articleData.publishDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserCircle className="w-4 h-4" />
            <span>By {articleData.author.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock3 className="w-4 h-4" />
            <span>{articleData.readTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>{articleData.commentsCount} Comments</span>
          </div>
        </div>

        {/* Article Content (Full text renders here) */}
        <div className="prose prose-base md:prose-lg max-w-none text-muted-foreground leading-relaxed flex flex-col gap-6">
          {articleData.contentParagraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </section>

      {/* Right Column (Sticky Sidebar) */}
      <aside className="md:col-span-4 sticky top-2 flex flex-col gap-10">
        {/* Nutritionist Profile ("About Me" adaptation) */}
        <div className="bg-card p-8 rounded-2xl border border-border shadow-sm flex flex-col gap-6">
          <h2 className="text-xl font-bold text-foreground border-b border-border pb-3">
            MEET THE NUTRITIONIST
          </h2>

          <div className="flex flex-col items-center text-center gap-4">
            <img
              src={articleData.author.avatar}
              alt="Dr. Sarah Johnson, Registered Dietitian"
              className="w-28 h-28 rounded-full object-cover border-4 border-muted"
            />
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {articleData.author.name}
              </h3>
              <p className="text-sm text-primary font-medium">
                {articleData.author.title}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {articleData.author.bio}
          </p>

          <button className="w-full bg-muted text-primary text-sm font-semibold py-3 px-6 rounded-xl hover:bg-muted/80 transition-colors">
            Book a Consultation
          </button>
        </div>

        {/* Follow Me Section */}
        <div className="flex flex-col gap-6 p-2">
          <h2 className="text-xl font-bold text-foreground border-b border-border pb-3">
            FOLLOW FOR MORE TIPS
          </h2>
          <div className="flex gap-4">
            {[
              { icon: Facebook, label: "Facebook" },
              { icon: Twitter, label: "Twitter" },
              { icon: Linkedin, label: "LinkedIn" },
            ].map((social) => (
              <a
                key={social.label}
                href="#"
                aria-label={`Follow us on ${social.label}`}
                className="p-3 bg-muted rounded-full text-primary hover:bg-primary hover:text-white transition-colors"
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Read More Section (Recent Posts adaptation) */}
        <div className="flex flex-col gap-6 p-2">
          <h2 className="text-xl font-bold text-foreground border-b border-border pb-3">
            RECENT ARTICLES
          </h2>
          <div className="flex flex-col gap-5">
            {relatedPosts.map((post, index) => (
              <a href="#" key={index} className="flex items-center gap-4 group">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <h4 className="text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h4>
              </a>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}
