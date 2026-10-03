import { Link as RouterLink } from "react-router-dom";
import { Landmark, Map, ShieldCheck, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { useMe } from "@/hooks/use-me";
import { useSignOut } from "@/hooks/use-sign-out";
import { useState } from "react";

export default function SiteHeader({ onStart }: { onStart?: () => void }) {
  const { t, locale, setLocale } = useI18n();
  const { data } = useMe();
  const performSignOut = useSignOut();
  const authed = !!data?.user;
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await performSignOut({ message: t("sign_out_success") });
    } finally {
      setSigningOut(false);
    }
  };
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur border-b border-slate-200 text-black">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <RouterLink to="/" className="flex items-center gap-3 text-black">
          <div className="h-10 w-10 rounded-full bg-primary/90 grid place-items-center text-white shadow-sm">
            <Landmark className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-bold tracking-tight text-black">Samasya Nivaran</div>
            <div className="text-[11px] text-black/70">Government of Tamil Nadu</div>
          </div>
        </RouterLink>
        <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-black">
          <a className="hover:text-black/80 transition-colors" href="#features">{t("nav_features")}</a>
          <a className="hover:text-black/80 transition-colors" href="#complain">{t("nav_submit")}</a>
          <a className="hover:text-black/80 transition-colors" href="#heatmap">{t("nav_heatmap")}</a>
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center rounded-full border px-1 py-0.5 text-xs bg-black/5 border-slate-300">
            <button onClick={() => setLocale("en")} className={`px-2 py-1 rounded-full ${locale === "en" ? "bg-primary text-white" : "text-black"}`}>EN</button>
            <button onClick={() => setLocale("ta")} className={`px-2 py-1 rounded-full ${locale === "ta" ? "bg-primary text-white" : "text-black"}`}>தமிழ்</button>
          </div>
          <Button variant="ghost" asChild className="text-black">
            <a href="#heatmap" className="flex items-center gap-2"><Map className="h-4 w-4"/> {t("view_map")}</a>
          </Button>
          <Button variant="outline" asChild className="text-black border-slate-300">
            <RouterLink to="/officer-login" className="flex items-center gap-2"><Shield className="h-4 w-4"/> Officer</RouterLink>
          </Button>
          {!authed ? (
            <Button asChild className="bg-primary/90 hover:bg-primary text-white">
              <a href="#complain" onClick={onStart}><ShieldCheck className="mr-2 h-4 w-4"/> {t("get_started")}</a>
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              {data?.user?.email && (
                <span className="hidden sm:inline text-sm font-semibold text-black/70" title={data.user.email}>
                  {data.user.email}
                </span>
              )}
              <Button
                variant="outline"
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex items-center gap-2 bg-white/60 border-slate-300 text-black hover:bg-white"
              >
                <LogOut className="h-4 w-4"/> {t("sign_out")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
