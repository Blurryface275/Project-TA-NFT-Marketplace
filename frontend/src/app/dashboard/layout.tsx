import Navbar from "@/components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#F7F5EE] text-[#171717]">
      <Navbar />
      <main className="flex-1 pb-16">{children}</main>
    </div>
  );
}
