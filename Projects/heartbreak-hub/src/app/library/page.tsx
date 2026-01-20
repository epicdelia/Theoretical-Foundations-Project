"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/hooks/use-user";
import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import type {
  ContentLibrary,
  Bookmark,
  UserProfile,
} from "@/lib/supabase/types";
import {
  BookOpen,
  Dumbbell,
  Video,
  Headphones,
  Search,
  Bookmark as BookmarkIcon,
  BookmarkCheck,
  Lock,
  Sparkles,
  LogOut,
  Loader2,
  NotebookPen,
  Trophy,
  Library,
  Clock,
  Star,
} from "lucide-react";
import Link from "next/link";

type Category = "all" | "Articles" | "Exercises" | "Videos" | "Audio";
type ViewMode = "all" | "bookmarks";

const CATEGORIES: { value: Category; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "All", icon: <Library className="h-4 w-4" /> },
  { value: "Articles", label: "Articles", icon: <BookOpen className="h-4 w-4" /> },
  { value: "Exercises", label: "Exercises", icon: <Dumbbell className="h-4 w-4" /> },
  { value: "Videos", label: "Videos", icon: <Video className="h-4 w-4" /> },
  { value: "Audio", label: "Audio", icon: <Headphones className="h-4 w-4" /> },
];

const TAGS = [
  "self-care",
  "boundaries",
  "grief",
  "growth",
  "mindfulness",
  "communication",
  "healing",
  "relationships",
];

const getCategoryIcon = (category: string | null) => {
  switch (category) {
    case "Articles":
      return <BookOpen className="h-5 w-5" />;
    case "Exercises":
      return <Dumbbell className="h-5 w-5" />;
    case "Videos":
      return <Video className="h-5 w-5" />;
    case "Audio":
      return <Headphones className="h-5 w-5" />;
    default:
      return <BookOpen className="h-5 w-5" />;
  }
};

const getEstimatedTime = (category: string | null) => {
  switch (category) {
    case "Articles":
      return "5 min read";
    case "Exercises":
      return "10 min";
    case "Videos":
      return "8 min watch";
    case "Audio":
      return "12 min listen";
    default:
      return "5 min";
  }
};

export default function LibraryPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useMemo(() => createClient() as any, []);

  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState<ContentLibrary[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [bookmarkingId, setBookmarkingId] = useState<string | null>(null);

  useEffect(() => {
    if (isUserLoading) return;

    const fetchData = async () => {
      setIsLoading(true);

      // Fetch all content
      const { data: contentData } = await supabase
        .from("content_library")
        .select("*")
        .order("created_at", { ascending: false });

      setContent(contentData || []);

      // Fetch user profile and bookmarks if logged in
      if (user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        setUserProfile(profile);

        const { data: bookmarksData } = await supabase
          .from("bookmarks")
          .select("*")
          .eq("user_id", user.id);

        setBookmarks(bookmarksData || []);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [isUserLoading, user, supabase]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const handleBookmark = async (contentId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }

    setBookmarkingId(contentId);

    const existingBookmark = bookmarks.find((b) => b.content_id === contentId);

    if (existingBookmark) {
      // Remove bookmark
      await supabase.from("bookmarks").delete().eq("id", existingBookmark.id);
      setBookmarks(bookmarks.filter((b) => b.id !== existingBookmark.id));
    } else {
      // Add bookmark
      const { data: newBookmark } = await supabase
        .from("bookmarks")
        .insert({
          user_id: user.id,
          content_id: contentId,
        })
        .select()
        .single();

      if (newBookmark) {
        setBookmarks([...bookmarks, newBookmark]);
      }
    }

    setBookmarkingId(null);
  };

  const isBookmarked = (contentId: string) => {
    return bookmarks.some((b) => b.content_id === contentId);
  };

  // Filter content based on search, category, tag, and view mode
  const filteredContent = useMemo(() => {
    let filtered = content;

    // Filter by view mode (bookmarks)
    if (viewMode === "bookmarks") {
      const bookmarkedIds = bookmarks.map((b) => b.content_id);
      filtered = filtered.filter((c) => bookmarkedIds.includes(c.id));
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((c) => c.category === selectedCategory);
    }

    // Filter by tag
    if (selectedTag !== "all") {
      filtered = filtered.filter((c) => c.tags?.includes(selectedTag));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [content, selectedCategory, selectedTag, searchQuery, viewMode, bookmarks]);

  // Get recommended content based on user's pathway
  const recommendedContent = useMemo(() => {
    if (!userProfile?.pathway_id) return [];
    return content
      .filter((c) => c.pathway_id === userProfile.pathway_id)
      .slice(0, 3);
  }, [content, userProfile]);

  if (isUserLoading || isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center py-12 bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-muted-foreground">Loading content library...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <span className="font-semibold text-purple-700">HeartBreak Hub</span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/journal">
                    <NotebookPen className="h-4 w-4 mr-2" />
                    Journal
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/milestones">
                    <Trophy className="h-4 w-4 mr-2" />
                    Milestones
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-700 flex items-center gap-2">
            <Library className="h-8 w-8" />
            Content Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Explore healing resources, exercises, and media
          </p>
        </div>

        {/* Recommended Section (for logged-in users with a pathway) */}
        {user && recommendedContent.length > 0 && viewMode === "all" && (
          <Card className="mb-8 border-teal-200 bg-teal-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-teal-700">
                <Star className="h-5 w-5" />
                Recommended for You
              </CardTitle>
              <CardDescription>
                Based on your healing pathway
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recommendedContent.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg p-4 border border-teal-100 hover:border-teal-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-teal-600 mb-2">
                      {getCategoryIcon(item.category)}
                      <span className="text-xs font-medium uppercase">
                        {item.category}
                      </span>
                    </div>
                    <h4 className="font-medium text-foreground line-clamp-2">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {getEstimatedTime(item.category)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters Section */}
        <div className="mb-6 space-y-4">
          {/* Search and Tag Filter Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {TAGS.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Tabs and Bookmarks Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.value)}
                  className="flex items-center gap-2"
                >
                  {cat.icon}
                  {cat.label}
                </Button>
              ))}
            </div>
            {user && (
              <Button
                variant={viewMode === "bookmarks" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setViewMode(viewMode === "bookmarks" ? "all" : "bookmarks")
                }
                className="flex items-center gap-2"
              >
                <BookmarkCheck className="h-4 w-4" />
                {viewMode === "bookmarks" ? "Show All" : "My Bookmarks"}
              </Button>
            )}
          </div>
        </div>

        {/* Content Grid */}
        {filteredContent.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <Library className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">No content found</h3>
                <p className="text-muted-foreground mt-1">
                  {viewMode === "bookmarks"
                    ? "You haven't bookmarked any content yet."
                    : "Try adjusting your filters or search query."}
                </p>
              </div>
              {viewMode === "bookmarks" && (
                <Button variant="outline" onClick={() => setViewMode("all")}>
                  Browse All Content
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContent.map((item) => (
              <Card
                key={item.id}
                className="flex flex-col hover:border-purple-300 transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-purple-600">
                      {getCategoryIcon(item.category)}
                      <span className="text-xs font-medium uppercase">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.is_premium && !user && (
                        <div className="p-1 rounded-full bg-amber-100">
                          <Lock className="h-4 w-4 text-amber-600" />
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleBookmark(item.id)}
                        disabled={bookmarkingId === item.id}
                      >
                        {bookmarkingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isBookmarked(item.id) ? (
                          <BookmarkCheck className="h-4 w-4 text-purple-600" />
                        ) : (
                          <BookmarkIcon className="h-4 w-4 text-muted-foreground hover:text-purple-600" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-base line-clamp-2 mt-2">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription className="line-clamp-3">
                    {item.description || "No description available."}
                  </CardDescription>
                </CardContent>
                <CardFooter className="pt-0 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {getEstimatedTime(item.category)}
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardFooter>
                {item.is_premium && !user && (
                  <div className="px-6 pb-4">
                    <div className="text-xs text-amber-600 bg-amber-50 rounded-md p-2 text-center">
                      Sign in to access member-only content
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
