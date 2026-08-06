"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { candidateService } from "@/services/candidate.service";
import { CandidateApplicationService } from "@/services/http/http-candidate-application.service";
import { useAuth } from "@/features/auth/auth-provider";
import { getInitials } from "@/lib/format";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  CheckCircle2,
  ExternalLink,
  FileText,
  GraduationCap,
  Languages,
  Link as LinkIcon,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { CvUploader } from "./components/cv/CvUploader";

type ProfileItem = Record<string, unknown>;
type CandidateProfile = {
  fullName?: string;
  email?: string;
  cvUrl?: string;
  profileData?: Record<string, unknown>;
};

const asRecord = (value: unknown): ProfileItem =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as ProfileItem) : {};
const asItems = (value: unknown): ProfileItem[] => Array.isArray(value) ? value.map(asRecord) : [];
const asStrings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

function Section({ title, icon, children, description }: { title: string; icon: React.ReactNode; children: React.ReactNode; description?: string }) {
  return <section className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8"><div className="mb-6 flex items-start gap-3"><div className="rounded-xl bg-brand/10 p-2.5 text-brand">{icon}</div><div><h2 className="text-xl font-bold text-ink">{title}</h2>{description && <p className="mt-1 text-sm text-muted">{description}</p>}</div></div>{children}</section>;
}

function ItemActions({ onRemove }: { onRemove: () => void }) {
  return <button type="button" onClick={onRemove} className="absolute right-3 top-3 rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600" aria-label="Xóa mục"><Trash2 className="size-4" /></button>;
}

export function ProfileClient() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [fullName, setFullName] = useState("");
  const [personal, setPersonal] = useState<ProfileItem>({});
  const [metadata, setMetadata] = useState<ProfileItem>({});
  const [links, setLinks] = useState<ProfileItem>({});
  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState<ProfileItem[]>([]);
  const [education, setEducation] = useState<ProfileItem[]>([]);
  const [projects, setProjects] = useState<ProfileItem[]>([]);
  const [languages, setLanguages] = useState<ProfileItem[]>([]);
  const [certifications, setCertifications] = useState<ProfileItem[]>([]);

  const hydrate = (data: CandidateProfile) => {
    const source = data.profileData ?? {};
    const extractedPersonal = asRecord(source.personal_info);
    setProfile(data);
    setFullName(data.fullName || String(extractedPersonal.name || ""));
    setPersonal(extractedPersonal);
    setMetadata(asRecord(source.professional_metadata));
    setLinks(asRecord(source.social_links));
    setSkills(asStrings(source.skills));
    setExperience(asItems(source.experience));
    setEducation(asItems(source.education));
    setProjects(asItems(source.projects));
    setLanguages(asItems(source.spoken_languages));
    setCertifications(asItems(source.certifications));
  };

  const fetchProfile = async () => {
    setLoading(true);
    try { hydrate(await candidateService.getProfile() as CandidateProfile); }
    catch { toast.error("Không thể tải hồ sơ."); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (!authLoading && !user) router.replace("/login?next=/profile"); }, [authLoading, router, user]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchProfile();
    // fetchProfile is intentionally called only when this page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateItem = (setter: React.Dispatch<React.SetStateAction<ProfileItem[]>>, index: number, field: string, value: string) =>
    setter((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  const removeItem = (setter: React.Dispatch<React.SetStateAction<ProfileItem[]>>, index: number) => setter((items) => items.filter((_, itemIndex) => itemIndex !== index));
  const addItem = (setter: React.Dispatch<React.SetStateAction<ProfileItem[]>>, item: ProfileItem) => setter((items) => [...items, item]);
  const text = (value: unknown) => typeof value === "string" ? value : "";

  const handleUploadCv = async (file: File) => {
    setIsUploadingCv(true);
    try {
      await CandidateApplicationService.uploadMasterCv(file);
      toast.success("Thông tin từ CV đã được điền vào hồ sơ. Bạn có thể rà soát và chỉnh sửa trước khi lưu.");
      await fetchProfile();
    } catch { toast.error("Không thể tải CV lên."); }
    finally { setIsUploadingCv(false); }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const profileData = {
      ...(profile?.profileData ?? {}),
      personal_info: { ...personal, name: fullName },
      social_links: links,
      professional_metadata: metadata,
      skills,
      experience,
      education,
      projects,
      spoken_languages: languages,
      certifications,
    };
    try {
      const saved = await candidateService.updateProfile({ fullName, profileData }) as CandidateProfile;
      hydrate(saved);
      toast.success("Hồ sơ đã được lưu.");
    } catch { toast.error("Không thể lưu hồ sơ."); }
    finally { setSaving(false); }
  };

  if (loading || authLoading || !user) return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-brand" /></div>;

  return <main className="min-h-screen bg-canvas pb-14"><div className="border-b border-border bg-white"><div className="mx-auto max-w-5xl px-6 py-10 sm:px-8"><div className="flex flex-col gap-6 sm:flex-row sm:items-center"><div className="flex size-20 items-center justify-center rounded-3xl bg-brand/10 text-2xl font-bold text-brand">{getInitials(fullName || user.fullName || "User")}</div><div className="flex-1"><p className="text-sm font-semibold text-brand">Hồ sơ ứng viên</p><h1 className="mt-1 text-3xl font-bold text-ink">{fullName || "Hoàn thiện hồ sơ của bạn"}</h1><p className="mt-2 text-sm text-muted">Cập nhật đầy đủ thông tin để nhà tuyển dụng hiểu rõ hơn về bạn.</p></div></div></div></div>
    <form onSubmit={handleSave} className="mx-auto max-w-5xl space-y-6 px-6 py-8 sm:px-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-brand/20 bg-brand/5 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><Sparkles className="mt-0.5 size-5 text-brand" /><div><p className="font-semibold text-ink">Hoàn thiện hồ sơ của bạn</p><p className="mt-1 text-sm text-muted">Rà soát và cập nhật thông tin để nhà tuyển dụng thấy hồ sơ chính xác nhất.</p></div></div><Button type="submit" loading={saving}><CheckCircle2 className="mr-2 size-4" />Lưu hồ sơ</Button></div>

      <Section title="Thông tin cá nhân" icon={<User className="size-5" />} description="Email tài khoản được giữ cố định; các thông tin khác có thể chỉnh sửa."><div className="grid gap-5 sm:grid-cols-2"><label className="space-y-2 text-sm font-semibold text-ink">Họ và tên<Input value={fullName} onChange={(event) => setFullName(event.target.value)} required /></label><label className="space-y-2 text-sm font-semibold text-ink">Email<Input value={profile?.email || ""} disabled className="bg-surface-soft" /></label><label className="space-y-2 text-sm font-semibold text-ink">Số điện thoại<Input value={text(personal.phone)} onChange={(event) => setPersonal({ ...personal, phone: event.target.value })} /></label><label className="space-y-2 text-sm font-semibold text-ink">Địa điểm<Input value={text(personal.location)} onChange={(event) => setPersonal({ ...personal, location: event.target.value })} /></label></div></Section>

      <Section title="Định hướng nghề nghiệp" icon={<Sparkles className="size-5" />}><div className="grid gap-5 sm:grid-cols-2"><label className="space-y-2 text-sm font-semibold text-ink">Vai trò mong muốn<Input value={text(metadata.primary_role)} onChange={(event) => setMetadata({ ...metadata, primary_role: event.target.value })} placeholder="Ví dụ: Backend Developer" /></label><label className="space-y-2 text-sm font-semibold text-ink">Cấp độ<Input value={text(metadata.seniority_level)} onChange={(event) => setMetadata({ ...metadata, seniority_level: event.target.value })} placeholder="Ví dụ: Intern" /></label><label className="space-y-2 text-sm font-semibold text-ink sm:col-span-2">Tóm tắt chuyên môn<textarea value={text(metadata.candidate_summary)} onChange={(event) => setMetadata({ ...metadata, candidate_summary: event.target.value })} className="min-h-28 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-brand" placeholder="Giới thiệu ngắn về kinh nghiệm, điểm mạnh và định hướng của bạn." /></label></div></Section>

      <Section title="Liên kết chuyên nghiệp" icon={<LinkIcon className="size-5" />}><div className="grid gap-5 sm:grid-cols-3"><label className="space-y-2 text-sm font-semibold text-ink">LinkedIn<Input value={text(links.linkedin)} onChange={(event) => setLinks({ ...links, linkedin: event.target.value })} placeholder="https://linkedin.com/in/..." /></label><label className="space-y-2 text-sm font-semibold text-ink">Portfolio / Website<Input value={text(links.portfolio_or_website)} onChange={(event) => setLinks({ ...links, portfolio_or_website: event.target.value })} placeholder="https://..." /></label><label className="space-y-2 text-sm font-semibold text-ink">GitHub / liên kết khác<Input value={text(links.github)} onChange={(event) => setLinks({ ...links, github: event.target.value })} placeholder="https://github.com/..." /></label></div></Section>

      <Section title="Kỹ năng" icon={<Sparkles className="size-5" />} description="Nhập từng kỹ năng rồi nhấn Enter hoặc dấu phẩy để thêm."><input value={skills.join(", ")} onChange={(event) => setSkills(event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} className="w-full rounded-xl border border-input px-3 py-2 text-sm outline-none focus:border-brand" placeholder="Java, Spring Boot, MySQL, Docker..." /><div className="mt-4 flex flex-wrap gap-2">{skills.map((skill) => <Badge key={skill} variant="secondary" className="bg-brand/10 text-brand">{skill}</Badge>)}</div></Section>

      <Section title="Kinh nghiệm làm việc" icon={<Briefcase className="size-5" />}><div className="space-y-4">{experience.map((item, index) => <div key={index} className="relative grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2"><ItemActions onRemove={() => removeItem(setExperience, index)} /><Input value={text(item.role || item.title)} onChange={(event) => updateItem(setExperience, index, "role", event.target.value)} placeholder="Vị trí" /><Input value={text(item.company)} onChange={(event) => updateItem(setExperience, index, "company", event.target.value)} placeholder="Công ty" /><Input value={text(item.duration)} onChange={(event) => updateItem(setExperience, index, "duration", event.target.value)} placeholder="Thời gian" /><Input value={text(item.technologies)} onChange={(event) => updateItem(setExperience, index, "technologies", event.target.value)} placeholder="Công nghệ sử dụng" /><textarea value={text(item.summary || item.description)} onChange={(event) => updateItem(setExperience, index, "summary", event.target.value)} className="min-h-24 rounded-xl border border-input px-3 py-2 text-sm sm:col-span-2" placeholder="Mô tả công việc hoặc thành tựu" /></div>)}</div><button type="button" onClick={() => addItem(setExperience, {})} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand"><Plus className="size-4" />Thêm kinh nghiệm</button></Section>

      <Section title="Học vấn" icon={<GraduationCap className="size-5" />}><div className="space-y-4">{education.map((item, index) => <div key={index} className="relative grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-3"><ItemActions onRemove={() => removeItem(setEducation, index)} /><Input value={text(item.degree)} onChange={(event) => updateItem(setEducation, index, "degree", event.target.value)} placeholder="Bằng cấp / chuyên ngành" /><Input value={text(item.institution)} onChange={(event) => updateItem(setEducation, index, "institution", event.target.value)} placeholder="Trường / tổ chức" /><Input value={text(item.year || item.duration)} onChange={(event) => updateItem(setEducation, index, "year", event.target.value)} placeholder="Thời gian" /></div>)}</div><button type="button" onClick={() => addItem(setEducation, {})} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand"><Plus className="size-4" />Thêm học vấn</button></Section>

      <Section title="Dự án nổi bật" icon={<Briefcase className="size-5" />}><div className="space-y-4">{projects.map((item, index) => <div key={index} className="relative grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2"><ItemActions onRemove={() => removeItem(setProjects, index)} /><Input value={text(item.name)} onChange={(event) => updateItem(setProjects, index, "name", event.target.value)} placeholder="Tên dự án" /><Input value={text(item.role)} onChange={(event) => updateItem(setProjects, index, "role", event.target.value)} placeholder="Vai trò" /><Input value={text(item.url)} onChange={(event) => updateItem(setProjects, index, "url", event.target.value)} placeholder="Liên kết dự án" /><Input value={text(item.technologies)} onChange={(event) => updateItem(setProjects, index, "technologies", event.target.value)} placeholder="Công nghệ" /><textarea value={text(item.summary || item.description)} onChange={(event) => updateItem(setProjects, index, "summary", event.target.value)} className="min-h-24 rounded-xl border border-input px-3 py-2 text-sm sm:col-span-2" placeholder="Mô tả dự án và kết quả" /></div>)}</div><button type="button" onClick={() => addItem(setProjects, {})} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand"><Plus className="size-4" />Thêm dự án</button></Section>

      <div className="grid gap-6 lg:grid-cols-2"><Section title="Ngôn ngữ" icon={<Languages className="size-5" />}><div className="space-y-3">{languages.map((item, index) => <div key={index} className="relative grid grid-cols-2 gap-3 rounded-xl border border-border p-3"><ItemActions onRemove={() => removeItem(setLanguages, index)} /><Input value={text(item.language)} onChange={(event) => updateItem(setLanguages, index, "language", event.target.value)} placeholder="Ngôn ngữ" /><Input value={text(item.proficiency)} onChange={(event) => updateItem(setLanguages, index, "proficiency", event.target.value)} placeholder="Trình độ" /></div>)}</div><button type="button" onClick={() => addItem(setLanguages, {})} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand"><Plus className="size-4" />Thêm ngôn ngữ</button></Section><Section title="Chứng chỉ" icon={<CheckCircle2 className="size-5" />}><div className="space-y-3">{certifications.map((item, index) => <div key={index} className="relative grid grid-cols-2 gap-3 rounded-xl border border-border p-3"><ItemActions onRemove={() => removeItem(setCertifications, index)} /><Input value={text(item.name)} onChange={(event) => updateItem(setCertifications, index, "name", event.target.value)} placeholder="Tên chứng chỉ" /><Input value={text(item.issuer || item.year)} onChange={(event) => updateItem(setCertifications, index, "issuer", event.target.value)} placeholder="Đơn vị cấp / năm" /></div>)}</div><button type="button" onClick={() => addItem(setCertifications, {})} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand"><Plus className="size-4" />Thêm chứng chỉ</button></Section></div>

      <Section title="Master CV" icon={<FileText className="size-5" />} description="Tải CV PDF để điền nhanh hồ sơ; bạn luôn có thể sửa nội dung sau đó.">{profile?.cvUrl ? <div className="flex flex-wrap items-center gap-3"><a href={profile.cvUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-soft"><ExternalLink className="size-4" />Xem CV hiện hành</a><CvUploader onUpload={handleUploadCv} isUploading={isUploadingCv} compact /></div> : <CvUploader onUpload={handleUploadCv} isUploading={isUploadingCv} />}</Section>
      <div className="sticky bottom-4 flex justify-end"><Button type="submit" loading={saving} className="shadow-lg"><CheckCircle2 className="mr-2 size-4" />Lưu toàn bộ hồ sơ</Button></div>
    </form></main>;
}
