import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "./src/app"; // ✅ Corrigé

export default function handler(req: VercelRequest, res: VercelResponse) {
  app(req, res);
}
