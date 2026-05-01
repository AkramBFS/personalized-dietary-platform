import {
  Users,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Share2,
  Calendar,
  Clock,
  Flame,
  Shuffle,
} from "lucide-react";

export default function CommunityComponent() {
  const posts = [
    {
      id: 1,
      votes: "1.2k",
      author: "u/WellnessSeeker",
      time: "2 hours ago",
      tag: "Nutrition",
      title:
        "Does anyone else find intermittent fasting helps with mental clarity?",
      content:
        "I've been trying a 16:8 schedule for the past few weeks. Initially, I just wanted to see if it would help with some digestive issues, but I've noticed a significant reduction in brain fog during the fasting windows. Has anyone else experienced this?",
      comments: 84,
    },
    {
      id: 2,
      votes: "856",
      author: "u/MindfulMover",
      time: "5 hours ago",
      tag: "Mental Health",
      title: "The power of 10-minute walks",
      content:
        "We often think we need an hour of intense exercise to be 'healthy', but simply taking three 10-minute walks a day has completely transformed my stress levels. It's about consistency, not intensity.",
      comments: 142,
    },
  ];

  const contributors = [
    {
      name: "u/JaneDoeHealth",
      rep: "15k rep",
      avatar: "https://placehold.co/100x100/png?text=JD",
    },
    {
      name: "u/MindfulDoc",
      rep: "12k rep",
      avatar: "https://placehold.co/100x100/png?text=MD",
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 flex flex-col lg:flex-row gap-8 w-full items-start">
      {/* Left Sidebar - Navigation & Filters */}
      <aside className="w-full lg:w-64 hidden lg:flex flex-col gap-4 shrink-0 mt-8">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col gap-1">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3 pt-2">
            Sort By
          </h3>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-colors">
            <Clock className="w-5 h-5" />
            Most Recent
          </button>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground font-semibold transition-colors">
            <Flame className="w-5 h-5" />
            Most Liked
          </button>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground font-semibold transition-colors">
            <Shuffle className="w-5 h-5" />
            Random
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 w-full mt-8">
        {/* Community Header */}
        <div className="bg-card rounded-xl border border-border p-8 mb-8 flex items-start justify-between relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-2 bg-secondary"></div>
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              General Wellness Discussion
            </h2>
            <p className="text-muted-foreground font-medium text-sm flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              124.5k Members
            </p>
          </div>
          <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
            Join
          </button>
        </div>

        {/* Posts Feed */}
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-card rounded-xl border border-border p-6 flex gap-6 hover:shadow-md transition-shadow duration-300"
            >
              {/* Voting */}
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <button className="hover:text-primary transition-colors">
                  <ChevronUp className="w-6 h-6" />
                </button>
                <span className="font-bold text-sm text-foreground">
                  {post.votes}
                </span>
                <button className="hover:text-destructive transition-colors">
                  <ChevronDown className="w-6 h-6" />
                </button>
              </div>

              {/* Post Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground text-xs font-medium">
                  <span className="font-bold text-foreground">
                    {post.author}
                  </span>
                  <span>•</span>
                  <span>{post.time}</span>
                  <span className="bg-muted px-2 py-1 rounded text-primary font-bold tracking-wide uppercase">
                    {post.tag}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 leading-snug">
                  {post.title}
                </h3>
                <p className="text-base text-muted-foreground mb-4 leading-relaxed">
                  {post.content}
                </p>

                {/* Footer Actions */}
                <div className="flex items-center gap-6 text-muted-foreground">
                  <button className="flex items-center gap-2 hover:text-primary transition-colors text-sm font-semibold">
                    <MessageSquare className="w-[18px] h-[18px]" />
                    {post.comments} Comments
                  </button>
                  <button className="flex items-center gap-2 hover:text-primary transition-colors text-sm font-semibold">
                    <Share2 className="w-[18px] h-[18px]" />
                    Share
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Right Sidebar - Community Info */}
      <aside className="mt-8 w-full lg:w-80 hidden lg:flex flex-col gap-6 shrink-0">
        {/* About Community */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">
            About Community
          </h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            A supportive space for discussing general wellness, sharing
            evidence-based practices, and supporting each other on the journey
            to better health. We focus on holistic well-being, including
            physical, mental, and emotional health.
          </p>
          <div className="flex flex-col gap-2 text-xs font-semibold text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Created Jan 2021
            </div>
          </div>
        </div>

        {/* Rules */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">
            Community Rules
          </h3>
          <ol className="list-decimal pl-4 text-sm text-muted-foreground space-y-3 leading-relaxed">
            <li>Be respectful and supportive.</li>
            <li>No medical advice - consult a professional.</li>
            <li>Keep discussions evidence-based where possible.</li>
            <li>No self-promotion or spam.</li>
          </ol>
        </div>

        {/* Top Contributors */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">
            Top Contributors
          </h3>
          <ul className="space-y-4">
            {contributors.map((user, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <img
                  alt={`${user.name} avatar`}
                  className="w-10 h-10 rounded-full bg-muted border border-border"
                  src={user.avatar}
                />
                <div>
                  <div className="text-sm font-bold text-foreground">
                    {user.name}
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    {user.rep}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </main>
  );
}
