import { signIn } from "@/server/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

export default function SignInPage() {
  const hasGoogle = !!process.env.GOOGLE_CLIENT_ID;
  const allowDev = process.env.ALLOW_DEV_LOGIN === "true";
  const previewEmails = (process.env.PREVIEW_LOGIN_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const allowPreview =
    previewEmails.length > 0 || (process.env.VERCEL_ENV === "preview" && !hasGoogle);
  const previewDefaultEmail = previewEmails[0] ?? "estimator@simplyai.com.au";
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-600 p-1.5 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <h1 className="text-lg font-semibold">Simplyai Estimator</h1>
        </div>
        <p className="text-sm text-neutral-500">
          Sign in with a Simplyai email address.
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
              const email = String(formData.get("email") ?? "estimator@simplyai.com.au");
              await signIn("dev", { email, redirectTo: "/" });
            }}
          >
            <div className="space-y-1">
              <Label>Email (dev login)</Label>
              <Input
                type="email"
                name="email"
                defaultValue="estimator@simplyai.com.au"
                required
              />
              <p className="text-xs text-neutral-500">Allowed domain: @simplyai.com.au</p>
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
                defaultValue={previewDefaultEmail}
                required
              />
              <p className="text-xs text-neutral-500">
                {previewEmails.length > 0
                  ? `Allowed: ${previewEmails.join(", ")}`
                  : "Allowed domain: @simplyai.com.au"}
              </p>
            </div>
            <Button type="submit" variant="outline" className="w-full">
              Continue (preview)
            </Button>
          </form>
        ) : null}
        {!hasGoogle && !allowDev && !allowPreview ? (
          <p className="text-xs text-red-600">
            No auth providers configured. Set GOOGLE_CLIENT_ID, ALLOW_DEV_LOGIN, or PREVIEW_LOGIN_ALLOWED_EMAILS. Only @simplyai.com.au emails are accepted.
          </p>
        ) : null}
      </div>
    </div>
  );
}
