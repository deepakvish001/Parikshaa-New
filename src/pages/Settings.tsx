import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Bell, Shield } from "lucide-react";
import SettingsHeader from "@/components/settings/SettingsHeader";
import SettingsProfileTab from "@/components/settings/SettingsProfileTab";
import SettingsSecurityTab from "@/components/settings/SettingsSecurityTab";
import SettingsNotificationsTab from "@/components/settings/SettingsNotificationsTab";
import SettingsAccountTab from "@/components/settings/SettingsAccountTab";
import { useAuth } from "@/contexts/AuthContext";
import { LoginPromptDialog } from "@/components/LoginPromptDialog";
import { HeroAmbientBackdrop } from "@/components/landing/HeroAmbientBackdrop";
import { NumberedPillTabs, type NumberedPillTab } from "@/components/common/NumberedPillTabs";

// Shared numbered-pill tabs (same visual language as ApexNavbar on /).
const tabs: NumberedPillTab[] = [
  { id: "profile", label: "Profile", icon: User, kicker: "01" },
  { id: "security", label: "Security", icon: Lock, kicker: "02" },
  { id: "notifications", label: "Notifications", icon: Bell, kicker: "03" },
  { id: "account", label: "Account", icon: Shield, kicker: "04" },
];

// Section-entry animation — mirrors the landing-page section entrances.
const panelVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};
const panelTransition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const };

const Settings = () => {
  const [activeTab, setActiveTab] = useState<string>("profile");
  const { user } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(!user);

  const renderPanel = () => {
    switch (activeTab) {
      case "security":
        return <SettingsSecurityTab />;
      case "notifications":
        return <SettingsNotificationsTab />;
      case "account":
        return <SettingsAccountTab />;
      case "profile":
      default:
        return <SettingsProfileTab />;
    }
  };

  return (
    <HeroAmbientBackdrop>
      <SettingsHeader />

      {!user && (
        <LoginPromptDialog
          open={showLoginPrompt}
          onOpenChange={setShowLoginPrompt}
          message="Sign in to access and modify your settings."
        />
      )}

      {/* Tab rail — matches landing-page section rhythm (max-w-6xl / px scale / py cadence). */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 md:pt-12">
        <div className="flex justify-center">
          <NumberedPillTabs tabs={tabs} value={activeTab} onValueChange={setActiveTab} />
        </div>
      </section>

      {/* Panels — spacing echoes the AllInOneHub section on the home page. */}
      <section
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-16 sm:pb-24"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={panelTransition}
          >
            {renderPanel()}
          </motion.div>
        </AnimatePresence>
      </section>
    </HeroAmbientBackdrop>
  );
};

export default Settings;
