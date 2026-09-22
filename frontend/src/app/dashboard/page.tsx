import { logout } from "../login/actions";

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-md p-6 bg-card border rounded-xl shadow-sm text-center flex flex-col gap-4">
        <div className="text-4xl">🎉</div>
        <h1 className="text-2xl font-bold text-foreground">
          Selamat Datang di Dashboard!
        </h1>
        <p className="text-sm text-muted-foreground">
          Kamu berhasil login. Session JWT tersimpan dengan aman di HttpOnly
          Cookie dan rute ini dijaga oleh Middleware.
        </p>

        {/* Form Logout memanggil Server Action logout secara langsung */}
        <form action={logout} className="mt-2">
          <button
            type="submit"
            className="w-full bg-red-600 text-white font-medium py-2 px-4 rounded-md hover:bg-red-700 transition cursor-pointer"
          >
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}
