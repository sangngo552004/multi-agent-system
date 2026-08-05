"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Briefcase, Building2, Search, Users, ChevronRight, MapPin, Phone, Mail, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { PublicHeader } from "@/components/layout/public-header";
import { usePublicJobs } from "@/features/public/jobs/jobs.queries";

export default function Home() {
  const t = useTranslations("LandingPage");
  const { data, isLoading } = usePublicJobs({ size: 3 });

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white pt-20 pb-32">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <div className="mx-auto max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand ring-1 ring-inset ring-brand/20 mb-8">
                <span className="flex h-2 w-2 rounded-full bg-brand animate-pulse"></span>
                {t("hero.badge")}
              </span>

              <h1 className="text-5xl font-bold tracking-tight text-ink sm:text-7xl mb-8 leading-tight">
                {t("hero.title_prefix")}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-hover">
                  {t("hero.title_highlight")}
                </span>
              </h1>

              <p className="mt-6 text-lg leading-8 text-muted">
                {t("hero.description")}
              </p>

              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  href="/jobs"
                  className="group rounded-full bg-brand px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
                >
                  {t("hero.cta")}
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="#about" className="text-sm font-semibold leading-6 text-ink hover:text-brand transition-colors">
                  {t("hero.learn_more")} <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats / Culture Section */}
        <section id="about" className="py-24 sm:py-32 bg-surface border-y border-border">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:mx-0">
              <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{t("about.title")}</h2>
              <p className="mt-6 text-lg leading-8 text-muted">
                {t("about.description")}
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                {[
                  {
                    name: t("about.features.f1_title"),
                    description: t("about.features.f1_desc"),
                    icon: Building2,
                  },
                  {
                    name: t("about.features.f2_title"),
                    description: t("about.features.f2_desc"),
                    icon: Briefcase,
                  },
                  {
                    name: t("about.features.f3_title"),
                    description: t("about.features.f3_desc"),
                    icon: Users,
                  },
                ].map((feature, idx) => (
                  <div key={idx} className="flex flex-col group p-8 rounded-2xl bg-white border border-border transition-all duration-300 hover:shadow-xl hover:border-brand/30 hover:-translate-y-1">
                    <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-ink">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 group-hover:bg-brand transition-colors duration-300">
                        <feature.icon className="h-6 w-6 text-brand group-hover:text-white transition-colors duration-300" aria-hidden="true" />
                      </div>
                      {feature.name}
                    </dt>
                    <dd className="mt-6 flex flex-auto flex-col text-base leading-7 text-muted">
                      <p className="flex-auto">{feature.description}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Featured Jobs Section */}
        <section className="py-24 bg-white">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-ink">{t("jobs.title")}</h2>
              <Link href="/jobs" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-hover transition-colors">
                {t("jobs.view_all")} <ChevronRight className="size-4" />
              </Link>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-brand" />
              </div>
            ) : data?.content && data.content.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.content.map((job) => (
                  <div key={job.id} className="group flex flex-col justify-between rounded-2xl border border-border bg-white p-6 transition-all duration-300 hover:shadow-md hover:border-brand/40">
                    <div>
                      <div className="flex items-center gap-x-3 text-xs">
                        <span className="text-muted">{job.departmentName}</span>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold leading-6 text-ink group-hover:text-brand transition-colors">
                        <Link href={`/jobs/${job.id}`}>
                          <span className="absolute inset-0" />
                          {job.title}
                        </Link>
                      </h3>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-md bg-surface-soft px-2 py-1 text-xs font-medium text-muted ring-1 ring-inset ring-border-strong">
                          {job.location || "Hà Nội"}
                        </span>
                        <span className="inline-flex items-center rounded-md bg-surface-soft px-2 py-1 text-xs font-medium text-muted ring-1 ring-inset ring-border-strong">
                          {job.employmentType === "FULL_TIME" ? "Toàn thời gian" : "Bán thời gian"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                      <span className="text-sm text-brand font-medium group-hover:underline">{t("jobs.apply_now")}</span>
                      <ArrowRight className="size-4 text-brand group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-surface-soft rounded-2xl border border-border">
                <p className="text-muted">Hiện chưa có vị trí tuyển dụng nào.</p>
              </div>
            )}

            <div className="mt-10 sm:hidden flex justify-center">
              <Link href="/jobs" className="flex items-center justify-center gap-1 text-sm font-semibold text-brand hover:text-brand-hover transition-colors">
                {t("jobs.view_all")} <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-24 bg-surface-soft border-t border-border">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-ink">{t("contact.title")}</h2>
              <p className="mt-4 text-lg text-muted">{t("contact.description")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              <div className="rounded-2xl bg-white p-8 border border-border shadow-sm">
                <h3 className="text-lg font-semibold text-ink mb-4">{t("contact.hq")}</h3>
                <ul className="space-y-4 text-muted">
                  <li className="flex gap-3">
                    <MapPin className="size-5 text-brand shrink-0" />
                    <span>{t("contact.hq_address")}</span>
                  </li>
                  <li className="flex gap-3">
                    <Phone className="size-5 text-brand shrink-0" />
                    <span>{t("contact.phone")}: (024) 33528122</span>
                  </li>
                  <li className="flex gap-3">
                    <Mail className="size-5 text-brand shrink-0" />
                    <span>{t("contact.email")}: ctsv@ptit.edu.vn</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl bg-white p-8 border border-border shadow-sm">
                <h3 className="text-lg font-semibold text-ink mb-4">{t("contact.hcm")}</h3>
                <ul className="space-y-4 text-muted">
                  <li className="flex gap-3">
                    <MapPin className="size-5 text-brand shrink-0" />
                    <span>{t("contact.hcm_address")}</span>
                  </li>
                  <li className="flex gap-3">
                    <Phone className="size-5 text-brand shrink-0" />
                    <span>{t("contact.phone")}: (028) 38297220</span>
                  </li>
                  <li className="flex gap-3">
                    <Mail className="size-5 text-brand shrink-0" />
                    <span>{t("contact.email")}: tuyensinh@ptithcm.edu.vn</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border mt-auto">
        <div className="mx-auto max-w-7xl px-6 py-8 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <span className="text-sm text-muted">PTIT Careers © {new Date().getFullYear()}</span>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <div className="flex items-center justify-center bg-brand text-white font-bold w-6 h-6 rounded-md text-xs">
                P
              </div>
              <p className="text-center text-sm font-semibold leading-5 text-ink">
                {t("footer.copyright")}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
