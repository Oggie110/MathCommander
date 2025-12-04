import type { Config } from "tailwindcss";
import designSystemPlugin, { tailwindExtend } from "./src/styles/plugins/designSystem";

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: tailwindExtend,
    },
    plugins: [designSystemPlugin],
} satisfies Config;
