import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { MapContainer, TileLayer, useMap, Marker } from "react-leaflet";
import { useMe } from "@/hooks/use-me";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { Camera, Droplets, Recycle, ShieldCheck, LocateFixed, Mic, Square, Trash2, X } from "lucide-react";
import { useI18n } from "@/i18n";

const AnyMapContainer = MapContainer as any;

const INDIA_BOUNDS: [[number, number], [number, number]] = [[8.4, 68.7],[35.5, 97.4]];
const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
const INDIA_POLY: [number, number][] = [
  [35.50, 74.00],[35.40, 75.00],[35.30, 76.50],[35.00, 77.50],[34.50, 77.80],
  [33.70, 78.50],[33.00, 79.20],[32.20, 79.50],[31.50, 80.00],[30.80, 80.50],
  [29.90, 81.00],[28.90, 81.50],[27.90, 82.00],[26.90, 82.30],[25.90, 82.50],
  [24.90, 82.20],[23.90, 81.80],[22.90, 81.20],[21.90, 80.60],[21.00, 79.80],
  [20.10, 79.10],[19.20, 78.50],[18.30, 78.00],[17.40, 77.50],[16.50, 77.20],
  [15.60, 77.00],[14.70, 76.90],[13.80, 77.00],[12.90, 77.20],[12.00, 77.50],
  [11.10, 78.00],[10.20, 78.50],[9.30, 79.00],[8.40, 79.50],[8.40, 80.50],
  [8.50, 81.50],[8.70, 82.50],[8.90, 83.50],[9.10, 84.50],[9.30, 85.50],
  [9.50, 86.50],[9.70, 87.50],[9.90, 88.50],[10.10, 89.50],[10.30, 90.50],
  [10.50, 91.50],[10.70, 92.50],[10.90, 93.50],[11.10, 94.50],[11.30, 95.50],
  [11.50, 96.50],[11.70, 97.40],[12.00, 97.40],[13.00, 97.00],[14.00, 96.50],
  [15.00, 96.00],[16.00, 95.50],[17.00, 95.00],[18.00, 94.50],[19.00, 94.20],
  [20.00, 94.00],[21.00, 94.20],[22.00, 94.50],[23.00, 95.00],[24.00, 95.50],
  [25.00, 96.00],[26.00, 96.50],[27.00, 97.00],[28.00, 97.30],[29.00, 97.40],
  [30.00, 97.20],[31.00, 96.80],[32.00, 96.20],[33.00, 95.50],[34.00, 94.80],
  [35.00, 94.00],[35.50, 93.00],[35.50, 92.00],[35.50, 91.00],[35.50, 90.00],
  [35.50, 89.00],[35.50, 88.00],[35.50, 87.00],[35.50, 86.00],[35.50, 85.00],
  [35.50, 84.00],[35.50, 83.00],[35.50, 82.00],[35.50, 81.00],[35.50, 80.00],
  [35.50, 79.00],[35.50, 78.00],[35.50, 77.00],[35.50, 76.00],[35.50, 75.00],
  [35.50, 74.00],
];

function HighlightIndia() {
  const map = useMap();
  useEffect(() => {
    const poly = L.polygon(INDIA_POLY as any, {
      color: "#a855f7",
      weight: 2,
      fill: true,
      fillOpacity: 0.08,
      fillColor: "#a855f7",
      interactive: false,
    }).addTo(map);
    return () => { poly.remove(); };
  }, [map]);
  return null;
}

function Section({ id, children, className = "" }: { id?: string; children: any; className?: string }) {
  return (
    <section id={id} className={`py-10 md:py-16 ${className}`}>
      <div className="container mx-auto px-4">{children}</div>
    </section>
  );
}

function Hero({ onStart }: { onStart: () => void }) {
  const { t } = useI18n();
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-transparent"/>
      <Section>
        <div className="relative grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-flex items-center rounded-full bg-white/80 text-black px-3 py-1 text-xs font-semibold ring-1 ring-white/70">{t("brand_tag")}</span>
            <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-fuchsia-600 via-rose-500 to-cyan-600 bg-clip-text text-transparent">
              {t("hero_title")}
            </h1>
            <p className="mt-4 text-black text-lg max-w-prose">
              {t("hero_sub")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={onStart} size="lg" className="shadow">
                <ShieldCheck className="mr-2 h-4 w-4"/> {t("get_started")}
              </Button>
              <a href="#heatmap" className="inline-flex items-center font-semibold text-black hover:text-black/80 transition-transform hover:translate-x-0.5 hover:underline underline-offset-4">{t("view_heatmap")} →</a>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
              <CategoryBadge icon={<Recycle className="h-5 w-5"/>} label={t("cat_garbage")} onClick={()=>{ const url = new URL(window.location.href); url.searchParams.set('category','garbage'); history.pushState({},'',url.toString()); document.getElementById('complain')?.scrollIntoView({ behavior: 'smooth' }); }}/>
              <CategoryBadge icon={<Droplets className="h-5 w-5"/>} label={t("cat_water")} onClick={()=>{ const url = new URL(window.location.href); url.searchParams.set('category','water'); history.pushState({},'',url.toString()); document.getElementById('complain')?.scrollIntoView({ behavior: 'smooth' }); }}/>
              <CategoryBadge icon={<Camera className="h-5 w-5"/>} label={t("cat_roads")} onClick={()=>{ const url = new URL(window.location.href); url.searchParams.set('category','roads'); history.pushState({},'',url.toString()); document.getElementById('complain')?.scrollIntoView({ behavior: 'smooth' }); }}/>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl border bg-white shadow-sm p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <h3 className="text-lg font-semibold">{t("report_easy")}</h3>
                <p className="text-sm text-muted-foreground">Fast, secure OTP login. Submit with photos, voice, and precise location.</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 flex items-center gap-3">
                <span className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center"><Camera className="h-4 w-4"/></span>
                <div>
                  <div className="text-sm font-bold flex"><p><strong>{t("roads")}</strong></p></div>
                  <div className="text-xs text-black font-black"><p><strong>{t("roads_sub")}</strong></p></div>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 flex items-center gap-3">
                <span className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center"><Droplets className="h-4 w-4"/></span>
                <div>
                  <div className="text-sm font-medium"><p><strong>{t("water")}</strong></p></div>
                  <div className="text-xs text-black"><p><strong>{t("water_sub")}</strong></p></div>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 flex items-center gap-3">
                <span className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center"><Recycle className="h-4 w-4"/></span>
                <div>
                  <div className="text-sm font-medium"><p><strong>{t("garbage")}</strong></p></div>
                  <div className="text-xs text-black"><p><strong>{t("garbage_sub")}</strong></p></div>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 flex items-center gap-3">
                <span className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center"><ShieldCheck className="h-4 w-4"/></span>
                <div>
                  <div className="text-sm font-medium"><p><strong>{t("secure_title")}</strong></p></div>
                  <div className="text-xs text-black"><p><strong>{t("secure_sub")}</strong></p></div>
                </div>
              </div>
            </div>
            <p className="text-sm text-black mt-3">Secure OTP-based sign-in. Your data is protected.</p>
          </div>
        </div>
      </Section>
    </div>
  );
}

function CategoryBadge({ icon, label, onClick }: { icon: any; label: string; onClick?: ()=>void }) {
  return (
    <button type="button" onClick={onClick} className="group flex items-center gap-2 rounded-xl border bg-white px-3 py-2 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-fuchsia-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-400">
      <span className="text-primary transition-transform group-hover:scale-110">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function AuthCard() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { data } = useMe();

  const request = async () => {
    if (isRequesting) return;
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,24}$/i.test(email)) {
      toast.error(t("invalid_email"));
      return;
    }
    setIsRequesting(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok) {
        setCodeSent(true);
        setCode("");
        toast.success(t("otp_sent"));
        if (payload?.demo && payload?.code) {
          toast.message(`${t("demo_otp")}${payload.code}`);
        }
      } else {
        toast.error((payload as any)?.error || t("failed_sending_otp"));
      }
    } catch {
      toast.error(t("unable_send_otp"));
    } finally {
      setIsRequesting(false);
    }
  };

  const verify = async () => {
    if (isVerifying) return;
    if (!codeSent) {
      toast.error(t("request_otp_first"));
      return;
    }
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      toast.error(t("enter_6_digit_otp"));
      return;
    }
    setIsVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: trimmed }),
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok) {
        if ((payload as any)?.token) {
          localStorage.setItem("token", (payload as any).token as string);
        }
        toast.success(t("signed_in_successfully"));
        setCode("");
        setCodeSent(false);
        await qc.invalidateQueries({ queryKey: ["me"] });
        await qc.refetchQueries({ queryKey: ["me"] });
        document.getElementById("complain")?.scrollIntoView({ behavior: "smooth" });
      } else {
        toast.error((payload as any)?.error || t("invalid_code"));
      }
    } catch {
      toast.error(t("unable_verify_otp"));
    } finally {
      setIsVerifying(false);
    }
  };

  if (data?.user) return null;

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>{t("sign_in_with_otp")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("placeholder_email")}
            autoComplete="email"
          />
        </div>
        {codeSent && (
          <div className="space-y-1">
            <Label htmlFor="code">{t("enter_otp")}</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder={t("placeholder_otp")}
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
            />
            <p className="text-xs text-muted-foreground">
              {t("enter_otp")} {email ? `→ ${email}` : ""}
            </p>
          </div>
        )}
        <div className="flex gap-2">
          {!codeSent ? (
            <Button
              onClick={request}
              disabled={isRequesting}
              className="bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-white"
            >
              {isRequesting ? `${t("send_otp")}...` : t("send_otp")}
            </Button>
          ) : (
            <Button
              onClick={verify}
              disabled={isVerifying}
              className="bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-white"
            >
              {isVerifying ? `${t("verify_signin")}...` : t("verify_signin")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ComplaintForm() {
  const { t } = useI18n();
  const { data } = useMe();
  const [category, setCategory] = useState("roads");
  const [department, setDepartment] = useState("PWD");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [village, setVillage] = useState("");
  const [description, setDescription] = useState("");
  const [descLang, setDescLang] = useState<"en"|"ta">("en");
  const [dictating, setDictating] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [locationText, setLocationText] = useState("");

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
    };
  }, []);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [locating, setLocating] = useState(false);
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const selectedLocation = useMemo(() => (lat == null || lng == null ? null : { lat, lng }), [lat, lng]);

  const translate = async (text: string, source: 'en'|'ta', target: 'en'|'ta') => {
    try {
      if (!text.trim()) return text;
      const res = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ q: text, source, target, format: 'text' }),
      });
      const j = await res.json().catch(()=>null);
      return (j && (j.translatedText || j.translated_text)) || text;
    } catch {
      return text;
    }
  };

  useEffect(() => {
    const apply = () => {
      const sp = new URLSearchParams(window.location.search);
      const cat = sp.get('category');
      const allowed = ['roads','water','garbage','electricity','sewage','streetlight','sanitation','traffic','health','other'];
      if (cat && allowed.includes(cat)) setCategory(cat);
    };
    apply();
    const onPop = () => apply();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const useMyLocation = async () => {
    if (!("geolocation" in navigator)) {
      toast.error(t("geolocation_unsupported"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        try {
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const j = await resp.json();
          if (j?.display_name) setLocationText(j.display_name);
        } catch {}
        setLocating(false);
        toast.success("Location set");
      },
      (err) => {
        setLocating(false);
        toast.error(err.message || t("unable_get_location"));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(url);
        const voiceFile = new File([blob], "voice-note.webm", { type: "audio/webm" });
        setFile(voiceFile);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      setRec(mr);
      setRecording(true);
      toast.message(t("recording"));
    } catch (e: any) {
      toast.error(t("microphone_denied"));
    }
  };

  const stopRecording = () => {
    if (rec && recording) {
      rec.stop();
      setRecording(false);
      setRec(null);
    }
  };

  const clearVoice = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    if (file && file.name === "voice-note.webm") setFile(null);
  };

  const submit = async () => {
    if (!data?.user) return toast.error(t("sign_in_first"));
    if (!category || !description || lat == null || lng == null) return toast.error(t("fill_required_fields"));
    const form = new FormData();
    form.set("category", category);
    form.set("description", description);
    form.set("department", department);
    form.set("district", district || "");
    form.set("city", city || "");
    form.set("village", village || "");
    if (locationText) form.set("location_text", locationText);
    form.set("lat", String(lat));
    form.set("lng", String(lng));
    if (file) form.set("media", file);

    const token = localStorage.getItem("token");
    const res = await fetch("/api/complaints", { method: "POST", body: form, headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    if (res.ok) {
      toast.success(t("btn_submit"));
      setDescription("");
      setLocationText("");
      setFile(null);
    } else {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error || t("failed_submit"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("submit_complaint")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("category")}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder={t("category")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="roads">{t("roads")}</SelectItem>
                <SelectItem value="water">{t("water")}</SelectItem>
                <SelectItem value="garbage">{t("garbage")}</SelectItem>
                <SelectItem value="electricity">{t("cat_electricity")}</SelectItem>
                <SelectItem value="sewage">{t("cat_sewage")}</SelectItem>
                <SelectItem value="streetlight">{t("cat_streetlight")}</SelectItem>
                <SelectItem value="sanitation">{t("category")}</SelectItem>
                <SelectItem value="traffic">{t("cat_traffic")}</SelectItem>
                <SelectItem value="health">{t("cat_health")}</SelectItem>
                <SelectItem value="other">{t("cat_other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("department_label")}</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder={t("department_label")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PWD">{t("dept_pwd")}</SelectItem>
                <SelectItem value="Water">{t("dept_water")}</SelectItem>
                <SelectItem value="Sanitation">{t("dept_sanitation")}</SelectItem>
                <SelectItem value="Electricity">{t("dept_electricity")}</SelectItem>
                <SelectItem value="Traffic">{t("dept_traffic")}</SelectItem>
                <SelectItem value="Health">{t("dept_health")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("district_label")}</Label>
            <Input value={district} onChange={(e)=>setDistrict(e.target.value)} placeholder={t("placeholder_district")} />
          </div>
          <div className="space-y-2">
            <Label>{t("city_label")}</Label>
            <Input value={city} onChange={(e)=>setCity(e.target.value)} placeholder={t("placeholder_city")} />
          </div>
          <div className="space-y-2">
            <Label>{t("village_label")}</Label>
            <Input value={village} onChange={(e)=>setVillage(e.target.value)} placeholder={t("placeholder_village")} />
          </div>
          <div className="space-y-2">
            <Label>{t("location_desc")}</Label>
            <Input value={locationText} onChange={(e) => setLocationText(e.target.value)} placeholder={t("placeholder_location")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label>{t("description")}</Label>
              <div className="flex items-center gap-1 text-xs">
                <button type="button" className={`px-2 py-1 rounded transition-all hover:opacity-90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 ${descLang==='en'?"bg-primary text-white":"bg-muted"}`} onClick={async()=>{ if (descLang!== 'en' && description.trim()) { toast.message('Translating…'); const t = await translate(description,'ta','en'); setDescription(t); } setDescLang('en'); }}>EN</button>
                <button type="button" className={`px-2 py-1 rounded transition-all hover:opacity-90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 ${descLang==='ta'?"bg-primary text-white":"bg-muted"}`} onClick={async()=>{ if (descLang!== 'ta' && description.trim()) { toast.message('மொழிபெய���்ப்பு…'); const t = await translate(description,'en','ta'); setDescription(t); } setDescLang('ta'); }}>தமிழ்</button>
                <Button type="button" variant="secondary" className="h-7 ml-2" onClick={()=>{
                  const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                  if (!SR) { toast.error('Speech Recognition not supported'); return; }
                  if (dictating) { recognitionRef.current?.stop?.(); return; }
                  const rec = new SR();
                  recognitionRef.current = rec;
                  rec.lang = descLang === 'ta' ? 'ta-IN' : 'en-IN';
                  rec.continuous = false; rec.interimResults = false;
                  rec.onresult = (e: any)=>{ const text = e.results[0][0].transcript; setDescription(prev=> (prev? prev+ ' ' : '') + text); setDictating(false); recognitionRef.current = null; };
                  rec.onerror = ()=>{ setDictating(false); recognitionRef.current = null; };
                  rec.onend = ()=>{ setDictating(false); recognitionRef.current = null; };
                  rec.start(); setDictating(true);
                }}>{dictating ? t("dictate_listening") : t("dictate")}</Button>
              </div>
            </div>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("placeholder_description_en")} rows={4} lang={descLang}/>
          </div>
          <div className="space-y-2">
            <Label>{t("proof_optional")}</Label>
            <div className="flex flex-wrap gap-2 items-center">
              <Input type="file" accept="image/*,audio/*,video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {!recording ? (
                <Button type="button" variant="secondary" onClick={startRecording} className="h-10"><Mic className="h-4 w-4 mr-2"/> {t("record_voice")}</Button>
              ) : (
                <Button type="button" variant="destructive" onClick={stopRecording} className="h-10"><Square className="h-4 w-4 mr-2"/> {t("stop")}</Button>
              )}
              {audioUrl && (
                <Button type="button" variant="ghost" onClick={clearVoice} className="h-10"><Trash2 className="h-4 w-4 mr-2"/> {t("remove")}</Button>
              )}
            </div>
            {audioUrl && (
              <audio controls src={audioUrl} className="mt-2 w-full" />
            )}
          </div>
          <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{t("select_location")}</Label>
            <Button type="button" variant="secondary" onClick={useMyLocation} disabled={locating} className="h-8 px-2 text-xs">
              <LocateFixed className="h-3.5 w-3.5 mr-1" /> {locating ? "Locating..." : t("use_my_location")}
            </Button>
          </div>
          <div className="h-56 rounded-md overflow-hidden border">
            <PickLocation value={selectedLocation} onPick={(p) => { setLat(p.lat); setLng(p.lng); }} />
          </div>
          <p className="text-xs text-muted-foreground">{t("selected")}: {lat?.toFixed(5)}, {lng?.toFixed(5)}</p>
        </div>
        </div>
        <Button onClick={submit}>{t("btn_submit")}</Button>
      </CardContent>
    </Card>
  );
}

function PickLocation({ value, onPick }: { value: { lat: number; lng: number } | null; onPick: (p: { lat: number; lng: number }) => void }) {
  return (
    <AnyMapContainer bounds={INDIA_BOUNDS} center={value ?? INDIA_CENTER} zoom={4} minZoom={4} maxZoom={18} maxBounds={INDIA_BOUNDS} maxBoundsViscosity={1.0} style={{ height: "100%", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapSelectionController value={value} />
      <MapClicker onPick={onPick} />
      {value && <Marker position={value} />}
    </AnyMapContainer>
  );
}

function MapSelectionController({ value }: { value: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!value) return;
    const zoom = map.getZoom();
    map.flyTo(value, zoom < 14 ? 14 : zoom, { duration: 0.75 });
  }, [map, value]);
  return null;
}

function MapClicker({ onPick }: { onPick: (p: { lat: number; lng: number }) => void }) {
  const map = useMap();
  useEffect(() => {
    const handler = (e: any) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    map.on("click", handler);
    return () => { map.off("click", handler); };
  }, [map, onPick]);
  return null;
}

function PhotoModal({ isOpen, imageUrl, onClose, alt = "Photo" }: { isOpen: boolean; imageUrl: string | null; onClose: () => void; alt?: string }) {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-4xl max-h-screen" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 transition"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
        <img src={imageUrl} alt={alt} className="max-w-full max-h-screen object-contain rounded-lg" />
      </div>
    </div>
  );
}

function Heatmap() {
  const { t } = useI18n();
  const [dept, setDept] = useState<string | null>(null);
  const { data } = useQuery<{ points: { lat: number; lng: number; category?: string; department?: string | null }[] }>({
    queryKey: ["heatmap"],
    queryFn: async () => {
      const res = await fetch("/api/complaints/heatmap");
      if (!res.ok) {
        throw new Error(`Failed to fetch heatmap: ${res.status}`);
      }
      return res.json();
    },
    refetchInterval: 15000,
  });

  const positions = useMemo(() => {
    const pts = (data?.points || []).filter(p => !dept || p.department === dept);
    return pts.map(p => [p.lat, p.lng, 1] as [number, number, number]);
  }, [data, dept]);

  function HeatLayer() {
    const map = useMap();
    useEffect(() => {
      if (!positions.length) return;
      // @ts-ignore
      const heat = (L as any).heatLayer(positions, { radius: 20, blur: 15, maxZoom: 12 }).addTo(map);
      return () => {
        heat.remove();
      };
    }, [map, positions]);
    return null;
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2 text-sm">
        <button onClick={()=>setDept(null)} className={`px-2 py-1 rounded border transition-all hover:-translate-y-0.5 hover:shadow-sm active:scale-95 ${!dept?'bg-primary text-white':''}`}>{t("all")}</button>
        {['PWD','Water','Sanitation','Electricity','Traffic','Health'].map(d=> {
          const deptKeys = { 'PWD': 'dept_pwd', 'Water': 'dept_water', 'Sanitation': 'dept_sanitation', 'Electricity': 'dept_electricity', 'Traffic': 'dept_traffic', 'Health': 'dept_health' };
          return <button key={d} onClick={()=>setDept(d)} className={`px-2 py-1 rounded border transition-all hover:-translate-y-0.5 hover:shadow-sm active:scale-95 ${dept===d?'bg-primary text-white':''}`}>{t(deptKeys[d as keyof typeof deptKeys])}</button>;
        })}
      </div>
      <div className="h-[420px] rounded-xl overflow-hidden border">
        <AnyMapContainer bounds={INDIA_BOUNDS} center={INDIA_CENTER} zoom={4} minZoom={4} maxZoom={18} maxBounds={INDIA_BOUNDS} maxBoundsViscosity={1.0} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <HeatLayer />
        </AnyMapContainer>
      </div>
    </div>
  );
}

function IndexContent() {
  const { t } = useI18n();
  const { data } = useMe();
  const onStart = () => {
    document.getElementById("complain")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <Hero onStart={onStart} />

      <Section id="features" className="bg-transparent">
        <div className="grid md:grid-cols-3 gap-6">
          <Feature title={t("feature_auth")} desc="Email-based verification keeps accounts secure without passwords."/>
          <Feature title={t("feature_submit")} desc="Attach photos, audio, or videos as proof along with precise location."/>
          <Feature title={t("feature_heatmap")} desc="Visualize complaint density and identify hotspots across the city."/>
        </div>
      </Section>

      <Section id="complain" className="bg-transparent">
        {data?.user ? (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <ComplaintForm />
              <MyComplaints />
            </div>
            <AreaSearch />
          </div>
        ) : (
          <AuthCard />
        )}
      </Section>

      <Section id="heatmap" className="bg-transparent">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">{t("heatmap_title")}</h2>
          <p className="text-muted-foreground">{t("heatmap_sub")}</p>
        </div>
        <Heatmap />
      </Section>

      <footer className="py-10 text-center text-sm font-bold text-black">© {new Date().getFullYear()} Samasya Nivaran</footer>
    </div>
  );
}

export default function Index() {
  return <IndexContent />;
}

function StatusBadge({ status }: { status?: string | null }) {
  const { t } = useI18n();
  if (status === 'completed') return <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5">{t("completed")}</span>;
  return <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">{t("pending")}</span>;
}

function MyComplaints() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const { data } = useQuery<{ complaints: { id:number; category:string; location_text?:string|null; created_at:string; department?:string|null; status?: string|null; resolution_photo_url?: string|null; media_url?: string|null; district?:string|null; city?:string|null; village?:string|null }[] }>({
    queryKey:['my-complaints'],
    queryFn: async ()=>{
      const token = localStorage.getItem('token');
      const res = await fetch('/api/complaints', {
        headers: token? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      });
      return res.json();
    },
    refetchInterval: 10000,
  });

  return (
    <>
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>{t("my_complaints")}</CardTitle>
          <CardDescription>{t("sign_out_hint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[28rem] overflow-auto">
          {(data?.complaints||[]).map(c=> (
            <div key={c.id} className="p-3 border rounded-md transition-colors hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{c.category} {c.department? `• ${c.department}`: ''}</div>
                <StatusBadge status={c.status || 'pending'} />
              </div>
              <div className="text-xs text-muted-foreground">{[c.district,c.city,c.village].filter(Boolean).join(' • ') || c.location_text || 'No location'}</div>
              <div className="text-xs mt-1 text-muted-foreground">{new Date(c.created_at as any).toLocaleString()}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {c.media_url && (
                  <button
                    onClick={() => setSelectedPhoto(c.media_url || null)}
                    className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition"
                  >
                    <Camera className="h-3 w-3" /> {t("view_submission")}
                  </button>
                )}
                {c.status==='completed' && c.resolution_photo_url && (
                  <button
                    onClick={() => setSelectedPhoto(c.resolution_photo_url || null)}
                    className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-100 transition"
                  >
                    <Camera className="h-3 w-3" /> {t("view_resolution")}
                  </button>
                )}
              </div>
            </div>
          ))}
          {(!data || data.complaints?.length===0) && <div className="text-sm text-muted-foreground">{t("no_complaints_yet")}</div>}
        </CardContent>
      </Card>
      <PhotoModal isOpen={!!selectedPhoto} imageUrl={selectedPhoto} onClose={() => setSelectedPhoto(null)} alt="Complaint photo" />
    </>
  );
}

function AreaSearch() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [officerMode, setOfficerMode] = useState<boolean>(() => localStorage.getItem('officerMode') === '1');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const { data, refetch, isFetching } = useQuery<{ query: string; complaints: any[]; counts: { pending: number; completed: number } }>({
    queryKey: ['area-search', query],
    queryFn: async ()=>{
      if (!query.trim()) return { query, complaints: [], counts: { pending: 0, completed: 0 } } as any;
      const res = await fetch(`/api/complaints/search?q=${encodeURIComponent(query)}`, {
        headers: token? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      });
      return res.json();
    },
    enabled: !!token,
  });

  useEffect(()=>{ localStorage.setItem('officerMode', officerMode ? '1' : '0'); },[officerMode]);

  const onResolve = async (id: number, file?: File | null) => {
    const form = new FormData();
    if (file) form.set('photo', file);
    const res = await fetch(`/api/complaints/${id}/resolve`, {
      method: 'POST',
      body: form,
      headers: token? { Authorization: `Bearer ${token}` } : undefined,
      credentials: "include",
    });
    if (res.ok) {
      toast.success(t('marked_completed'));
      await Promise.all([
        (qc.invalidateQueries as any)({ queryKey: ['area-search'] }),
        (qc.invalidateQueries as any)({ queryKey: ['my-complaints'] }),
      ]);
    } else {
      const j = await res.json().catch(()=>({}));
      toast.error(j.error || t('failed_submit'));
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("search_area_title")}</CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="officer-mode">{t("officer_mode")}</Label>
            <Switch id="officer-mode" checked={officerMode} onCheckedChange={setOfficerMode} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder={t("search_area_placeholder")} />
            <Button onClick={()=>refetch()} disabled={isFetching}>{t("search")}</Button>
          </div>
          {data && data.query.trim() && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>{t("pending")}: <span className="font-bold text-amber-600">{data.counts.pending}</span></div>
              <div>{t("completed")}: <span className="font-bold text-emerald-600">{data.counts.completed}</span></div>
            </div>
          )}
          <div className="space-y-3 max-h-[20rem] overflow-auto">
            {(data?.complaints||[]).map(c=> (
              <div key={c.id} className="p-3 border rounded-md transition-colors hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{c.category} {c.department? `• ${c.department}`: ''}</div>
                  <StatusBadge status={c.status || 'pending'} />
                </div>
                <div className="text-xs text-muted-foreground">{[c.district,c.city,c.village].filter(Boolean).join(' • ') || c.location_text || 'No location'}</div>
                <div className="text-xs mt-1 text-muted-foreground">{new Date(c.created_at as any).toLocaleString()}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.media_url && (
                    <button
                      onClick={() => setSelectedPhoto(c.media_url || null)}
                      className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition"
                    >
                      <Camera className="h-3 w-3" /> {t("view_submission")}
                    </button>
                  )}
                  {c.status==='completed' && c.resolution_photo_url && (
                    <button
                      onClick={() => setSelectedPhoto(c.resolution_photo_url || null)}
                      className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-100 transition"
                    >
                      <Camera className="h-3 w-3" /> {t("view_resolution")}
                    </button>
                  )}
                </div>
                {officerMode && c.status === 'pending' && (
                  <div className="mt-2 flex gap-2">
                    <Input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file) onResolve(c.id, file);
                    }} className="h-8 text-xs" />
                    <Button size="sm" onClick={()=>onResolve(c.id)}>{t("mark_completed")}</Button>
                  </div>
                )}
              </div>
            ))}
            {(!data || data.complaints?.length===0) && <div className="text-sm text-muted-foreground">{t("no_complaints_area")}</div>}
          </div>
        </CardContent>
      </Card>
      <PhotoModal isOpen={!!selectedPhoto} imageUrl={selectedPhoto} onClose={() => setSelectedPhoto(null)} alt="Complaint photo" />
    </>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-6 border rounded-lg shadow-sm bg-white">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  );
}
