import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Loader2, Camera, Edit2, Share2, Plus, X, AlertCircle, Save,
  Linkedin, Github, Twitter, Instagram, Code, FileText,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ImageCropper from "@/components/ImageCropper";
import {
  validateTwitterUrl, validateLinkedInUrl, validateGitHubUrl, validateInstagramUrl,
  validateLeetCodeUrl, normalizeLeetCodeUrl, validateHackerRankUrl, validateCodeForcesUrl, validateCodeChefUrl,
  validateGeeksForGeeksUrl, validateGenericUrl, validateUsername,
} from "@/lib/validation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ProfileShell } from "@/components/profile/ProfileShell";
import { HeroAmbientBackdrop } from "@/components/landing/HeroAmbientBackdrop";



interface ExtendedProfile {
  id: string; user_id: string;
  username?: string; mobile_number?: string; bio?: string; location?: string;
  occupation?: string; website?: string; college_name?: string;
  course_name?: string; branch?: string; study_year?: string;
  skills?: string[]; interests?: string[]; goals?: string[]; aspirations?: string[];
  twitter_url?: string; linkedin_url?: string; github_url?: string; instagram_url?: string;
  resume_url?: string;
  leetcode_url?: string; hackerrank_url?: string; codeforces_url?: string;
  codechef_url?: string; geeksforgeeks_url?: string;
  profile_subjects?: { label: string; percent: number }[];
}

const DashboardProfile = () => {
  const { user, profile, updateProfile, refreshExtendedProfile } = useAuth();
  const { requireAuth, LoginPromptDialog: loginDialog } = useRequireAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  // Keep local preview in sync when the AuthContext profile updates (e.g. after save).
  useEffect(() => {
    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
  }, [profile?.avatar_url]);
  const [extendedProfile, setExtendedProfile] = useState<ExtendedProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSection, setEditSection] = useState("info");
  const [editForm, setEditForm] = useState<Partial<ExtendedProfile> & { full_name?: string }>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tempSkill, setTempSkill] = useState("");
  const [tempInterest, setTempInterest] = useState("");
  const [tempGoal, setTempGoal] = useState("");
  const [tempAspiration, setTempAspiration] = useState("");
  const [tempSubjectLabel, setTempSubjectLabel] = useState("");
  const [tempSubjectPct, setTempSubjectPct] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) { setIsLoading(false); return; }
      try {
        const { data, error } = await supabase
          .from("user_profiles_extended")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          const d = data as any as ExtendedProfile;
          setExtendedProfile(d);
          setEditForm({ ...d, full_name: profile?.full_name || "" });
        }
      } catch (e) {
        console.error("Error fetching profile:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Please select an image file" }); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Image must be less than 5MB" }); return;
    }
    setSelectedImage(URL.createObjectURL(file));
    setCropperOpen(true);
    e.target.value = "";
  };

  const handleCroppedImage = async (croppedBlob: Blob) => {
    if (!user) return;
    setIsUploadingAvatar(true); setCropperOpen(false);
    try {
      const fileName = `${user.id}/avatar.jpg`;
      const { error: upErr } = await supabase.storage.from("avatars")
        .upload(fileName, croppedBlob, {
          upsert: true,
          contentType: "image/jpeg",
          cacheControl: "3600",
        });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Try AuthContext.updateProfile first so the sidebar / bottom-left menu updates live.
      let { error: updErr } = await updateProfile({ avatar_url: newAvatarUrl });

      // If the row doesn't exist yet (rare — e.g. OAuth user before trigger), upsert one.
      if (updErr) {
        const { error: upsertErr } = await supabase
          .from("profiles")
          .upsert(
            { user_id: user.id, avatar_url: newAvatarUrl, full_name: profile?.full_name ?? null },
            { onConflict: "user_id" }
          );
        if (upsertErr) throw upsertErr;
      }

      // Verify the write actually landed in the DB; if not, fail loudly.
      const { data: check, error: checkErr } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (checkErr) throw checkErr;
      if (!check?.avatar_url) throw new Error("Avatar was not saved. Please try again.");

      setAvatarUrl(check.avatar_url);
      // Refresh AuthContext so sidebar / public profile reflect the new avatar immediately.
      if (updErr) await updateProfile({ avatar_url: check.avatar_url });
      toast({ title: "Avatar updated!" });
    } catch (e: any) {
      console.error("Avatar upload error:", e);
      toast({ variant: "destructive", title: "Upload failed", description: e.message || "Please try again." });
    } finally {
      setIsUploadingAvatar(false);
      if (selectedImage) { URL.revokeObjectURL(selectedImage); setSelectedImage(""); }
    }
  };

  const openEditModal = (section: string) => {
    requireAuth(() => {
      setEditSection(section);
      setEditForm({ ...(extendedProfile || {}), full_name: profile?.full_name || "" });
      setErrors({});
      setIsEditModalOpen(true);
    });
  };

  const validateAll = (): boolean => {
    const errs: Record<string, string> = {};
    const checks = [
      ["username", validateUsername(editForm.username || "")],
      ["website", validateGenericUrl(editForm.website || "")],
      ["twitter_url", validateTwitterUrl(editForm.twitter_url || "")],
      ["linkedin_url", validateLinkedInUrl(editForm.linkedin_url || "")],
      ["github_url", validateGitHubUrl(editForm.github_url || "")],
      ["instagram_url", validateInstagramUrl(editForm.instagram_url || "")],
      ["resume_url", validateGenericUrl(editForm.resume_url || "")],
      ["leetcode_url", validateLeetCodeUrl(editForm.leetcode_url || "")],
      ["hackerrank_url", validateHackerRankUrl(editForm.hackerrank_url || "")],
      ["codeforces_url", validateCodeForcesUrl(editForm.codeforces_url || "")],
      ["codechef_url", validateCodeChefUrl(editForm.codechef_url || "")],
      ["geeksforgeeks_url", validateGeeksForGeeksUrl(editForm.geeksforgeeks_url || "")],
    ] as const;
    checks.forEach(([k, r]) => { if (!r.valid) errs[k] = r.error!; });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!user) return;

    // Auto-commit any pending temp input values that the user typed but didn't add
    const mergedForm: Partial<ExtendedProfile> & { full_name?: string } = { ...editForm };
    const pushArr = (k: "skills" | "interests" | "goals" | "aspirations", v: string) => {
      const t = v.trim();
      if (!t) return;
      const cur = (mergedForm[k] as string[]) || [];
      if (!cur.includes(t)) mergedForm[k] = [...cur, t] as any;
    };
    pushArr("skills", tempSkill);
    pushArr("interests", tempInterest);
    pushArr("goals", tempGoal);
    pushArr("aspirations", tempAspiration);
    if (tempSubjectLabel.trim()) {
      const pct = Math.max(0, Math.min(100, Number(tempSubjectPct) || 0));
      mergedForm.profile_subjects = [
        ...(mergedForm.profile_subjects || []),
        { label: tempSubjectLabel.trim(), percent: pct },
      ];
    }

    // Normalize LeetCode handle to full URL before validation & save
    if (mergedForm.leetcode_url) {
      mergedForm.leetcode_url = normalizeLeetCodeUrl(mergedForm.leetcode_url);
    }

    if (mergedForm !== editForm) setEditForm(mergedForm);

    if (!validateAll()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please fix the errors before saving." });
      return;
    }
    setIsSaving(true);
    try {
      // Whitelist editable columns to avoid sending read-only / unknown fields
      const ALLOWED = [
        "username", "mobile_number", "bio", "location", "occupation", "website",
        "college_name", "course_name", "branch", "study_year", "company_name", "role",
        "experience", "other_description",
        "skills", "interests", "goals", "aspirations", "profile_subjects",
        "twitter_url", "linkedin_url", "github_url", "instagram_url", "resume_url",
        "leetcode_url", "hackerrank_url", "codeforces_url", "codechef_url", "geeksforgeeks_url",
        "other_links",
      ] as const;
      const editable: Record<string, any> = {};
      for (const k of ALLOWED) {
        const v = (mergedForm as any)[k];
        if (v !== undefined) editable[k] = v === "" ? null : v;
      }
      const payload = { ...editable, user_id: user.id };
      // Preserve required NOT NULL columns on upsert (insert path)
      if (!extendedProfile) {
        (payload as any).user_type = (payload as any).user_type || "student";
      } else {
        (payload as any).user_type = (extendedProfile as any).user_type || (payload as any).user_type || "student";
      }

      const { data, error } = await supabase
        .from("user_profiles_extended")
        .upsert(payload as any, { onConflict: "user_id" })
        .select()
        .maybeSingle();
      if (error) throw error;

      // Save full_name via AuthContext so the sidebar/menu updates live.
      const newFullName = (mergedForm.full_name ?? "").trim();
      if (newFullName && newFullName !== (profile?.full_name || "")) {
        const { error: pErr } = await updateProfile({ full_name: newFullName });
        if (pErr) throw pErr;
      }

      const saved = (data as any) ?? null;
      setExtendedProfile((prev) => ({ ...(prev || {}), ...(saved || editable) } as ExtendedProfile));
      // Refresh AuthContext extended profile too (sidebar may read from it).
      await refreshExtendedProfile();
      // Clear temp inputs after successful save
      setTempSkill(""); setTempInterest(""); setTempGoal(""); setTempAspiration("");
      setTempSubjectLabel(""); setTempSubjectPct("");
      toast({ title: "Profile updated!" });
      setIsEditModalOpen(false);
    } catch (e: any) {
      console.error("Profile save error:", e);
      toast({ variant: "destructive", title: "Save failed", description: e.message || "Unknown error" });
    } finally {
      setIsSaving(false);
    }
  };


  const addArrayItem = (field: "skills" | "interests" | "goals" | "aspirations", value: string, clear: () => void) => {
    if (!value.trim()) return;
    const cur = (editForm[field] as string[]) || [];
    if (cur.includes(value.trim())) { toast({ variant: "destructive", title: "Already added" }); return; }
    setEditForm((p) => ({ ...p, [field]: [...cur, value.trim()] }));
    clear();
  };
  const removeArrayItem = (field: "skills" | "interests" | "goals" | "aspirations", i: number) => {
    const cur = (editForm[field] as string[]) || [];
    setEditForm((p) => ({ ...p, [field]: cur.filter((_, ix) => ix !== i) }));
  };

  const addSubject = () => {
    const label = tempSubjectLabel.trim();
    const pct = Math.max(0, Math.min(100, Number(tempSubjectPct) || 0));
    if (!label) {
      toast({ variant: "destructive", title: "Subject name required" });
      return;
    }
    setEditForm((p) => {
      const cur = (p.profile_subjects || []) as { label: string; percent: number }[];
      if (cur.some((s) => s.label.toLowerCase() === label.toLowerCase())) {
        toast({ variant: "destructive", title: "Already added" });
        return p;
      }
      return { ...p, profile_subjects: [...cur, { label, percent: pct }] };
    });
    setTempSubjectLabel(""); setTempSubjectPct("");
  };
  const removeSubject = (i: number) => {
    setEditForm((p) => {
      const cur = (p.profile_subjects || []) as { label: string; percent: number }[];
      return { ...p, profile_subjects: cur.filter((_, ix) => ix !== i) };
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const identity = {
    fullName: profile?.full_name || "User",
    username: extendedProfile?.username ? `@${extendedProfile.username}` : null,
    avatarUrl: avatarUrl || profile?.avatar_url,
    bio: extendedProfile?.bio,
    occupation: extendedProfile?.occupation,
    website: extendedProfile?.website,
    mobile: extendedProfile?.mobile_number,
    college: extendedProfile?.college_name,
    course: extendedProfile?.course_name,
    branch: extendedProfile?.branch,
    studyYear: extendedProfile?.study_year,
    location: extendedProfile?.location,
    github: extendedProfile?.github_url,
    linkedin: extendedProfile?.linkedin_url,
    twitter: extendedProfile?.twitter_url,
    instagram: extendedProfile?.instagram_url,
    leetcode: extendedProfile?.leetcode_url,
    codeforces: extendedProfile?.codeforces_url,
    codechef: extendedProfile?.codechef_url,
    hackerrank: extendedProfile?.hackerrank_url,
    geeksforgeeks: extendedProfile?.geeksforgeeks_url,
    resume: extendedProfile?.resume_url,
    interests: extendedProfile?.interests,
    goals: extendedProfile?.goals,
    aspirations: extendedProfile?.aspirations,
  };

  const actions = (
    <>
      <div className="relative">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
        <ImageCropper
          open={cropperOpen}
          onOpenChange={setCropperOpen}
          imageSrc={selectedImage}
          onCropComplete={handleCroppedImage}
          aspectRatio={1}
        />
      </div>
      <button
        className="w-full flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-gradient-to-b from-amber-500/15 to-orange-500/10 px-3 py-2 text-xs font-semibold text-amber-100 hover:from-amber-500/25 hover:to-orange-500/20 hover:border-amber-400/70 hover:text-amber-50 transition-all"
        onClick={() => requireAuth(() => fileInputRef.current?.click())}
        disabled={isUploadingAvatar}
      >
        {isUploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
        Change avatar
      </button>
      <button
        className="w-full flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-gradient-to-b from-amber-500/15 to-orange-500/10 px-3 py-2 text-xs font-semibold text-amber-100 hover:from-amber-500/25 hover:to-orange-500/20 hover:border-amber-400/70 hover:text-amber-50 transition-all"
        onClick={() => openEditModal("info")}
      >
        <Edit2 className="h-3.5 w-3.5" /> Edit Profile
      </button>
      {extendedProfile?.username && (
        <Link to={`/u/${extendedProfile.username}`} target="_blank" className="w-full">
          <button className="w-full flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-gradient-to-b from-amber-500/15 to-orange-500/10 px-3 py-2 text-xs font-semibold text-amber-100 hover:from-amber-500/25 hover:to-orange-500/20 hover:border-amber-400/70 hover:text-amber-50 transition-all">
            <Share2 className="h-3.5 w-3.5" /> Share Profile
          </button>
        </Link>
      )}
    </>
  );

  const handles = {
    leetcode: extendedProfile?.leetcode_url,
    codeforces: extendedProfile?.codeforces_url,
    codechef: extendedProfile?.codechef_url,
    hackerrank: extendedProfile?.hackerrank_url,
    geeksforgeeks: extendedProfile?.geeksforgeeks_url,
    github: extendedProfile?.github_url,
  };

  return (
    <>
      <HeroAmbientBackdrop contentClassName="[&_.min-h-screen]:!bg-transparent">
        <ProfileShell
          userId={user!.id}
          identity={identity}
          actions={actions}
          handles={handles}
          skills={extendedProfile?.skills || []}
          subjects={extendedProfile?.profile_subjects || []}
        />
      </HeroAmbientBackdrop>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>

        <DialogContent className="w-[calc(100vw-1rem)] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-[#0a0a0f]/95 backdrop-blur-xl border border-amber-400/20 shadow-[0_20px_60px_-15px_rgba(245,158,11,0.25)]">
          <DialogHeader className="border-b border-amber-400/15 pb-3">
            <DialogTitle className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent text-base sm:text-lg">Edit Profile</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">Update your profile information — visible on your public page.</DialogDescription>
          </DialogHeader>

          {/* Inline avatar upload */}
          <div className="flex items-center gap-4 rounded-xl border border-amber-400/15 bg-white/[0.03] p-3 sm:p-4">
            <div className="relative shrink-0">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-2 ring-amber-400/40">
                <AvatarImage src={avatarUrl || profile?.avatar_url} alt="avatar" />
                <AvatarFallback className="bg-gradient-to-br from-amber-500/30 to-orange-500/20 text-amber-100 font-semibold">
                  {(profile?.full_name || "U").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                  <Loader2 className="h-5 w-5 animate-spin text-amber-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-100">Profile photo</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground">JPG / PNG, square, under 5MB.</p>
              <button
                type="button"
                onClick={() => requireAuth(() => fileInputRef.current?.click())}
                disabled={isUploadingAvatar}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-gradient-to-b from-amber-500/20 to-orange-500/10 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:from-amber-500/30 hover:to-orange-500/20 hover:border-amber-400/70 disabled:opacity-50 transition-all"
              >
                <Camera className="h-3.5 w-3.5" /> {avatarUrl ? "Change photo" : "Upload photo"}
              </button>
            </div>
          </div>

          <Tabs value={editSection} onValueChange={setEditSection}>
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto bg-white/[0.04] border border-amber-400/15 p-1 rounded-lg gap-2">
              {[
                { v: "info", l: "Info" },
                { v: "skills", l: "Skills" },
                { v: "subjects", l: "Subjects" },
                { v: "links", l: "Links" },
              ].map((t) => (
                <TabsTrigger
                  key={t.v}
                  value={t.v}
                  className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-b data-[state=active]:from-amber-500/25 data-[state=active]:to-orange-500/15 data-[state=active]:text-amber-100 data-[state=active]:ring-1 data-[state=active]:ring-amber-400/50"
                >
                  {t.l}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={editForm.full_name || ""} placeholder="Your full name"
                    onChange={(e) => setEditForm((p) => ({ ...p, full_name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={editForm.username || ""} placeholder="your-username"
                    onChange={(e) => setEditForm((p) => ({ ...p, username: e.target.value }))}
                    className={errors.username ? "border-destructive" : ""} />
                  {errors.username && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.username}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Mobile</Label>
                  <Input value={editForm.mobile_number || ""} onChange={(e) => setEditForm((p) => ({ ...p, mobile_number: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Location</Label>
                  <Input value={editForm.location || ""} onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label>Bio</Label>
                <Textarea rows={3} value={editForm.bio || ""} onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Occupation</Label>
                  <Input value={editForm.occupation || ""} onChange={(e) => setEditForm((p) => ({ ...p, occupation: e.target.value }))} /></div>
                <div className="space-y-2"><Label>College</Label>
                  <Input value={editForm.college_name || ""} onChange={(e) => setEditForm((p) => ({ ...p, college_name: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Course</Label>
                  <Input value={editForm.course_name || ""} placeholder="e.g. B.Tech"
                    onChange={(e) => setEditForm((p) => ({ ...p, course_name: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Branch</Label>
                  <Input value={editForm.branch || ""} placeholder="e.g. CSE"
                    onChange={(e) => setEditForm((p) => ({ ...p, branch: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Study Year</Label>
                  <Select
                    value={editForm.study_year || ""}
                    onValueChange={(v) => setEditForm((p) => ({ ...p, study_year: v || undefined }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Other"].map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Website</Label>
                <Input value={editForm.website || ""} onChange={(e) => setEditForm((p) => ({ ...p, website: e.target.value }))}
                  className={errors.website ? "border-destructive" : ""} />
                {errors.website && <p className="text-xs text-destructive">{errors.website}</p>}
              </div>
            </TabsContent>

            <TabsContent value="skills" className="space-y-5 mt-4">
              {[
                { label: "Skills", field: "skills" as const, temp: tempSkill, setTemp: setTempSkill, placeholder: "Add a skill" },
                { label: "Interests", field: "interests" as const, temp: tempInterest, setTemp: setTempInterest, placeholder: "Add an interest" },
                { label: "Goals", field: "goals" as const, temp: tempGoal, setTemp: setTempGoal, placeholder: "Add a goal" },
                { label: "Aspirations", field: "aspirations" as const, temp: tempAspiration, setTemp: setTempAspiration, placeholder: "Add an aspiration" },
              ].map(({ label, field, temp, setTemp, placeholder }) => (
                <div key={field}>
                  <Label>{label}</Label>
                  <div className="flex gap-2 mt-2">
                    <Input placeholder={placeholder} value={temp} onChange={(e) => setTemp(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addArrayItem(field, temp, () => setTemp("")))}
                      className="min-w-0" />
                    <Button type="button" onClick={() => addArrayItem(field, temp, () => setTemp(""))}
                      className="shrink-0 bg-gradient-to-b from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {((editForm[field] as string[]) || []).map((item, i) => (
                      <Badge key={i} className="gap-1 pr-1 border border-amber-400/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/15">
                        {item}
                        <button onClick={() => removeArrayItem(field, i)} className="ml-1 hover:text-rose-300"><X className="w-3 h-3" /></button>
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="subjects" className="space-y-4 mt-4">
              <p className="text-xs text-muted-foreground">Add subjects with completion percentage shown on your profile.</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Subject (e.g. Operating Systems)"
                  value={tempSubjectLabel}
                  onChange={(e) => setTempSubjectLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubject(); } }}
                  className="flex-1"
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="%"
                    value={tempSubjectPct}
                    onChange={(e) => setTempSubjectPct(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubject(); } }}
                    className="w-20"
                  />
                  <Button type="button" onClick={addSubject}
                    className="shrink-0 bg-gradient-to-b from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {(editForm.profile_subjects || []).map((s, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-amber-400/20 bg-white/[0.03] p-2">
                    <span className="flex-1 text-sm text-amber-50/90">{s.label}</span>
                    <span className="text-xs text-amber-300/80 tabular-nums">{s.percent}%</span>
                    <button onClick={() => removeSubject(i)} className="text-muted-foreground hover:text-rose-300"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="links" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "LinkedIn", key: "linkedin_url", icon: Linkedin },
                  { label: "GitHub", key: "github_url", icon: Github },
                  { label: "Twitter", key: "twitter_url", icon: Twitter },
                  { label: "Instagram", key: "instagram_url", icon: Instagram },
                  { label: "LeetCode", key: "leetcode_url", icon: Code },
                  { label: "Codeforces", key: "codeforces_url", icon: Code },
                  { label: "CodeChef", key: "codechef_url", icon: Code },
                  { label: "HackerRank", key: "hackerrank_url", icon: Code },
                  { label: "GeeksForGeeks", key: "geeksforgeeks_url", icon: Code },
                  { label: "Resume", key: "resume_url", icon: FileText },
                ].map(({ label, key, icon: Icon }) => (
                  <div key={key} className="space-y-2">
                    <Label className="flex items-center gap-2 text-amber-100/90"><Icon className="w-3.5 h-3.5 text-amber-300" /> {label}</Label>
                    <Input value={(editForm as any)[key] || ""}
                      onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))}
                      onBlur={() => {
                        if (key === "leetcode_url") {
                          const normalized = normalizeLeetCodeUrl((editForm as any)[key] || "");
                          if (normalized !== (editForm as any)[key]) {
                            setEditForm((p) => ({ ...p, [key]: normalized }));
                          }
                          // Clear error on successful normalization
                          if (normalized) {
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next[key];
                              return next;
                            });
                          }
                        }
                      }}
                      className={errors[key] ? "border-orange-400/70 focus-visible:ring-orange-400/40" : ""} />
                    {errors[key] && <p className="text-[11px] text-orange-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors[key]}</p>}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-4 border-t border-amber-400/15 pt-4 flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}
              className="w-full sm:w-auto border-amber-400/30 bg-transparent text-amber-100 hover:bg-amber-500/10 hover:text-amber-50 hover:border-amber-400/60">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto gap-2 bg-gradient-to-b from-amber-500 to-orange-500 text-black font-semibold hover:from-amber-400 hover:to-orange-400 shadow-[0_4px_14px_-4px_rgba(245,158,11,0.6)]"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>
      {loginDialog}
    </>
  );
};

export default DashboardProfile;
