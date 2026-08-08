import { auth, toNextJsHandler } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
