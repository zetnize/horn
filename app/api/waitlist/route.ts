import { submit } from "@/lib/server/submit";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return submit(request, "waitlist");
}
