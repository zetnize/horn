import { waitlistSchema } from "@/lib/validation";
import { temporarySubmit } from "@/lib/temporary-api";
export const runtime="nodejs";
export async function POST(request:Request){return temporarySubmit(request,waitlistSchema);}

