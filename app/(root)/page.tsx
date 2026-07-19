import { UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-4">
      <h1 className="text-4xl font-bold tracking-tight">ChaiGPT Streaming App</h1>
      <p className="text-muted-foreground">You are successfully logged in!</p>
      <UserButton showName />
    </main>
  );
}
