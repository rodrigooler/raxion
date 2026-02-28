import type { Locale } from "../../lib/site";
import { localeBasePath } from "../../lib/site";
import { getHomeUseCases } from "../content/site-dictionary";
import type { SiteDictionary } from "../content/site-types";

function getMarqueeAccent(index: number): string {
  if (index % 3 === 0) return "text-brand-blue";
  if (index % 3 === 1) return "text-brand-red";
  return "text-brand-purple";
}

function Orb({ content }: Readonly<{ content: SiteDictionary }>) {
  return (
    <div className="relative h-56 w-56 sm:h-64 sm:w-64 lg:h-[420px] lg:w-[420px]">
      <div className="absolute inset-0 rounded-full bg-black shadow-[0_0_120px_30px_rgba(255,255,255,0.08)]" />
      <div className="absolute -inset-16 rounded-full border border-white/5" style={{ animation: "spin 20s linear infinite" }} />
      <div className="absolute -inset-8 rounded-full border border-brand-blue/20" style={{ animation: "spin 15s linear infinite reverse" }} />
      <div className="absolute -inset-24 rounded-full border border-brand-red/15" style={{ animation: "spin 30s linear infinite" }} />
      <div className="absolute -inset-32 rounded-full bg-gradient-to-tr from-brand-red/15 via-transparent to-brand-blue/15 blur-3xl opacity-60" style={{ animation: "pulse 8s ease-in-out infinite" }} />
      <div className="absolute inset-0" style={{ animation: "float 10s ease-in-out infinite" }}>
        <div className="absolute left-1/2 top-0 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />
        <div className="absolute bottom-1/4 right-0 h-2 w-2 rounded-full bg-brand-blue blur-sm shadow-[0_0_8px_#00F0FF]" />
        <div className="absolute -left-8 top-1/2 h-1 w-1 rounded-full bg-brand-red shadow-[0_0_6px_#FF003C]" />
        <div className="absolute right-1/4 top-1/4 h-1 w-1 rounded-full bg-brand-purple" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><div className="blink font-mono text-[7px] uppercase tracking-widest text-brand-blue/60">{content.heroOrb.title}</div><div className="mt-1 font-mono text-[6px] uppercase tracking-widest text-white/20">{content.heroOrb.subtitle}</div></div></div>
    </div>
  );
}

function HeroMetric({ metric }: Readonly<{ metric: SiteDictionary["metrics"][number] }>) {
  return <div><div className={`ticker-number font-display text-3xl font-black ${metric.accent ?? ""}`}>{metric.value}<span className="ml-1 text-xl text-white/40">{metric.suffix}</span></div><div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-gray-600">{metric.label}</div><div className="mt-0.5 font-mono text-[8px] text-gray-700">{metric.sublabel}</div></div>;
}

export function HeroSection({ locale, content }: Readonly<{ locale: Locale; content: SiteDictionary }>) {
  const basePath = localeBasePath(locale);
  return (
    <section className="min-h-[100svh] px-4 pb-12 pt-40 sm:px-6 sm:pt-44 lg:pt-32">
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="reveal relative z-10 lg:col-span-7">
          <div className="mb-8 inline-block border border-brand-red px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-brand-red">{content.heroBadge}</div>
          <h1 className="font-display text-[52px] font-black leading-[0.84] tracking-tighter sm:text-[92px] lg:text-[118px]"><span className="block">{content.heroLines[0]}</span><span className="text-outline block">{content.heroLines[1]}</span><span className="block">{content.heroLines[2]}</span><span className="block text-brand-blue">{content.heroLines[3]}</span></h1>
          <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-start"><div className="max-w-sm font-mono text-sm leading-relaxed text-gray-500"><p className="mb-4">{content.heroNotes[0]}</p><p>{content.heroNotes[1]}</p></div><div className="flex w-full flex-col gap-3 md:w-auto md:min-w-[260px]"><a href={`${basePath}#problem`} className="bg-white px-8 py-4 text-center font-display text-base font-black tracking-wide text-black transition-all duration-300 hover:bg-brand-blue">{content.heroCtas.primary}</a><a href="https://github.com/rodrigooler/raxion" target="_blank" rel="noreferrer" className="border border-white/20 px-8 py-4 text-center font-display text-base font-black tracking-wide transition-all duration-300 hover:border-white/40 hover:bg-white/10">{content.heroCtas.secondary}</a></div></div>
          <div className="mt-14 grid grid-cols-1 gap-6 border-t border-white/10 pt-8 sm:grid-cols-3 sm:gap-4">{content.metrics.map((metric) => <HeroMetric key={metric.label} metric={metric} />)}</div>
        </div>
        <div className="reveal relative flex justify-center py-12 lg:col-span-5 lg:py-0"><Orb content={content} /></div>
      </div>
    </section>
  );
}

export function Marquee({ content }: Readonly<{ content: SiteDictionary }>) {
  const items = content.marqueeItems;
  return <div className="overflow-hidden border-y border-white/5 bg-white/[0.02] py-4"><div className="flex whitespace-nowrap" style={{ animation: "marquee 22s linear infinite" }}><div className="flex items-center font-mono text-[10px] uppercase tracking-[0.3em] text-gray-600">{[...items, ...items].map((item, index) => <span key={`${item}-${index}`} className="flex items-center"><span className="mx-8">{item}</span><span className={`mx-2 ${getMarqueeAccent(index)}`}>◆</span></span>)}</div></div></div>;
}

export function ProblemSection({ locale, content }: Readonly<{ locale: Locale; content: SiteDictionary }>) {
  const localizedUseCases = getHomeUseCases(locale);
  return (
    <section id="problem" className="scroll-mt-32 px-4 py-20 sm:scroll-mt-36 sm:px-6 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px]">
        <div className="reveal mb-16"><div className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-gray-600">{content.problem.eyebrow}</div><h2 className="font-display text-4xl font-black tracking-tighter sm:text-5xl lg:text-7xl">{content.problem.titleTop}<br /><span className="text-brand-red">{content.problem.titleAccent}</span></h2></div>
        <div className="reveal mb-16 max-w-3xl"><p className="font-mono text-sm leading-relaxed text-gray-400">{content.problem.intro}</p></div>
        <div className="mb-20 grid gap-6 lg:grid-cols-3">{localizedUseCases.map(([eyebrow, problem, solution], index) => <div key={eyebrow} className="reveal group" style={{ transitionDelay: `${index * 120}ms` }}><div className="mb-4 font-mono text-[9px] uppercase tracking-widest text-gray-700">{eyebrow}</div><div className="problem-card mb-3 p-6"><div className="mb-3 font-mono text-[9px] uppercase tracking-widest text-brand-red">{content.problem.beforeLabel}</div><p className="text-xs leading-relaxed text-gray-500">{problem}</p></div><div className="solution-card p-6"><div className="mb-3 font-mono text-[9px] uppercase tracking-widest text-brand-blue">{content.problem.afterLabel}</div><p className="text-xs leading-relaxed text-gray-400">{solution}</p></div></div>)}</div>
        <div className="reveal shimmer-border p-6 sm:p-10 lg:p-14"><div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12"><div><div className="mb-4 font-mono text-[10px] uppercase tracking-widest text-brand-red">{content.problem.structuralEyebrow}</div><h3 className="mb-6 font-display text-3xl font-black tracking-tighter lg:text-4xl">{content.problem.structuralTitle}<br /><span className="text-white/40">{content.problem.structuralAccent}</span></h3><p className="mb-6 font-mono text-xs leading-relaxed text-gray-500">{content.problem.structuralBody}</p><p className="font-mono text-xs leading-relaxed text-gray-500">{content.problem.structuralBody2}</p></div><div className="space-y-3 font-mono text-[9px]"><div className="mb-4 uppercase tracking-widest text-gray-700">{content.problem.chainLabel}</div>{content.problem.trustSteps.map((step, index) => <div key={step}><div className="flex items-start gap-3"><div className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${index === content.problem.trustSteps.length - 1 ? "bg-brand-blue shadow-[0_0_8px_#00F0FF]" : "bg-brand-blue"}`} /><div className={`min-w-0 flex-1 border px-4 py-2 ${index === content.problem.trustSteps.length - 1 ? "border-brand-blue/50 font-bold text-brand-blue" : "border-brand-blue/30 text-brand-blue/80"}`}>{step}</div></div>{index < content.problem.trustSteps.length - 1 ? <div className="ml-1 h-4 w-px bg-white/10" /> : null}</div>)}</div></div></div>
      </div>
    </section>
  );
}

export function ArchitectureSection({ content }: Readonly<{ content: SiteDictionary }>) {
  return (
    <section id="arch" className="scroll-mt-32 px-4 py-20 sm:scroll-mt-36 sm:px-6 sm:py-24 lg:py-32"><div className="mx-auto max-w-[1400px]"><div className="reveal mb-16 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"><h2 className="font-display text-4xl font-black tracking-tighter sm:text-5xl lg:text-7xl">{content.architecture.title} <span className="text-outline">{content.architecture.titleAccent}</span></h2><p className="max-w-sm font-mono text-[10px] uppercase tracking-widest text-gray-500 lg:text-right">{content.architecture.summary}</p></div><div className="grid gap-6 lg:grid-cols-3" id="logic">{content.architecture.cards.map((card, index) => <div key={card.title} className="reveal border border-white/10 bg-white/[0.02] p-6 sm:p-8" style={{ transitionDelay: `${index * 120}ms` }}><div className={`mb-4 font-mono text-[10px] uppercase tracking-widest ${card.accent}`}>{card.title}</div><h3 className="mb-4 font-display text-3xl font-black tracking-tighter">{card.heading}</h3><p className="text-sm leading-relaxed text-gray-500">{card.body}</p></div>)}</div><div className="reveal mt-10 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]"><div className="border border-white/10 bg-black p-6 sm:p-10"><div className="mb-6 font-mono text-[10px] uppercase tracking-widest text-gray-500">{content.architecture.proofTitle}</div><div className="grid gap-8 md:grid-cols-2">{content.architecture.proofItems.map((item) => <div key={item.title}><div className={`mb-3 font-display text-4xl font-black ${item.accent ?? ""}`}>{item.title}</div><p className="font-mono text-xs leading-relaxed text-gray-500">{item.body}</p></div>)}</div></div><div className="bg-white p-6 text-black sm:p-10"><div className="mb-4 font-mono text-[9px] uppercase tracking-widest text-black/40">{content.architecture.economicsEyebrow}</div><div className="font-display text-3xl font-black">{content.architecture.economicsTitle}</div><div className="mt-4 overflow-x-auto bg-black p-4 font-mono text-[9px] leading-relaxed text-white">{content.architecture.economicsLines.map((line, index) => <span key={`${line.label}-${index}`}><span className={line.accent}>{line.label}</span> {line.expression}{index < content.architecture.economicsLines.length - 1 ? <br /> : null}</span>)}</div></div></div></div></section>
  );
}

export function RoadmapSection({ content }: Readonly<{ content: SiteDictionary }>) {
  return (
    <section id="roadmap" className="scroll-mt-32 px-4 py-20 sm:scroll-mt-36 sm:px-6 sm:py-24 lg:py-32"><div className="mx-auto max-w-[1400px]"><div className="reveal mb-16"><div className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-gray-600">{content.roadmap.eyebrow}</div><h2 className="font-display text-4xl font-black tracking-tighter sm:text-5xl lg:text-7xl">{content.roadmap.titleTop} <span className="text-outline">{content.roadmap.titleAccent}</span><br />{content.roadmap.titleBottom}</h2></div><div className="grid gap-px bg-white/5 lg:grid-cols-4">{content.roadmap.phases.map((phase, index) => <div key={phase.title} className={`reveal bg-[#050505] p-6 sm:p-8 ${phase.active ? "border-l-2 border-brand-blue" : "border-l border-white/5"}`} style={{ transitionDelay: `${index * 120}ms` }}><div className="mb-6 flex items-center gap-2"><div className={`h-2 w-2 rounded-full ${phase.active ? "bg-brand-blue shadow-[0_0_6px_#00F0FF]" : "bg-white/10"}`} /><span className={`font-mono text-[9px] uppercase tracking-widest ${phase.active ? "text-brand-blue" : "text-gray-600"}`}>{phase.label}</span></div><div className="mb-2 font-mono text-[9px] text-gray-700">{phase.date}</div><h3 className="mb-4 font-display text-2xl font-black">{phase.title}<br /><span className={phase.accentClass}>{phase.accent}</span></h3><ul className="space-y-2 font-mono text-[10px] text-gray-600">{phase.items.map((item) => <li key={item} className="flex gap-2"><span>{phase.active ? "✓" : "○"}</span><span>{item}</span></li>)}</ul></div>)}</div></div></section>
  );
}

export function WhitepaperSection({ content }: Readonly<{ content: SiteDictionary }>) {
  return (
    <section id="whitepaper" className="scroll-mt-32 px-4 py-20 sm:scroll-mt-36 sm:px-6 sm:py-24 lg:py-32"><div className="mx-auto max-w-[1400px]"><div className="reveal shimmer-border relative overflow-hidden p-6 sm:p-10 lg:p-24"><div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-blue/5 blur-3xl" /><div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-brand-red/5 blur-3xl" /><div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12"><div className="max-w-xl"><div className="mb-4 font-mono text-[10px] uppercase tracking-widest text-brand-blue">{content.whitepaper.eyebrow}</div><h2 className="mb-6 font-display text-4xl font-black tracking-tighter sm:text-5xl lg:text-6xl">{content.whitepaper.title}</h2><p className="text-sm leading-relaxed text-gray-500">{content.whitepaper.body}</p></div><div className="flex w-full flex-col gap-4 lg:w-auto lg:min-w-[240px]"><a href="https://github.com/rodrigooler/raxion/blob/main/WHITEPAPER.md" target="_blank" rel="noreferrer" className="bg-white px-10 py-5 text-center font-display text-base font-black tracking-wide text-black transition-all duration-300 hover:bg-brand-blue">{content.whitepaper.ctas.primary}</a><a href="https://github.com/rodrigooler/raxion" target="_blank" rel="noreferrer" className="border border-white/20 px-10 py-5 text-center font-display text-base font-black tracking-wide transition-all duration-300 hover:border-brand-blue/60 hover:bg-brand-blue/5">{content.whitepaper.ctas.secondary}</a></div></div></div></div></section>
  );
}
