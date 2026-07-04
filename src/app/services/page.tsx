'use client';

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { DotPattern } from "@/components/ui/backgrounds";
import { Highlighter } from "@/components/ui/highlighter";
import { ServiceReadyCta } from "@/components/services/ServiceReadyCta";
import { SERVICE_READY_CTA } from "@/constants/service-pages";
import { SERVICES_LIST } from "@/components/home/data";

// services list provided by `SERVICES_LIST` in data

export default function ServicesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[linear-gradient(180deg,#f8fbfd_0%,#ffffff_38%,#f8fbfd_100%)]">
      <Header />

      <main className="flex-1 pt-24 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_25%)]" />
        <DotPattern
          className="left-0 top-0 h-56 w-56 opacity-35 [mask-image:radial-gradient(circle_at_center,white,transparent_72%)]"
          color="#cad8e4"
          cr={1.5}
        />
        <DotPattern
          className="right-0 top-0 h-56 w-56 opacity-35 [mask-image:radial-gradient(circle_at_center,white,transparent_72%)]"
          color="#cad8e4"
          cr={1.5}
        />

        <section className="relative z-10 py-14 sm:py-16 lg:py-20">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12">
           <div className="text-center mb-8">
              {/* <p className="text-[13px] text-cyan-600 font-medium mb-3">Our Services</p> */}
              <h1 className="text-[36px] md:text-[48px] font-medium text-gray-900 tracking-tight leading-tight mb-6">
                Care that fits{' '}
                <Highlighter action="highlight" color="#06b6d4" isView>
                  <span className="text-white">your real life</span>
                </Highlighter>
              </h1>
              <p className="text-[15px] text-gray-600 max-w-2xl mx-auto leading-relaxed">
                From pain relief and advanced rehabilitation to nutrition, mental wellness, yoga, and sports performance—every programme is thoughtfully designed around you.
              </p>
            </div>

            <div className="mt-12 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {SERVICES_LIST.map((service) => {
                return (
                  <article
                    key={service.id}
                    className="group flex min-h-[280px] flex-col rounded-md border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(8,47,73,0.10)] sm:p-5"
                  >
                    <div className="overflow-hidden rounded-md">
                      <Image
                        src={service.image}
                        alt={service.imageAlt || service.title}
                        width={800}
                        height={480}
                        className="w-full h-40 object-cover"
                        priority={false}
                      />
                    </div>
                    <h2 className="mt-4 text-lg font-semibold leading-7 tracking-tight text-slate-900">
                      {service.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600 flex-grow">
                      {service.description}
                    </p>
                    <Link
                      href={service.href}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-600 transition-colors hover:text-cyan-700"
                    >
                      Learn more
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-24 bg-gray-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="absolute top-20 left-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-teal-500/20 rounded-full blur-[100px]" />
          
          <div className="max-w-[1200px] mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <p className="text-[13px] text-cyan-400 font-medium mb-3">Testimonials</p>
              <h2 className="text-[32px] md:text-[44px] font-medium text-white tracking-tight mb-4">
                What Our{" "}
                <span className="text-cyan-400">Patients Say</span>
              </h2>
              <p className="text-[15px] text-gray-400 max-w-xl mx-auto">
                Everyday people-athletes, parents, and grandparents-sharing what changed for them
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                <div className="flex items-start gap-3 mb-4">
                  <img 
                    src="https://api.dicebear.com/9.x/lorelei/svg?seed=rahul&backgroundColor=b6e3f4" 
                    alt="Rahul Kumar"
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-[14px]">Rahul Kumar</span>
                      <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                      </svg>
                    </div>
                    <span className="text-gray-500 text-[13px]">@rahul_athlete</span>
                  </div>
                </div>
                <p className="text-gray-300 text-[14px] leading-relaxed mb-4">
                  After my ACL injury, I thought my cricket career was over. The team at <span className="text-cyan-400">@H2HHealthcare</span> got me back on the field in record time. Their sports rehab program is world-class!
                </p>
                <div className="flex items-center gap-4 text-gray-500 text-[12px]">
                  <span>Sports Rehabilitation</span>
                  <span>•</span>
                  <span>Mumbai</span>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                <div className="flex items-start gap-3 mb-4">
                  <img 
                    src="https://api.dicebear.com/9.x/lorelei/svg?seed=priya&backgroundColor=c0aede" 
                    alt="Priya Sharma"
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-[14px]">Priya Sharma</span>
                      <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                      </svg>
                    </div>
                    <span className="text-gray-500 text-[13px]">@priya_wellness</span>
                  </div>
                </div>
                <p className="text-gray-300 text-[14px] leading-relaxed mb-4">
                  Living with chronic back pain for 5 years was exhausting. <span className="text-cyan-400">@H2HHealthcare</span> pain management team changed my life. I can finally play with my kids again!
                </p>
                <div className="flex items-center gap-4 text-gray-500 text-[12px]">
                  <span>Pain Management</span>
                  <span>•</span>
                  <span>Delhi</span>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                <div className="flex items-start gap-3 mb-4">
                  <img 
                    src="https://api.dicebear.com/9.x/lorelei/svg?seed=amit&backgroundColor=d1d4f9" 
                    alt="Amit Mehta"
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-[14px]">Amit Mehta</span>
                      <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                      </svg>
                    </div>
                    <span className="text-gray-500 text-[13px]">@amit_senior</span>
                  </div>
                </div>
                <p className="text-gray-300 text-[14px] leading-relaxed mb-4">
                  My father needed physiotherapy but couldn&apos;t travel. <span className="text-cyan-400">@H2HHealthcare</span> home visits were a blessing. Professional, caring, and so convenient! Highly recommend.
                </p>
                <div className="flex items-center gap-4 text-gray-500 text-[12px]">
                  <span>Home Physiotherapy</span>
                  <span>•</span>
                  <span>Bangalore</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ServiceReadyCta
          title={SERVICE_READY_CTA.title}
          subtitle={SERVICE_READY_CTA.subtitle}
        />
      </main>

      <Footer />
    </div>
  );
}
