import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/jwt";

// 1. Tentukan rute privat dan rute publik
const protectedRoutes = ["/dashboard"];
const publicRoutes = ["/login", "/signup"]; // biar bisa dimasuki tanpa autentikasi dulu

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = path.startsWith('/dashboard') && !path.startsWith("/dashboard/buy"); // tujuannya biar customer bisa lihat buy ticket walaupn dia belum login
  const isPublicRoute = publicRoutes.includes(path);

  // 2. Baca cookie session langsung dari request
  const cookie = req.cookies.get("session")?.value;
  const session = await decrypt(cookie);
  const isAdminRoute = path.startsWith("/dashboard/admin");

  console.log(`🛡️ [Middleware] Mengakses: ${path} | Login: ${!!session?.userId}`);

  // 3. Jika rute diproteksi dan user belum login -> arahkan ke /login
  if (isProtectedRoute && !session?.userId) {
    console.log(`⛔ [Middleware] Akses ke ${path} ditolak! Redirect ke /login`);
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Proteksi route /dashboard/create-event khusus role organizer
  if (isAdminRoute && session?.role?.toString().toUpperCase() !== "ORGANIZER") {
    console.log(
      `⛔ [Middleware] Akses ke /dashboard/create-event ditolak! User bukan organizer`,
    );
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // 4. Jika user sudah login tapi membuka /login -> arahkan ke /dashboard
  if (isPublicRoute && session?.userId) {
    console.log(`↪️ [Middleware] User sudah login, redirect dari /login ke /dashboard`);
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

// 5. Matcher: Pastikan middleware HANYA berjalan di rute halaman,
// dan mengabaikan file statis seperti CSS, gambar, favicon, atau API
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
