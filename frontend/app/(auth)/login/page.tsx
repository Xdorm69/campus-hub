import { Suspense } from "react";
import { LoginForm } from "@/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Welcome back!</h1>
        <p className="mt-1 text-muted-foreground">We&apos;re so excited to see you again!</p>
      </div>
      {/* LoginForm reads ?from= via useSearchParams. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
