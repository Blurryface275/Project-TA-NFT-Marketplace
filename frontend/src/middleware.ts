import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

// 1. Tentukan rute privat dan rute publik
const protectedRoutes = ["/dashboard"];
const publicRoutes = ["/login", "/signup"]; // biar bisa dimasuki tanpa autentikasi dulu

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);

  // 2. Baca cookie session langsung dari request
  const cookie = req.cookies.get("session")?.value;
  const session = await decrypt(cookie);

  console.log(`🛡️ [Middleware] Mengakses: ${path} | Login: ${!!session?.userId}`);

  // 3. Jika rute diproteksi dan user belum login -> arahkan ke /login
  if (isProtectedRoute && !session?.userId) {
    console.log(`⛔ [Middleware] Akses ke ${path} ditolak! Redirect ke /login`);
    return NextResponse.redirect(new URL("/login", req.nextUrl));
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
