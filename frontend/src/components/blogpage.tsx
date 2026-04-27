import {
  List,
  ShieldCheck,
  Brain,
  Utensils,
  Users,
  Download,
  Video,
  Calendar,
  Search,
  ArrowRight,
} from "lucide-react";

export default function BlogPageComponent() {
  const articles = [
    {
      tag: "Healthcare",
      title: "Effective Retrospectives in the Age of Coronavirus",
      desc: "Learn how modern healthcare teams are adapting their communication strategies to improve patient outcomes during challenging times.",
    },
    {
      tag: "Webinar",
      title: "Tools for Effective Agile Teams in Healthcare",
      desc: "Discover the latest digital tools that are helping medical practices streamline their operations and deliver better care.",
    },
    {
      tag: "Mental Health",
      title: "Navigating Stress and Burnout for Clinicians",
      desc: "Strategies and resources for healthcare professionals to maintain their mental well-being in high-pressure environments.",
    },
    {
      tag: "Nutrition",
      title: "The Role of Diet in Preventative Medicine",
      desc: "A comprehensive look at how nutritional choices can significantly impact long-term health outcomes and prevent chronic diseases.",
    },
    {
      tag: "Patient Stories",
      title: "Redefining the Patient Experience: A Case Study",
      desc: "How one clinic overhauled its approach to patient care, resulting in higher satisfaction rates and better clinical results.",
    },
    {
      tag: "Medical Care",
      title: "Advancements in Telehealth Technologies",
      desc: "Exploring the latest software and hardware solutions making remote patient monitoring more effective than ever.",
    },
  ];

  return (
    <main className="flex-grow max-w-7xl mx-auto w-full px-8 py-16 grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
      {/* Left Sidebar */}
      <aside className="md:col-span-3 sticky top-28">
        <div className="bg-transparent tracking-tight rounded-lg flex flex-col gap-6 py-6">
          <div>
            <h2 className="text-2xl font-semibold text-primary mb-1">
              Categories
            </h2>
            <p className="text-base text-muted-foreground mb-6">
              Filter by Topic
            </p>
          </div>

          <nav className="flex flex-col gap-2">
            <a
              href="#"
              className="text-primary font-semibold border-l-4 border-primary pl-4 py-2 hover:opacity-80 transition-all ease-in-out duration-200 flex items-center gap-3"
            >
              <List className="w-5 h-5" />
              <span className="text-sm font-semibold">All Articles</span>
            </a>
            <a
              href="#"
              className="text-muted-foreground pl-4 py-2 hover:text-primary transition-all ease-in-out duration-200 flex items-center gap-3 border-l-4 border-transparent hover:border-border"
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-semibold">Preventative Care</span>
            </a>
            <a
              href="#"
              className="text-muted-foreground pl-4 py-2 hover:text-primary transition-all ease-in-out duration-200 flex items-center gap-3 border-l-4 border-transparent hover:border-border"
            >
              <Brain className="w-5 h-5" />
              <span className="text-sm font-semibold">Mental Health</span>
            </a>
            <a
              href="#"
              className="text-muted-foreground pl-4 py-2 hover:text-primary transition-all ease-in-out duration-200 flex items-center gap-3 border-l-4 border-transparent hover:border-border"
            >
              <Utensils className="w-5 h-5" />
              <span className="text-sm font-semibold">Nutrition</span>
            </a>
            <a
              href="#"
              className="text-muted-foreground pl-4 py-2 hover:text-primary transition-all ease-in-out duration-200 flex items-center gap-3 border-l-4 border-transparent hover:border-border"
            >
              <Users className="w-5 h-5" />
              <span className="text-sm font-semibold">Patient Stories</span>
            </a>
          </nav>

          <div className="mt-8 pt-8 border-t border-border">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Resources
            </h3>
            <ul className="flex flex-col gap-3 text-base text-muted-foreground">
              <li>
                <a
                  href="#"
                  className="hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Downloadable Guides
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Video className="w-4 h-4" /> Video Library
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" /> Upcoming Webinars
                </a>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <button className="w-full bg-muted border border-primary/20 text-primary text-sm font-semibold py-3 px-6 rounded-xl hover:bg-muted/80 transition-colors text-center">
              Subscribe to Newsletter
            </button>
          </div>
        </div>
      </aside>

      {/* Right Column (Content Grid) */}
      <section className="md:col-span-9 flex flex-col gap-8">
        {/* Mobile/Secondary Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            className="w-full pl-12 pr-4 py-3 bg-card border border-input rounded-xl text-base text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm placeholder:text-muted-foreground"
            placeholder="Search articles, topics..."
            type="text"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article, idx) => (
            <article
              key={idx}
              className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm flex flex-col transition-transform hover:-translate-y-1 hover:shadow-md duration-300"
            >
              <div className="h-48 w-full bg-muted relative">
                <img
                  alt={article.title}
                  className="w-full h-full object-cover"
                  src={`https://placehold.co/600x400/png?text=${encodeURIComponent(article.tag)}`}
                />
              </div>
              <div className="p-6 flex flex-col flex-grow gap-4">
                <span className="inline-block bg-muted text-primary text-xs font-bold px-3 py-1 rounded-full w-max border border-primary/10 tracking-wide uppercase">
                  {article.tag}
                </span>
                <h3 className="text-xl font-semibold text-foreground line-clamp-3 leading-tight">
                  {article.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-auto leading-relaxed">
                  {article.desc}
                </p>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary/80 hover:text-primary transition-colors mt-4 group"
                >
                  Read more{" "}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </article>
          ))}
        </div>

        <div className="flex justify-center mt-8">
          <button className="bg-card border border-border text-foreground text-sm font-semibold py-3 px-10 rounded-full hover:bg-muted transition-colors shadow-sm">
            Load More Articles
          </button>
        </div>
      </section>
    </main>
  );
}
