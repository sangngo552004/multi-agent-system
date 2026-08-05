"use client";

import React, { useState, useEffect } from "react";
import { candidateService } from "@/services/candidate.service";
import { CandidateApplicationService } from "@/services/http/http-candidate-application.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, User, Sparkles, FileText,
  MapPin, Phone, Mail, Briefcase, GraduationCap,
  Building, Calendar, CheckCircle2
} from "lucide-react";
import { CvUploader } from "./components/cv/CvUploader";
import { toast } from "sonner";
import { getInitials } from "@/lib/format";
import { useAuth } from "@/features/auth/auth-provider";
import { useRouter } from "next/navigation";

export function ProfileClient() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?next=/profile");
    }
  }, [user, authLoading, router]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploadingCv, setIsUploadingCv] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
  });

  const fetchProfile = () => {
    setLoading(true);
    candidateService.getProfile()
      .then((data) => {
        setProfile(data);
        setFormData({
          fullName: data.fullName || "",
          phone: data.phone || "",
          address: data.address || "",
        });
      })
      .catch((err) => {
        console.error("Failed to fetch profile", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile();
  }, []);



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await candidateService.updateProfile({
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        skills: profile?.skills || {},
        experience: profile?.experience || {},
        education: profile?.education || {},
      });
      toast.success("Hồ sơ của bạn đã được lưu.");
    } catch {
      toast.error("Lỗi: Không thể cập nhật hồ sơ.");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadCv = async (file: File) => {
    setIsUploadingCv(true);
    try {
      toast.info("Đang xử lý CV bằng AI, vui lòng đợi trong khoảng 10 giây...", { duration: 10000 });
      await CandidateApplicationService.uploadMasterCv(file);

      // Since it is synchronous now, the backend already processed everything
      toast.success("Hồ sơ đã được cập nhật thành công từ CV!");
      fetchProfile();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error?.status === 429 || error?.response?.status === 429) {
        toast.error("Bạn đã tải lên CV quá 100 lần trong 1 giờ. Vui lòng thử lại sau.");
      } else {
        toast.error("Có lỗi xảy ra khi tải CV lên.");
      }
    } finally {
      setIsUploadingCv(false);
    }
  };

  if (loading || authLoading || (!user && !authLoading)) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin size-8 text-brand" /></div>;
  }

  const renderSkills = () => {
    if (!profile?.skills) return <p className="text-muted text-sm italic">Chưa có thông tin kỹ năng.</p>;

    let allSkills: string[] = [];
    if (Array.isArray(profile.skills)) {
      allSkills = profile.skills;
    } else if (typeof profile.skills === 'object') {
       const { industry_knowledge_and_hard_skills, tools_and_software, soft_skills } = profile.skills;
       if (industry_knowledge_and_hard_skills) allSkills.push(...industry_knowledge_and_hard_skills);
       if (tools_and_software) allSkills.push(...tools_and_software);
       if (soft_skills) allSkills.push(...soft_skills);
    }

    if (allSkills.length === 0) return <p className="text-muted text-sm italic">Chưa có thông tin kỹ năng.</p>;

    return (
      <div className="flex flex-wrap gap-2">
        {allSkills.map((skill, index) => (
          <Badge key={index} variant="secondary" className="px-3 py-1 bg-brand/10 text-brand hover:bg-brand/20 transition-colors">
            {skill}
          </Badge>
        ))}
      </div>
    );
  };

  const renderExperience = () => {
    if (!profile?.experience || !Array.isArray(profile.experience) || profile.experience.length === 0) {
      return <p className="text-muted text-sm italic">Chưa có thông tin kinh nghiệm.</p>;
    }
    return (
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {profile.experience.map((exp: Record<string, unknown>, index: number) => (
          <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-surface-soft text-brand shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
              <Briefcase className="size-4" />
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-ink text-lg">{exp.title || exp.role}</h3>
              </div>
              <div className="text-brand font-medium mb-3 flex items-center gap-1.5">
                <Building className="size-4" />
                {exp.company}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted mb-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  {exp.duration}
                </div>
              </div>
              <p className="text-sm text-ink/80 leading-relaxed line-clamp-3">
                {exp.description || exp.summary}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEducation = () => {
    if (!profile?.education || !Array.isArray(profile.education) || profile.education.length === 0) {
      return <p className="text-muted text-sm italic">Chưa có thông tin học vấn.</p>;
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {profile.education.map((edu: Record<string, unknown>, index: number) => (
          <div key={index} className="bg-white p-5 rounded-2xl border border-border flex items-start gap-4 hover:border-brand/30 transition-colors shadow-sm">
            <div className="p-3 bg-surface-soft rounded-xl text-brand shrink-0">
              <GraduationCap className="size-6" />
            </div>
            <div>
              <h3 className="font-semibold text-ink line-clamp-2 leading-tight mb-1">{edu.degree}</h3>
              <p className="text-brand text-sm font-medium mb-1">{edu.institution}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <Calendar className="size-3" />
                <span>{edu.year || edu.duration}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-canvas pb-12">
      <div className="bg-white border-b border-border">
        <div className="h-40 bg-gradient-to-r from-brand/20 via-brand/10 to-transparent relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        </div>
        <div className="max-w-[1000px] mx-auto px-6 sm:px-8 pb-8">
          <div className="relative flex flex-col sm:flex-row sm:items-end gap-6 -mt-16">
            <div className="h-32 w-32 rounded-3xl bg-white p-2 shadow-lg shrink-0">
              <div className="w-full h-full rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-4xl font-bold">
                {getInitials(formData.fullName || user?.fullName || "User")}
              </div>
            </div>
            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-bold text-ink mb-2">
                {formData.fullName || user?.fullName || "Chưa cập nhật tên"}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                <div className="flex items-center gap-1.5">
                  <Mail className="size-4" />
                  {profile?.email}
                </div>
                {formData.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="size-4" />
                    {formData.phone}
                  </div>
                )}
                {formData.address && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-4" />
                    {formData.address}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-6 sm:px-8 mt-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-white/50 backdrop-blur-sm border border-border p-1 w-full flex overflow-x-auto rounded-xl shadow-sm mb-6">
            <TabsTrigger value="overview" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5">
              <User className="size-4 mr-2" />
              Thông tin cá nhân
            </TabsTrigger>
            <TabsTrigger value="ai-profile" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5">
              <Sparkles className="size-4 mr-2 text-brand" />
              Hồ sơ AI
            </TabsTrigger>
            <TabsTrigger value="cv" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5">
              <FileText className="size-4 mr-2" />
              Quản lý CV
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-ink">Thông tin cơ bản</h2>
                <p className="text-sm text-muted mt-1">Cập nhật thông tin cá nhân của bạn để nhà tuyển dụng dễ dàng liên hệ.</p>
              </div>
              <form onSubmit={handleSave} className="space-y-5 max-w-xl">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-ink">Email</label>
                  <Input id="email" value={profile?.email || ""} disabled placeholder="name@example.com" className="bg-surface-soft text-muted font-medium" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-semibold text-ink">Họ và tên</label>
                  <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="VD: Nguyễn Văn A" required />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-semibold text-ink">Số điện thoại</label>
                  <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="VD: 0912345678" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-semibold text-ink">Địa chỉ</label>
                  <Input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="VD: Hà Nội, Việt Nam" />
                </div>

                <div className="pt-4">
                  <Button type="submit" loading={saving}>
                    <CheckCircle2 className="size-4 mr-2" />
                    Lưu thông tin
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="ai-profile" className="mt-0 space-y-6">
            <div className="bg-gradient-to-r from-brand/10 to-transparent p-6 rounded-2xl border border-brand/20 flex items-start gap-4">
              <div className="p-3 bg-brand text-white rounded-xl shadow-md shrink-0">
                <Sparkles className="size-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-brand mb-1">Hồ sơ được phân tích bởi AI</h2>
                <p className="text-sm text-ink/80 leading-relaxed">
                  Thông tin dưới đây được AI tự động trích xuất từ CV của bạn. Hãy đảm bảo tải lên CV mới nhất ở mục Quản lý CV để có hồ sơ nổi bật nhất.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
              <h2 className="text-xl font-bold text-ink flex items-center gap-2 mb-6">
                Kỹ năng chuyên môn
              </h2>
              {renderSkills()}
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
              <h2 className="text-xl font-bold text-ink flex items-center gap-2 mb-8">
                Kinh nghiệm làm việc
              </h2>
              {renderExperience()}
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
              <h2 className="text-xl font-bold text-ink flex items-center gap-2 mb-6">
                Học vấn
              </h2>
              {renderEducation()}
            </div>
          </TabsContent>

          <TabsContent value="cv" className="mt-0">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
              <div className="max-w-2xl">
                <h2 className="text-xl font-bold text-ink mb-2">Cập nhật hồ sơ bằng CV</h2>
                <p className="text-sm text-muted mb-8 leading-relaxed">
                  Hệ thống AI sẽ tự động đọc và phân tích CV của bạn (định dạng PDF) để điền vào phần Kỹ năng, Kinh nghiệm và Học vấn. Điều này giúp nhà tuyển dụng dễ dàng tìm thấy bạn hơn!
                </p>
                <CvUploader onUpload={handleUploadCv} isUploading={isUploadingCv} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
