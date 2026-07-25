import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Loader2, UserX, ArrowLeft, UserPlus, UserMinus, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFollows } from "@/hooks/useFollows";
import DashboardProfile from "./DashboardProfile";
import { ProfileShell } from "@/components/profile/ProfileShell";
import { useToast } from "@/hooks/use-toast";
import { HeroAmbientBackdrop } from "@/components/landing/HeroAmbientBackdrop";
import { ContestRatingGraph } from "@/components/contests/ContestRatingGraph";




interface PublicProfileData {
  username: string; user_id: string; full_name: string; avatar_url: string | null;
  bio: string | null; location: string | null; occupation: string | null;
  website: string | null;
  college: string | null; branch: string | null; study_year: string | null;
  skills: string[]; interests: string[]; goals: string[]; aspirations: string[];
  subjects: { label: string; percent: number }[];
  twitter_url: string | null; linkedin_url: string | null; github_url: string | null;
  instagram_url: string | null;
  leetcode_url: string | null; hackerrank_url: string | null; codeforces_url: string | null;
  codechef_url: string | null; geeksforgeeks_url: string | null;
  resume_url: string | null;
}

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isFollowing, followUser, unfollowUser } = useFollows();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [counts, setCounts] = useState<{ followers: number; following: number }>({ followers: 0, following: 0 });


  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) { setNotFound(true); setIsLoading(false); return; }
      try {
        const { data: ext } = await supabase
          .from("public_user_profiles" as any)
          .select("*")
          .eq("username", username)
          .maybeSingle() as { data: any };
        if (!ext) { setNotFound(true); setIsLoading(false); return; }

        const { data: basic } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", ext.user_id)
          .maybeSingle();
        if (!basic) { setNotFound(true); setIsLoading(false); return; }

        setProfile({
          username: ext.username || username,
          user_id: ext.user_id,
          full_name: basic.full_name || "Anonymous",
          avatar_url: basic.avatar_url,
          bio: ext.bio, location: ext.location, occupation: ext.occupation,
          website: ext.website ?? null,
          college: ext.college_name ?? null,
          branch: ext.branch ?? null,
          study_year: ext.study_year ?? null,
          skills: ext.skills ?? [],
          interests: ext.interests ?? [],
          goals: ext.goals ?? [],
          aspirations: ext.aspirations ?? [],
          subjects: ext.profile_subjects ?? [],
          twitter_url: ext.twitter_url, linkedin_url: ext.linkedin_url, github_url: ext.github_url,
          instagram_url: ext.instagram_url ?? null,
          leetcode_url: ext.leetcode_url, hackerrank_url: ext.hackerrank_url,
          codeforces_url: ext.codeforces_url, codechef_url: ext.codechef_url,
          geeksforgeeks_url: ext.geeksforgeeks_url,
          resume_url: ext.resume_url ?? null,
        });

        // fetch follow counts in parallel
        const [{ count: followers }, { count: following }] = await Promise.all([
          supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("following_id", ext.user_id),
          supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("follower_id", ext.user_id),
        ]);
        setCounts({ followers: followers ?? 0, following: following ?? 0 });
      } catch (e) {
        console.error(e); setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  const handleFollow = async () => {
    if (!profile?.user_id) return;
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to follow users." });
      navigate(`/login?redirect=/u/${profile.username}`);
      return;
    }
    setIsFollowLoading(true);
    try {
      const wasFollowing = isFollowing(profile.user_id);
      if (wasFollowing) await unfollowUser(profile.user_id);
      else await followUser(profile.user_id);
      setCounts((c) => ({ ...c, followers: c.followers + (wasFollowing ? -1 : 1) }));
    } finally { setIsFollowLoading(false); }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/u/${profile?.username}`;
    const shareData = { title: `${profile?.full_name} on Parikshaa`, text: `Check out @${profile?.username} on Parikshaa`, url };
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share(shareData);
        return;
      }
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied to clipboard" });
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied to clipboard" });
      } catch {
        toast({ title: "Share", description: url });
      }
    }
  };


  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (notFound || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <UserX className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">The user @{username} doesn't exist or hasn't set up their public profile yet.</p>
          <Link to="/"><Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" />Go Home</Button></Link>
        </motion.div>
      </div>
    );
  }

  // Owner: show full editable private view
  if (user?.id === profile.user_id) return <DashboardProfile />;

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const profileUrl = `${siteUrl}/u/${profile.username}`;
  const profileTitle = `${profile.full_name} (@${profile.username}) | Parikshaa`;
  const profileDescription = profile.bio
    ? profile.bio.slice(0, 155) + (profile.bio.length > 155 ? "…" : "")
    : `Check out ${profile.full_name}'s profile on Parikshaa.`;

  const following = isFollowing(profile.user_id);
  const actions = (
    <>
      <button
        type="button"
        onClick={handleFollow}
        disabled={isFollowLoading}
        className={
          following
            ? "w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg border border-white/[0.08] bg-white/[0.02] text-foreground/80 px-3 py-2 hover:bg-white/[0.05] hover:text-foreground hover:border-white/15 transition-all disabled:opacity-60"
            : "w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg border border-amber-400/40 bg-gradient-to-b from-amber-500/15 to-orange-500/10 text-amber-100 px-3 py-2 hover:from-amber-500/25 hover:to-orange-500/20 hover:border-amber-400/70 hover:text-amber-50 transition-all disabled:opacity-60"
        }
      >
        {isFollowLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
          following ? <UserMinus className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
        {following ? "Unfollow" : user ? "Follow" : "Sign in to Follow"}
      </button>
      <button
        type="button"
        onClick={handleShare}
        className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg border border-white/[0.08] bg-white/[0.02] text-foreground/80 px-3 py-2 hover:bg-white/[0.05] hover:text-foreground hover:border-white/15 transition-all"
      >
        <Share2 className="h-3.5 w-3.5" /> Share Profile
      </button>
    </>
  );

  const identity = {
    fullName: profile.full_name,
    username: `@${profile.username}`,
    avatarUrl: profile.avatar_url,
    bio: profile.bio,
    occupation: profile.occupation,
    website: profile.website,
    college: profile.college,
    branch: profile.branch,
    studyYear: profile.study_year,
    location: profile.location,
    github: profile.github_url,
    linkedin: profile.linkedin_url,
    twitter: profile.twitter_url,
    instagram: profile.instagram_url,
    leetcode: profile.leetcode_url,
    codeforces: profile.codeforces_url,
    codechef: profile.codechef_url,
    hackerrank: profile.hackerrank_url,
    geeksforgeeks: profile.geeksforgeeks_url,
    resume: profile.resume_url,
    interests: profile.interests,
    goals: profile.goals,
    aspirations: profile.aspirations,
    followers: counts.followers,
    following: counts.following,
  };


  // Only fetch LeetCode data when the user has explicitly linked their LeetCode handle.
  // (Avoid using the Parikshaa username as a fallback — it can collide with an unrelated LC account.)
  const leetcodeFetchHandle = profile.leetcode_url || null;
  const handles = {
    leetcode: profile.leetcode_url,
    codeforces: profile.codeforces_url,
    codechef: profile.codechef_url,
    hackerrank: profile.hackerrank_url,
    geeksforgeeks: profile.geeksforgeeks_url,
    github: profile.github_url,
  };

  return (
    <>
      <Helmet>
        <title>{profileTitle}</title>
        <meta name="description" content={profileDescription} />
        <link rel="canonical" href={profileUrl} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={profileUrl} />
        <meta property="og:title" content={profileTitle} />
        <meta property="og:description" content={profileDescription} />
        {profile.avatar_url && <meta property="og:image" content={profile.avatar_url} />}
        <meta property="profile:username" content={profile.username} />
        <meta name="twitter:card" content="summary" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org", "@type": "Person",
            name: profile.full_name, url: profileUrl,
            image: profile.avatar_url || undefined,
            description: profile.bio || undefined,
            jobTitle: profile.occupation || undefined,
            sameAs: [
              profile.twitter_url, profile.linkedin_url, profile.github_url,
              profile.leetcode_url, profile.hackerrank_url, profile.codeforces_url,
              profile.codechef_url, profile.geeksforgeeks_url,
            ].filter(Boolean),
            knowsAbout: profile.skills.length ? profile.skills : undefined,
          })}
        </script>
      </Helmet>
      <HeroAmbientBackdrop contentClassName="[&_.min-h-screen]:!bg-transparent">

        <ProfileShell
          userId={profile.user_id}
          identity={identity}
          actions={actions}
          handles={handles}
          leetcodeFetchHandle={leetcodeFetchHandle}
          skills={profile.skills}
          subjects={profile.subjects}
          isPublic
        />
        <div className="mx-auto max-w-6xl px-4 pb-8 md:px-6">
          <ContestRatingGraph userId={profile.user_id} />
        </div>
      </HeroAmbientBackdrop>

    </>
  );
};

export default PublicProfile;
