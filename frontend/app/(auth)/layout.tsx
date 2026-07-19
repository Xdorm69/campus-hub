import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-serif text-xl font-semibold">CampusHub</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
