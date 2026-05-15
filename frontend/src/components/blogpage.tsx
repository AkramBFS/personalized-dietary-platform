"use client";
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

import Link from "next/link";
import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";

export default function BlogPageComponent() {
  const articles = [
    {
      slug: "optimizing-gut-health-probiotics-prebiotics",
      tag: "Healthcare",
      title: "Optimizing Gut Health: A Guide to Probiotics and Prebiotics",
      desc: "Explore the science behind gut health and how incorporating probiotics and prebiotics into your diet can improve digestion, boost immunity, and enhance overall well-being.",
      imageUrl:
        "https://images.unsplash.com/photo-1494390248081-4e521a5940db?q=80&w=806&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      slug: "tools-effective-agile-teams-healthcare",
      tag: "Webinar",
      title: "Tools for Effective Agile Teams in Healthcare",
      desc: "Discover the latest digital tools that are helping medical practices streamline their operations and deliver better care.",
      imageUrl:
        "https://plus.unsplash.com/premium_photo-1681843126728-04eab730febe?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      slug: "navigating-stress-burnout-clinicians",
      tag: "Mental Health",
      title: "Navigating Stress and Burnout for Clinicians",
      desc: "Strategies and resources for healthcare professionals to maintain their mental well-being in high-pressure environments.",
      imageUrl:
        "https://images.unsplash.com/photo-1554469384-e58fac16e23a?auto=format&fit=crop&q=80&w=600",
    },
    {
      slug: "role-diet-preventative-medicine",
      tag: "Nutrition",
      title: "The Role of Diet in Preventative Medicine",
      desc: "A comprehensive look at how nutritional choices can significantly impact long-term health outcomes and prevent chronic diseases.",
      imageUrl:
        "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=600",
    },
    {
      slug: "redefining-patient-experience-case-study",
      tag: "Patient Stories",
      title: "Redefining the Patient Experience: A Case Study",
      desc: "How one clinic overhauled its approach to patient care, resulting in higher satisfaction rates and better clinical results.",
      imageUrl:
        "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600",
    },
    {
      slug: "advancements-telehealth-technologies",
      tag: "Medical Care",
      title: "Advancements in Telehealth Technologies",
      desc: "Exploring the latest software and hardware solutions making remote patient monitoring more effective than ever.",
      imageUrl:
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600",
    },
  ];

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Articles");
  const debouncedSearch = useDebounce(search, 300);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // Search Logic
      const matchesSearch =
        article.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        article.desc.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        article.tag.toLowerCase().includes(debouncedSearch.toLowerCase());

      // Category Logic (mapping "Preventative Care" to include Healthcare/Medical Care to ensure results show)
      const matchesCategory =
        selectedCategory === "All Articles" ||
        article.tag === selectedCategory ||
        (selectedCategory === "Preventative Care" &&
          (article.tag === "Healthcare" || article.tag === "Medical Care"));

      return matchesSearch && matchesCategory;
    });
  }, [debouncedSearch, selectedCategory, articles]);

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
            <button
              onClick={() => setSelectedCategory("All Articles")}
              className={`w-full text-left pl-4 py-2 transition-all ease-in-out duration-200 flex items-center gap-3 ${
                selectedCategory === "All Articles"
                  ? "text-primary font-semibold border-l-4 border-primary hover:opacity-80"
                  : "text-muted-foreground border-l-4 border-transparent hover:border-border hover:text-primary"
              }`}
            >
              <List className="w-5 h-5" />
              <span className="text-sm font-semibold">All Articles</span>
            </button>
            <button
              onClick={() => setSelectedCategory("Preventative Care")}
              className={`w-full text-left pl-4 py-2 transition-all ease-in-out duration-200 flex items-center gap-3 ${
                selectedCategory === "Preventative Care"
                  ? "text-primary font-semibold border-l-4 border-primary hover:opacity-80"
                  : "text-muted-foreground border-l-4 border-transparent hover:border-border hover:text-primary"
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-semibold">Preventative Care</span>
            </button>
            <button
              onClick={() => setSelectedCategory("Mental Health")}
              className={`w-full text-left pl-4 py-2 transition-all ease-in-out duration-200 flex items-center gap-3 ${
                selectedCategory === "Mental Health"
                  ? "text-primary font-semibold border-l-4 border-primary hover:opacity-80"
                  : "text-muted-foreground border-l-4 border-transparent hover:border-border hover:text-primary"
              }`}
            >
              <Brain className="w-5 h-5" />
              <span className="text-sm font-semibold">Mental Health</span>
            </button>
            <button
              onClick={() => setSelectedCategory("Nutrition")}
              className={`w-full text-left pl-4 py-2 transition-all ease-in-out duration-200 flex items-center gap-3 ${
                selectedCategory === "Nutrition"
                  ? "text-primary font-semibold border-l-4 border-primary hover:opacity-80"
                  : "text-muted-foreground border-l-4 border-transparent hover:border-border hover:text-primary"
              }`}
            >
              <Utensils className="w-5 h-5" />
              <span className="text-sm font-semibold">Nutrition</span>
            </button>
            <button
              onClick={() => setSelectedCategory("Patient Stories")}
              className={`w-full text-left pl-4 py-2 transition-all ease-in-out duration-200 flex items-center gap-3 ${
                selectedCategory === "Patient Stories"
                  ? "text-primary font-semibold border-l-4 border-primary hover:opacity-80"
                  : "text-muted-foreground border-l-4 border-transparent hover:border-border hover:text-primary"
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-sm font-semibold">Patient Stories</span>
            </button>
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filteredArticles.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No articles found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article, idx) => (
              <article
                key={idx}
                className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm flex flex-col transition-transform hover:-translate-y-1 hover:shadow-md duration-300"
              >
                <div className="h-48 w-full bg-muted relative">
                  <img
                    alt={article.title}
                    className="w-full h-full object-cover"
                    src={article.imageUrl}
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
                  <Link
                    href={`/blog/${article.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary/80 hover:text-primary transition-colors mt-4 group"
                  >
                    Read more{" "}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {filteredArticles.length > 0 && (
          <div className="flex justify-center mt-8">
            <button className="bg-card border border-border text-foreground text-sm font-semibold py-3 px-10 rounded-full hover:bg-muted transition-colors shadow-sm">
              Load More Articles
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
