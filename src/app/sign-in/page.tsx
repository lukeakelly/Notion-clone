import { signIn } from "@/server/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket } from "lucide-react";

export default function SignInPage() {
  const hasGoogle = !!process.env.GOOGLE_CLIENT_ID;
  const allowDev = process.env.ALLOW_DEV_LOGIN === "true";
  const previewEmails = (process.env.PREVIEW_LOGIN_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const allowPreview = previewEmails.length > 0;
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6 dark:bg-neutral-950">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Product OS</h1>
        </div>
        <p className="text-sm text-neutral-500">
          Sign in to your internal operating system.
        </p>
        {hasGoogle ? (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <Button type="submit" className="w-full">Continue with Google</Button>
          </form>
        ) : null}
        {allowDev ? (
          <form
            className="space-y-3"
            action={async (formData) => {
              "use server";
              const email = String(formData.get("email") ?? "founder@product-os.local");
              await signIn("dev", { email, redirectTo: "/" });
            }}
          >
            <div className="space-y-1">
              <Label>Email (dev login)</Label>
              <Input
                type="email"
                name="email"
                defaultValue="founder@product-os.local"
                required
              />
            </div>
            <Button type="submit" variant="outline" className="w-full">
              Continue (dev)
            </Button>
          </form>
        ) : null}
        {allowPreview ? (
          <form
            className="space-y-3"
            action={async (formData) => {
              "use server";
              const email = String(formData.get("email") ?? "");
              await signIn("preview", { email, redirectTo: "/" });
            }}
          >
            <div className="space-y-1">
              <Label>Email (preview login)</Label>
              <Input
                type="email"
                name="email"
                defaultValue={previewEmails[0]}
                required
              />
              <p className="text-xs text-neutral-500">
                Allowed: {previewEmails.join(", ")}
              </p>
            </div>
            <Button type="submit" variant="outline" className="w-full">
              Continue (preview)
            </Button>
          </form>
        ) : null}
        {!hasGoogle && !allowDev && !allowPreview ? (
          <p className="text-xs text-red-600">
            No auth providers configured. Set GOOGLE_CLIENT_ID, ALLOW_DEV_LOGIN, or PREVIEW_LOGIN_ALLOWED_EMAILS.
          </p>
        ) : null}
      </div>
    </div>
  );
}
