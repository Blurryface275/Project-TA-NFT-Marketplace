import { Suspense } from "react";
import AuthPortal from "@/components/auth/AuthPortal";

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6]" />}>
      <AuthPortal initialMode="signup" />
    </Suspense>
  );
}

