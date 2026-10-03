export interface MemoryUser { id: number; email: string; }
export type ComplaintStatus = "pending" | "completed";
export interface MemoryComplaint {
  id: number;
  user_id: number;
  category: string;
  department?: string | null;
  district?: string | null;
  city?: string | null;
  village?: string | null;
  description: string;
  location_text?: string | null;
  lat: number;
  lng: number;
  media_url?: string | null;
  status: ComplaintStatus;
  resolution_photo_url?: string | null;
  created_at: Date;
}

let users: MemoryUser[] = [];
let complaints: MemoryComplaint[] = [];
let userSeq = 1;
let complaintSeq = 1;

export function getOrCreateUserByEmail(email: string) {
  let u = users.find((x) => x.email === email);
  if (!u) {
    u = { id: userSeq++, email };
    users.push(u);
  }
  return u;
}

export function addComplaint(c: Omit<MemoryComplaint, "id" | "created_at" | "status" | "resolution_photo_url">) {
  const rec: MemoryComplaint = { id: complaintSeq++, created_at: new Date(), status: "pending", resolution_photo_url: null, ...c };
  complaints.unshift(rec);
  return rec;
}

export function listComplaintsByUser(userId: number) {
  return complaints.filter((c) => c.user_id === userId);
}

export function listAllPoints() {
  return complaints.map((c) => ({ lat: c.lat, lng: c.lng, category: c.category, department: c.department || null }));
}

export function resolveComplaint(id: number, photoUrl?: string | null) {
  const c = complaints.find((x) => x.id === id);
  if (!c) return null;
  c.status = "completed";
  if (photoUrl) c.resolution_photo_url = photoUrl;
  return c;
}

export function searchComplaintsByArea(q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return [] as MemoryComplaint[];
  return complaints.filter((c) => {
    return [c.district, c.city, c.village, c.location_text]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(s));
  });
}
