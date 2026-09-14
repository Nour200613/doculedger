import { LoginForm } from "@/components/auth/LoginForm";
import { Navbar } from "@/components/common/Navbar";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <LoginForm />
      </main>
    </div>
  );
}
