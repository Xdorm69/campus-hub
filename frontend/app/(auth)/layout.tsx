import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-auth-gradient flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-[480px] rounded-lg bg-card p-8 text-card-foreground shadow-2xl">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <GraduationCap className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold">CampusHub</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
