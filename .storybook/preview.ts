import type { Preview } from "@storybook/react";
import "../src/index.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#030305" },
        { name: "light", value: "#ffffff" },
      ],
    },
    a11y: {
      // Flag color-contrast + ARIA issues in the Storybook a11y panel
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
          { id: "region", enabled: false },
        ],
      },
    },
  },
  globalTypes: {
    theme: {
      description: "Global theme (adds .dark class to <html>)",
      defaultValue: "dark",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, ctx) => {
      const theme = ctx.globals.theme ?? "dark";
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", theme === "dark");
      }
      return Story();
    },
  ],
};

export default preview;
