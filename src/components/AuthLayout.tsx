import { ReactNode, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, TrendingUp, Users, Zap, Sparkles, Quote, Star } from "lucide-react";
import { ApexNavbar } from "@/components/landing/ApexNavbar";
import { ParikshaaWordmark } from "@/components/brand/ParikshaaWordmark";
import { ApexFooter } from "@/components/landing/ApexFooter";
import { HeroAmbientBackdrop } from "@/components/landing/HeroAmbientBackdrop";


interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

const features = [
  { icon: TrendingUp, text: "Track sheets, contests & progress in real-time" },
  { icon: Users, text: "Join 10,000+ learners across India" },
  { icon: Zap, text: "AI-guided prep, mock interviews & feedback" },
  { icon: CheckCircle2, text: "Curated jobs, internships & hackathons" },
];

const testimonials = [
  {
    name: "Priya Sharma",
    role: "CSE · IIT Delhi",
    avatar: "PS",
    content: "Parikshaa completely transformed how I prep for placements. Landed my dream role.",
    rating: 5,
  },
  {
    name: "Rahul Verma",
    role: "ECE · BITS Pilani",
    avatar: "RV",
    content: "The proctored contests and sheets feel Awwwards-tier. Best DSA platform I've used.",
    rating: 5,
  },
  {
    name: "Ananya Patel",
    role: "MBA · IIM Bangalore",
    avatar: "AP",
    content: "Sheets, jobs, events — all in one dark, focused dashboard. Everything I need.",
    rating: 5,
  },
];

const stats = [
  { value: "10K+", label: "Learners" },
  { value: "4.9", label: "Rating" },
  { value: "100+", label: "Colleges" },
];

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentTestimonial((p) => (p + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <HeroAmbientBackdrop>
      {/* Home navbar */}
      <ApexNavbar />


      <div className="relative z-10 mx-auto grid max-w-[1280px] grid-cols-1 gap-8 px-5 pb-16 pt-28 sm:px-8 lg:grid-cols-2 lg:gap-12 lg:pt-32">

        {/* Left hero */}
        <section className="hidden lg:flex lg:flex-col lg:justify-center">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3 w-3" strokeWidth={2.2} />
              All-in-one prep
            </span>

            <h1
              className="font-apex-display mt-5 text-5xl font-bold leading-[1.02] tracking-tight text-foreground xl:text-6xl"
            >
              {(() => {
                const words = title.split(" ");
                const last = words[words.length - 1];
                const head = words.slice(0, -1).join(" ");
                if (last === "Parikshaa") {
                  return (
                    <>
                      {head}{head ? " " : ""}
                      <ParikshaaWordmark size="lg" showAccents={false} className="align-baseline" />
                    </>
                  );
                }
                return (
                  <>
                    {head}{head ? " " : ""}
                    <span className="bg-gradient-to-r from-primary via-primary to-primary bg-clip-text text-transparent">
                      {last}
                    </span>
                  </>
                );
              })()}
            </h1>
            <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-muted-foreground">
              {subtitle}
            </p>

            <ul className="mt-8 space-y-3">
              {features.map((f, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 + i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg border border-primary/25 bg-primary/10">
                    <f.icon className="h-4 w-4 text-primary" strokeWidth={1.9} />
                  </span>
                  <span className="text-[13.5px] text-muted-foreground">{f.text}</span>
                </motion.li>
              ))}
            </ul>

            {/* Testimonial */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-8 max-w-md rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm"
            >
              <div className="mb-3 flex items-center gap-2">
                <Quote className="h-4 w-4 text-primary/70" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  What learners say
                </span>
              </div>
              <div className="relative min-h-[92px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTestimonial}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-[13.5px] leading-relaxed text-foreground/85">
                      "{testimonials[currentTestimonial].content}"
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full border border-primary/30 bg-primary/15 text-[11px] font-bold text-primary">
                          {testimonials[currentTestimonial].avatar}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-foreground">
                            {testimonials[currentTestimonial].name}
                          </p>
                          <p className="text-[11.5px] text-muted-foreground">
                            {testimonials[currentTestimonial].role}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: testimonials[currentTestimonial].rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="mt-4 flex justify-center gap-1.5">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentTestimonial(i)}
                    aria-label={`Show testimonial ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentTestimonial
                        ? "w-6 bg-primary"
                        : "w-1.5 bg-muted hover:bg-muted/80"
                    }`}
                  />
                ))}
              </div>
            </motion.div>

            <div className="mt-8 flex gap-8">
              {stats.map((s) => (
                <div key={s.label}>
                  <p
                    
                    className="bg-gradient-to-r from-primary to-primary bg-clip-text text-xl font-bold text-transparent"
                  >
                    {s.value}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Right form */}
        <section className="flex items-center justify-center py-4 lg:py-0">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div
              className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-8 shadow-none backdrop-blur-xl sm:p-10"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
              />
              {children}
            </div>
          </motion.div>
        </section>
      </div>

      {/* Home footer */}
      <div className="relative z-10">
        <ApexFooter />
      </div>
    </HeroAmbientBackdrop>
  );
};

export default AuthLayout;
