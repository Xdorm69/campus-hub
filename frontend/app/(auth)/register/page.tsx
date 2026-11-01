import { Suspense } from "react";
import { RegisterForm } from "@/features/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="mt-1 text-muted-foreground">Join your classes and start chatting in minutes.</p>
      </div>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </>
  );
}
