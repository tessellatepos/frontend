//@ts-expect-error I'm not planning on fixing these imports, doesn't cause any issues when linting
import type { Config } from "@react-router/dev/config";

export default {
    appDirectory: "src",
    ssr: false,
} satisfies Config;
