import { config as loadDotenv } from "dotenv";

const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";

loadDotenv({ path: envFile });
