import { clerkMiddleware } from "@clerk/nextjs/server";

// Route-level auth lives in each page/layout instead (see requireUser() in
// lib/server/auth.ts) — createRouteMatcher-based protection here is
// deprecated in favor of that resource-based approach. This middleware
// still needs to run on every request so Clerk can populate auth context
// for auth()/currentUser() calls.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/:path*",
    "/(api|trpc)(.*)",
  ],
};