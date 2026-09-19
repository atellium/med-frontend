"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import MobileHeader from "@/components/layout/MobileHeader";
import { getCategories, matchesCategoryPrefix } from "@/features/categories";
import type { CategorySearchItem } from "@/features/categories";
import { getDoctorBySlug, getProviderNameBySlug } from "@/features/providers/provider.service";
import type { DoctorListItem, DoctorSpecialty } from "@/features/providers/provider.types";
import { compressImage } from "@/lib/compress-image";
import { createDoctor, updateDoctor, updateDoctorProfileImage } from "../profile.service";
import type { DoctorSchedulePayload, DoctorUpsertPayload } from "../profile.types";

const inputClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-foreground outline-none focus:border-brand";
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
type ScheduleDraft = { id: string; schedule_type: DoctorSchedulePayload["schedule_type"]; weekday: string; week_of_month: string; day_of_month: string; consultation_type: string; start_time: string; end_time: string; is_active: boolean };

function createDraftId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptySchedule(): ScheduleDraft {
  return { id: createDraftId(), schedule_type: "weekly", weekday: "0", week_of_month: "1", day_of_month: "1", consultation_type: "", start_time: "", end_time: "", is_active: true };
}

export function DoctorEditorScreen({ providerSlug, catalogSlug }: { providerSlug: string; catalogSlug?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const editing = Boolean(catalogSlug);
  const provider = useQuery({ queryKey: ["provider", "public-details", providerSlug], queryFn: () => getProviderNameBySlug(providerSlug) });
  const detail = useQuery({ queryKey: ["doctor", "detail", catalogSlug], queryFn: () => getDoctorBySlug(catalogSlug!), enabled: editing });
  const [initialized, setInitialized] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState<DoctorSpecialtyOption[]>([]);
  const [qualification, setQualification] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [registrationCouncil, setRegistrationCouncil] = useState("");
  const [registrationYear, setRegistrationYear] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [profileImageError, setProfileImageError] = useState<string | null>(null);
  const [treatments, setTreatments] = useState("");
  const [languages, setLanguages] = useState("");
  const [schedules, setSchedules] = useState<ScheduleDraft[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!detail.data || initialized) return;
    const doctor = detail.data;
    queueMicrotask(() => {
      setName(doctor.name);
      setBio(doctor.bio ?? "");
      setSpecialties((doctor.specialties ?? []).map(specialtyToCatalogCategory));
      setQualification(doctor.qualification ?? "");
      setRegistrationNumber(doctor.registration_number ?? "");
      setRegistrationCouncil(doctor.registration_council ?? "");
      setRegistrationYear(doctor.registration_year ? String(doctor.registration_year) : "");
      setConsultationFee(formatFeeInputValue(doctor.consultation_fee));
      setTreatments((doctor.treatments ?? []).join(", "));
      setLanguages((doctor.languages ?? []).join(", "));
      setSchedules(scheduleDraftsFromDoctor(doctor));
      setIsActive(doctor.is_active !== false);
      setInitialized(true);
    });
  }, [detail.data, initialized]);

  useEffect(() => () => {
    if (profileImagePreview) URL.revokeObjectURL(profileImagePreview);
  }, [profileImagePreview]);

  const save = useMutation({
    mutationFn: async (payload: DoctorUpsertPayload) => {
      if (!provider.data?.id) throw new Error("Provider not loaded.");
      const response = editing ? await updateDoctor(provider.data.id, detail.data!.id, payload) : await createDoctor(provider.data.id, payload);
      if (profileImage) {
        const doctorId = editing ? detail.data!.id : doctorIdFromResponse(response);
        if (!doctorId) throw new Error("Doctor was saved, but no doctor id was returned for image upload.");
        await updateDoctorProfileImage(provider.data.id, doctorId, profileImage);
      }
      return response;
    },
    onSuccess: async () => {
      setIsRedirecting(true);
      await queryClient.invalidateQueries({ queryKey: ["provider", providerSlug, "doctors"] });
      router.replace(`/${encodeURIComponent(providerSlug)}/manage/doctors`);
    },
    onError: () => {
      setIsRedirecting(false);
    },
  });
  const isBusy = save.isPending || isRedirecting || provider.isPending;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (isBusy) return;
    if (!name.trim()) return setError("Doctor name is required.");
    if (specialties.length === 0) return setError("Select at least one specialty.");
    if (!qualification.trim()) return setError("Qualification is required.");
    const fee = consultationFee.trim() ? Number(consultationFee) : null;
    if (fee !== null && (!Number.isFinite(fee) || fee < 0)) return setError("Enter a valid consultation fee.");
    const year = registrationYear.trim() ? Number(registrationYear) : null;
    if (year !== null && (!Number.isInteger(year) || year < 1900)) return setError("Enter a valid registration year.");
    const schedulePayload = schedules.map(toSchedulePayload);
    setError(null);
    const payload: DoctorUpsertPayload = {
      name: name.trim(),
      specialty_ids: specialties.map((item) => item.id),
      is_active: isActive,
    };
    payload.qualification = qualification.trim();
    addIfPresent(payload, "registration_number", registrationNumber.trim());
    addIfPresent(payload, "registration_council", registrationCouncil.trim());
    if (year !== null) payload.registration_year = year;
    if (fee !== null) payload.consultation_fee = fee.toFixed(2);
    addIfPresent(payload, "bio", bio.trim());
    const languageList = splitList(languages);
    if (languageList.length > 0) payload.languages = languageList;
    const treatmentList = splitList(treatments);
    if (treatmentList.length > 0) payload.treatments = treatmentList;
    if (schedulePayload.length > 0) payload.schedules = schedulePayload;
    save.mutate(payload, { onError: () => setError(`Unable to ${editing ? "update" : "add"} doctor.`) });
  }

  async function selectProfileImage(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    try {
      const compressed = await compressImage(selected, { maxWidth: 400, quality: 0.95 });
      if (profileImagePreview) URL.revokeObjectURL(profileImagePreview);
      setProfileImage(compressed);
      setProfileImagePreview(URL.createObjectURL(compressed));
      setProfileImageError(null);
    } catch (compressionError) {
      setProfileImageError(compressionError instanceof Error ? compressionError.message : "Unable to prepare the selected image.");
    }
  }

  function clearProfileImage() {
    if (profileImagePreview) URL.revokeObjectURL(profileImagePreview);
    setProfileImage(null);
    setProfileImagePreview(null);
    setProfileImageError(null);
  }

  if (editing && detail.isPending) return <div className="min-h-dvh bg-slate-50"><MobileHeader title="Edit Doctor" subtitle={provider.data?.name ?? "Loading provider..."} /><p className="py-12 text-center text-sm text-foreground-muted">Loading doctor...</p></div>;
  if (editing && detail.isError) return <div className="min-h-dvh bg-slate-50"><MobileHeader title="Edit Doctor" subtitle={provider.data?.name} /><p className="py-12 text-center text-sm font-semibold text-danger">Doctor not found.</p></div>;

  return <div className="min-h-dvh bg-slate-50 pb-10"><MobileHeader title={editing ? "Edit Doctor" : "Add Doctor"} subtitle={provider.data?.name ?? "Loading provider..."} /><form onSubmit={submit} className="mx-auto w-full max-w-3xl space-y-4 px-page pt-5">
    <FormCard title="Doctor details"><Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter doctor name" className={inputClass} /></Field><Field label="Qualification"><input value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="MBBS, MD (Medicine)" className={inputClass} /></Field><ProfileImagePicker source={profileImagePreview ?? detail.data?.profile_image ?? null} hasNewImage={Boolean(profileImage)} error={profileImageError} disabled={isBusy} onSelect={selectProfileImage} onClear={clearProfileImage} /><Field label="Bio"><textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short profile summary" rows={4} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-normal outline-none focus:border-brand" /></Field></FormCard>
    <SpecialtyPicker selected={specialties} onChange={setSpecialties} />
    <FormCard title="Professional details"><Field label="Registration number"><input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} placeholder="WBMC-12345" className={inputClass} /></Field><Field label="Registration council"><input value={registrationCouncil} onChange={(e) => setRegistrationCouncil(e.target.value)} placeholder="West Bengal Medical Council" className={inputClass} /></Field><Field label="Registration year"><input inputMode="numeric" maxLength={4} value={registrationYear} onChange={(e) => setRegistrationYear(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="2018" className={inputClass} /></Field></FormCard>
    <FormCard title="Consultation"><Field label="Consultation fee"><input type="number" min="0" step="0.01" value={consultationFee} onChange={(e) => setConsultationFee(e.target.value)} placeholder="900" className={inputClass} /></Field></FormCard>
    <ScheduleEditor schedules={schedules} onChange={setSchedules} />
    <FormCard title="Treatments and languages"><Field label="Treatments"><textarea value={treatments} onChange={(e) => setTreatments(e.target.value)} placeholder="ECG, Heart checkup, Hypertension management" rows={3} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-normal outline-none focus:border-brand" /></Field><Field label="Languages"><input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="English, Hindi, Bengali" className={inputClass} /></Field></FormCard>
    <FormCard title="Settings"><Toggle label="Active" checked={isActive} onChange={setIsActive} /></FormCard>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p>}
    <button type="submit" disabled={isBusy} className="h-12 w-full rounded-xl bg-brand text-sm font-extrabold text-white disabled:opacity-60">{isBusy ? "Saving..." : editing ? "Save changes" : "Add doctor"}</button>
  </form></div>;
}

function ScheduleEditor({ schedules, onChange }: { schedules: ScheduleDraft[]; onChange: (items: ScheduleDraft[]) => void }) {
  function updateSchedule(id: string, patch: Partial<ScheduleDraft>) {
    onChange(schedules.map((schedule) => schedule.id === id ? { ...schedule, ...patch } : schedule));
  }

  return <FormCard title="Schedule">
    {schedules.map((schedule) => <div key={schedule.id} className="space-y-3 rounded-xl border border-slate-100 p-3">
      <div className="grid grid-cols-[1fr_auto] gap-2"><select value={schedule.schedule_type} onChange={(e) => updateSchedule(schedule.id, { schedule_type: e.target.value as ScheduleDraft["schedule_type"] })} className={inputClass} aria-label="Schedule type"><option value="weekly">Weekly</option><option value="monthly_weekday">Monthly weekday</option><option value="monthly_date">Monthly date</option></select><button type="button" onClick={() => onChange(schedules.filter((item) => item.id !== schedule.id))} aria-label="Remove schedule" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-danger"><i className="fa-solid fa-trash" /></button></div>
      {schedule.schedule_type !== "monthly_date" && <Field label="Weekday"><select value={schedule.weekday} onChange={(e) => updateSchedule(schedule.id, { weekday: e.target.value })} className={inputClass}>{weekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></Field>}
      {schedule.schedule_type === "monthly_weekday" && <Field label="Week of month"><select value={schedule.week_of_month} onChange={(e) => updateSchedule(schedule.id, { week_of_month: e.target.value })} className={inputClass}>{[1, 2, 3, 4, 5].map((week) => <option key={week} value={week}>{week}</option>)}</select></Field>}
      {schedule.schedule_type === "monthly_date" && <Field label="Day of month"><input type="number" min="1" max="31" value={schedule.day_of_month} onChange={(e) => updateSchedule(schedule.id, { day_of_month: e.target.value })} className={inputClass} /></Field>}
      <Field label="Consultation type"><select value={schedule.consultation_type} onChange={(e) => updateSchedule(schedule.id, { consultation_type: e.target.value })} className={inputClass}><option value="">Select consultation type</option><option value="appointment">Appointment</option><option value="walk_in">Walk-in</option></select></Field>
      <div className="grid grid-cols-2 gap-2"><Field label="Start time"><input type="time" value={schedule.start_time} onChange={(e) => updateSchedule(schedule.id, { start_time: e.target.value })} className={inputClass} /></Field><Field label="End time"><input type="time" value={schedule.end_time} onChange={(e) => updateSchedule(schedule.id, { end_time: e.target.value })} className={inputClass} /></Field></div>
      <Toggle label="Schedule active" checked={schedule.is_active} onChange={(checked) => updateSchedule(schedule.id, { is_active: checked })} />
    </div>)}
    <button type="button" onClick={() => onChange([...schedules, emptySchedule()])} className="text-xs font-extrabold text-brand"><i className="fa-solid fa-plus mr-1" />Add schedule</button>
  </FormCard>;
}

function ProfileImagePicker({
  source,
  hasNewImage,
  error,
  disabled,
  onSelect,
  onClear,
}: {
  source: string | null;
  hasNewImage: boolean;
  error: string | null;
  disabled: boolean;
  onSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return <div>
    <p className="mb-1.5 text-xs font-bold text-foreground">Profile image</p>
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-brand">
        {source ? (
          <>
            <img src={source} alt="Doctor profile preview" className="size-full object-cover" />
            {hasNewImage && <span className="absolute left-1 top-1 rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-extrabold text-white">New</span>}
          </>
        ) : (
          <i className="fa-solid fa-user-doctor text-2xl" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-foreground-muted">Select doctor profile image.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <label className={`inline-flex h-9 items-center justify-center rounded-lg bg-brand px-3 text-xs font-extrabold text-white ${disabled ? "opacity-60" : "cursor-pointer"}`}>
            <i className="fa-solid fa-image mr-1.5" aria-hidden="true" />
            Select image
            <input type="file" accept="image/*" disabled={disabled} onChange={onSelect} className="sr-only" />
          </label>
          {hasNewImage && <button type="button" onClick={onClear} disabled={disabled} className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-extrabold text-foreground disabled:opacity-60">Clear</button>}
        </div>
      </div>
    </div>
    {error && <p role="alert" className="mt-2 text-sm font-semibold text-danger">{error}</p>}
  </div>;
}

type DoctorSpecialtyOption = CategorySearchItem & { id: number };

function SpecialtyPicker({ selected, onChange }: { selected: DoctorSpecialtyOption[]; onChange: (items: DoctorSpecialtyOption[]) => void }) {
  const [search, setSearch] = useState(""); const [term, setTerm] = useState("");
  useEffect(() => { const timeout = window.setTimeout(() => setTerm(search.trim()), 300); return () => window.clearTimeout(timeout); }, [search]);
  const query = useQuery({ queryKey: ["categories", "search"], queryFn: getCategories, enabled: term.length >= 2 });
  const results = (query.data ?? [])
    .filter((category): category is DoctorSpecialtyOption => category.type === "doctor_specialty" && typeof category.id === "number")
    .filter((category) => matchesCategoryPrefix(category, term.toLocaleLowerCase()))
    .slice(0, 8);
  return <FormCard title="Specialties"><div className="flex flex-wrap gap-2">{selected.map((item, index) => <button key={categoryKey(item, index)} type="button" onClick={() => onChange(selected.filter((specialty) => specialty.id !== item.id))} className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand">{item.name} <i className="fa-solid fa-xmark ml-1" /></button>)}</div><div className="relative"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search specialties" className={`${inputClass} pr-11`} />{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear specialty search" className="absolute right-1 top-1 flex size-9 items-center justify-center text-foreground-muted"><i className="fa-solid fa-xmark" /></button>}</div>{term.length >= 2 && <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-100">{query.isFetching && <p className="p-3 text-xs text-foreground-muted">Searching...</p>}{results.map((item, index) => { const chosen = selected.some((specialty) => specialty.id === item.id); return <label key={categoryKey(item, index)} className={`flex cursor-pointer items-center gap-3 border-b border-slate-100 p-3 text-sm font-semibold last:border-0 ${chosen ? "bg-slate-50" : "hover:bg-slate-50"}`}><input type="checkbox" checked={chosen} onChange={() => onChange(chosen ? selected.filter((specialty) => specialty.id !== item.id) : [...selected, item])} className="size-4 shrink-0 accent-brand" /><span>{item.name}</span></label>; })}{!query.isFetching && results.length === 0 && <p className="p-3 text-xs text-foreground-muted">No specialties found.</p>}</div>}</FormCard>;
}

function specialtyToCatalogCategory(specialty: DoctorSpecialty): DoctorSpecialtyOption {
  return { id: specialty.id, name: specialty.name, label: specialty.label, slug: specialty.slug, aliases: specialty.aliases, type: "doctor_specialty" };
}

function scheduleDraftsFromDoctor(doctor: DoctorListItem) {
  const schedules = doctor.schedule?.full_schedule ?? [];
  if (!schedules.length) return [];
  return schedules.map((schedule) => ({ id: createDraftId(), schedule_type: schedule.schedule_type as ScheduleDraft["schedule_type"], weekday: schedule.weekday === null ? "0" : String(schedule.weekday), week_of_month: schedule.week_of_month === null ? "1" : String(schedule.week_of_month), day_of_month: schedule.day_of_month === null ? "1" : String(schedule.day_of_month), consultation_type: schedule.consultation_type ?? doctor.consultation_type ?? "", start_time: timeInputValue(schedule.start_time), end_time: timeInputValue(schedule.end_time), is_active: true }));
}

function toSchedulePayload(schedule: ScheduleDraft): DoctorSchedulePayload {
  return { schedule_type: schedule.schedule_type, weekday: schedule.schedule_type === "monthly_date" ? null : Number(schedule.weekday), week_of_month: schedule.schedule_type === "monthly_weekday" ? Number(schedule.week_of_month) : null, day_of_month: schedule.schedule_type === "monthly_date" ? Number(schedule.day_of_month) : null, ...(schedule.consultation_type.trim() ? { consultation_type: schedule.consultation_type } : {}), start_time: withSeconds(schedule.start_time), end_time: withSeconds(schedule.end_time), is_active: schedule.is_active };
}

function doctorIdFromResponse(response: unknown) {
  if (!response || typeof response !== "object") return null;
  const data = response as { id?: unknown; result?: { id?: unknown }; doctor?: { id?: unknown } };
  const id = data.id ?? data.result?.id ?? data.doctor?.id;
  return typeof id === "string" ? id : null;
}

function categoryKey(category: DoctorSpecialtyOption, index: number) { return `${category.id ?? category.slug ?? category.name}-${index}`; }
function addIfPresent<Key extends keyof DoctorUpsertPayload>(payload: DoctorUpsertPayload, key: Key, value: NonNullable<DoctorUpsertPayload[Key]>) { if (typeof value !== "string" || value.trim()) payload[key] = value; }
function splitList(value: string) { return value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean); }
function formatFeeInputValue(value: string | null) { if (!value) return ""; return value.replace(/\.00$/, ""); }
function timeInputValue(value: string) { return value.match(/(\d{2}:\d{2})/)?.[1] ?? ""; }
function withSeconds(value: string) { return value.length === 5 ? `${value}:00` : value; }
function FormCard({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"><h2 className="mb-4 text-sm font-extrabold text-foreground">{title}</h2><div className="space-y-4">{children}</div></section>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-bold text-foreground"><span className="mb-1.5 block">{label}</span>{children}</label>; }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) { return <label className="flex items-center justify-between gap-3 text-sm font-bold"><span>{label}</span><span className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-brand" : "bg-slate-200"}`}><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" /><span className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition-all ${checked ? "left-6" : "left-1"}`} /></span></label>; }
