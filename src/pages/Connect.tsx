import { useState } from "react";
import { Copy, Check, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const MCP_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/mcp`;

const Connect = () => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(MCP_URL);
    setCopied(true);
    toast({ title: "Copied", description: "MCP server URL copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <header className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          <Sparkles className="h-3.5 w-3.5" />
          Agent integrations
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Connect Parikshaa to your AI assistant
        </h1>
        <p className="mt-3 text-muted-foreground">
          Use Parikshaa from ChatGPT or Claude. Copy the server URL below and follow the steps for your assistant.
        </p>
      </header>

      <Card className="mb-10 p-5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          MCP server URL
        </label>
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 truncate rounded-md border border-border bg-secondary/40 px-3 py-2 font-mono text-sm">
            {MCP_URL}
          </code>
          <Button onClick={handleCopy} variant="outline" size="sm" className="shrink-0">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="ml-2">{copied ? "Copied" : "Copy"}</span>
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          You'll sign in with your Parikshaa account when the assistant connects, and it will act as you.
        </p>
      </Card>

      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Bot className="h-5 w-5 text-orange-500" />
          <h2 className="text-xl font-semibold">ChatGPT</h2>
        </div>
        <Card className="p-5">
          <ol className="space-y-3 text-sm leading-relaxed">
            <li>
              <span className="font-semibold">1.</span> Open{" "}
              <a
                href="https://chatgpt.com/#settings/Connectors/Advanced"
                target="_blank"
                rel="noreferrer"
                className="text-amber-600 underline dark:text-amber-400"
              >
                ChatGPT Connectors settings
              </a>{" "}
              and enable <strong>Developer mode</strong> (read the risk notice shown there).
            </li>
            <li>
              <span className="font-semibold">2.</span> In the chat composer's <strong>+</strong> menu, turn on <strong>Developer mode</strong>.
            </li>
            <li>
              <span className="font-semibold">3.</span> Click <strong>Add sources</strong>, then <strong>Connect more</strong>.
            </li>
            <li>
              <span className="font-semibold">4.</span> Name the connector <em>Parikshaa</em> and paste the MCP URL above.
            </li>
            <li>
              <span className="font-semibold">5.</span> Sign in with your Parikshaa account when prompted, then ask ChatGPT to use Parikshaa.
            </li>
          </ol>
        </Card>
      </section>

      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Bot className="h-5 w-5 text-amber-500" />
          <h2 className="text-xl font-semibold">Claude</h2>
        </div>
        <Card className="p-5">
          <ol className="space-y-3 text-sm leading-relaxed">
            <li>
              <span className="font-semibold">1.</span> Open{" "}
              <a
                href="https://claude.ai/customize/connectors?modal=add-custom-connector"
                target="_blank"
                rel="noreferrer"
                className="text-amber-600 underline dark:text-amber-400"
              >
                Claude custom connectors
              </a>
              .
            </li>
            <li>
              <span className="font-semibold">2.</span> Name the connector <em>Parikshaa</em> and paste the MCP URL above.
            </li>
            <li>
              <span className="font-semibold">3.</span> Sign in with your Parikshaa account when prompted.
            </li>
            <li>
              <span className="font-semibold">4.</span> Enable the connector from the chat composer, then ask Claude to use Parikshaa.
            </li>
          </ol>
        </Card>
      </section>

      <p className="text-center text-sm text-muted-foreground">
        Once connected, your assistant can look up your Parikshaa profile and folders on your behalf.
      </p>
    </main>
  );
};

export default Connect;
