import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="space-y-3 text-[14px] leading-relaxed text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

export function LegalLayout({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <header className="mt-6 space-y-2 border-b border-border/50 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="text-[12px] uppercase tracking-wider text-muted-foreground">
            Last updated: {updated}
          </p>
          <p className="text-[14px] leading-relaxed text-muted-foreground">{intro}</p>
        </header>

        <div className="mt-8 space-y-8 pb-16">{children}</div>
      </div>
    </main>
  );
}
