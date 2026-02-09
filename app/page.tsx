'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import {
    Wand2,
    Video,
    Layout,
    ArrowRight,
    Play,
    Box,
    Workflow,
    Activity,
    Shield,
    Globe,
    Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const BentoCard = ({ children, className, title, description, icon: Icon, delay = 0 }: any) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
                "group relative overflow-hidden rounded-[40px] border border-white/[0.03] bg-[#0A0A0A] p-10 backdrop-blur-3xl transition-all hover:border-white/[0.1] hover:bg-zinc-900/40",
                className
            )}
        >
            <div className="relative z-10">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.02] text-zinc-500 border border-white/[0.05] transition-all group-hover:scale-110 group-hover:text-white group-hover:border-white/[0.1]">
                    <Icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase text-white mb-3">{title}</h3>
                <p className="max-w-[300px] text-sm leading-relaxed text-zinc-500 group-hover:text-zinc-400 transition-colors font-medium">{description}</p>
            </div>
            {children}
            {/* Ambient Glow */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/[0.02] blur-[100px] transition-all group-hover:bg-blue-500/[0.05]" />
        </motion.div>
    );
};

export default function HomePage() {
    const { isSignedIn, isLoaded } = useUser();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
    const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            router.push('/dashboard');
        }
    }, [isLoaded, isSignedIn, router]);

    if (!mounted) return null;

    return (
        <div ref={containerRef} className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black font-sans">
            {/* Grid Pattern Background */}
            <div className="fixed inset-0 z-0 opacity-[0.05] pointer-events-none"
                style={{ backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`, backgroundSize: '64px 64px' }} />

            {/* High-end Gradient Backgrounds */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[180px] opacity-40" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] bg-purple-600/5 rounded-full blur-[160px] opacity-30" />
            </div>

            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-white/[0.04] bg-black/40 backdrop-blur-3xl px-6">
                <div className="max-w-7xl mx-auto h-24 flex items-center justify-between">
                    <div className="flex items-center gap-4 group cursor-pointer">
                        <div className="relative w-12 h-12 rounded-xl bg-white flex items-center justify-center transition-all group-hover:-rotate-6 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                            <Box className="w-7 h-7 text-black" strokeWidth={2.5} />
                        </div>
                        <span className="text-xl font-black tracking-[-0.05em] uppercase">Grain</span>
                    </div>

                    <div className="hidden lg:flex items-center gap-12">
                        {['Architecture', 'Workflows', 'Ecosystem', 'Lab'].map((item) => (
                            <Link key={item} href="#" className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-all">
                                {item}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-6">
                        <Link href="/sign-in" className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 hover:text-white hidden sm:block">
                            Log In
                        </Link>
                        <Link href="/sign-up">
                            <Button className="bg-white text-black hover:bg-zinc-200 rounded-full px-8 h-12 text-[10px] font-bold tracking-[0.2em] uppercase transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                Request Access
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative pt-60 pb-40 px-6 z-10 flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center"
                >
                    <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/[0.02] border border-white/[0.05] mb-12 backdrop-blur-2xl">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                        <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-zinc-500">System v2.4.0 // Neural Pipeline Active</span>
                    </div>

                    <h1 className="text-8xl md:text-[11rem] font-black tracking-[-0.08em] leading-[0.8] mb-16 flex flex-col items-center uppercase">
                        <span className="block italic">CORTEX</span>
                        <span className="text-zinc-600 block relative">
                            WORKFLOWS
                            <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 1.8, delay: 0.8, ease: "circOut" }}
                                className="absolute -bottom-2 left-0 h-1 bg-white"
                            />
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-zinc-500 max-w-3xl mx-auto mb-20 leading-relaxed font-medium tracking-tight">
                        Unified industrial-scale generative engine. <br className="hidden md:block" />
                        A boundless obsidian interface for visual engineering.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-10 mb-32">
                        <Link href="/sign-up">
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white px-12 h-20 rounded-full text-[11px] font-bold tracking-[0.3em] uppercase group shadow-[0_20px_50px_rgba(37,99,235,0.2)] transition-all hover:scale-105 active:scale-95">
                                Start Building
                                <ArrowRight className="ml-3 w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>
                        <Button variant="ghost" className="text-zinc-500 hover:text-white h-20 px-10 text-[11px] font-bold tracking-[0.3em] uppercase group">
                            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mr-4 group-hover:bg-white group-hover:text-black transition-all">
                                <Play className="w-4 h-4 fill-current ml-1" />
                            </div>
                            CORE DEMO
                        </Button>
                    </div>
                </motion.div>

                {/* Hero Showcase Visual */}
                <motion.div
                    style={{ y, opacity }}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full max-w-[1440px] mx-auto group"
                >
                    <div className="absolute inset-0 bg-blue-600/10 blur-[150px] rounded-full opacity-30 group-hover:opacity-50 transition-all duration-1000" />
                    <div className="relative rounded-[60px] border border-white/[0.06] bg-[#080808] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
                        {/* Browser Chrome */}
                        <div className="h-14 w-full bg-[#0D0D0D] border-b border-white/[0.04] flex items-center px-10 gap-4">
                            <div className="flex gap-2.5">
                                <div className="w-3 h-3 rounded-full bg-zinc-800" />
                                <div className="w-3 h-3 rounded-full bg-zinc-800" />
                                <div className="w-3 h-3 rounded-full bg-zinc-800" />
                            </div>
                            <div className="mx-auto text-[10px] font-bold text-zinc-700 tracking-[0.5em] uppercase">grain_os_operating_environment</div>
                        </div>
                        {/* Image Showcase */}
                        <div className="aspect-[16/10] overflow-hidden">
                            <img
                                src="/images/hero.png"
                                alt="System Interface"
                                className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-[3s] ease-out"
                            />
                        </div>

                        {/* Interactive UI Nodes Mockup */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
                            <motion.div
                                animate={{ y: [0, -20, 0] }}
                                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-[20%] right-[15%] p-8 rounded-[32px] bg-black/40 backdrop-blur-3xl border border-white/[0.08] shadow-2xl"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase">SYSTEM_STATE</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="h-2 w-32 bg-white/10 rounded-full" />
                                    <div className="h-2 w-24 bg-white/5 rounded-full" />
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, 20, 0] }}
                                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute bottom-[20%] left-[10%] p-8 rounded-[32px] bg-black/40 backdrop-blur-3xl border border-white/[0.08] shadow-2xl"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <Workflow className="w-4 h-4 text-zinc-500" />
                                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase">PIPELINE_FLOW</span>
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10" />
                                    <div className="h-8 w-8 rounded-lg bg-blue-500/20 border border-blue-500/20" />
                                    <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10" />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Infrastructure Section */}
            <section className="relative py-60 px-6 max-w-7xl mx-auto">
                <div className="mb-32 flex flex-col lg:flex-row lg:items-end justify-between gap-16">
                    <div className="max-w-2xl">
                        <div className="inline-block px-4 py-1.5 rounded border border-white/10 text-[9px] font-bold tracking-[0.4em] uppercase mb-10 text-zinc-500">Core Architecture</div>
                        <h2 className="text-6xl md:text-8xl font-black tracking-[-0.05em] mb-8 uppercase leading-[0.9]">Designed for <br /> Intelligence.</h2>
                        <p className="text-zinc-500 text-lg font-medium leading-relaxed">
                            A zero-latency ecosystem built for high-velocity teams. <br className="hidden md:block" />
                            Where complex logic meets industrial-grade aesthetics.
                        </p>
                    </div>
                    <Button variant="outline" className="border-white/10 rounded-full h-16 px-10 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-all">
                        Technical Specs
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[400px]">
                    <BentoCard
                        title="Neural Canvas"
                        description="Proprietary obsidian engine optimized for gigapixel asset manipulation and real-time state synchronization."
                        icon={Layout}
                        className="md:col-span-8 md:row-span-2"
                        delay={0.1}
                    >
                        <div className="absolute inset-x-10 bottom-10 h-3/5 rounded-3xl overflow-hidden border border-white/[0.05]">
                            <img src="/images/neural.png" className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-1000" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
                        </div>
                    </BentoCard>

                    <BentoCard
                        title="Cortex Pipelines"
                        description="State-aware node architecture for enterprise automation."
                        icon={Workflow}
                        className="md:col-span-4"
                        delay={0.2}
                    />

                    <BentoCard
                        title="Atomic State"
                        description="Real-time multi-user synchronization with zero drift."
                        icon={Activity}
                        className="md:col-span-4"
                        delay={0.3}
                    />

                    <BentoCard
                        title="Asset Integrity"
                        description="Military-grade IP protection for high-value creative assets."
                        icon={Shield}
                        className="md:col-span-4"
                        delay={0.4}
                    />

                    <BentoCard
                        title="Global Scale"
                        description="Distributed neural compute nodes across 24 regions."
                        icon={Globe}
                        className="md:col-span-4"
                        delay={0.5}
                    />

                    <BentoCard
                        title="Visual Logic"
                        description="Turn complex branding systems into repeatable neural workflows in minutes."
                        icon={Cpu}
                        className="md:col-span-12 h-[300px]"
                        delay={0.6}
                    >
                        <div className="absolute right-10 bottom-0 top-10 w-1/3 border-l border-white/[0.05] flex items-center justify-center">
                            <div className="relative w-24 h-24 border border-dashed border-zinc-800 rounded-full flex items-center justify-center">
                                <Box className="w-8 h-8 text-zinc-900" />
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 border-t-2 border-blue-500 rounded-full"
                                />
                            </div>
                        </div>
                    </BentoCard>
                </div>
            </section>

            {/* Industrial Banner */}
            <section className="relative py-80 px-6 bg-white text-black rounded-[80px] overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
                    <h2 className="text-[12rem] md:text-[22rem] font-black tracking-[-0.1em] leading-none mb-20 opacity-[0.03] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none uppercase">INDUSTRIAL</h2>
                    <h3 className="text-6xl md:text-9xl font-black tracking-[-0.05em] uppercase leading-none mb-16 relative z-10 italic">
                        The Standard for <br /> Visual Intelligence.
                    </h3>
                    <p className="text-xl md:text-3xl font-bold tracking-tight max-w-4xl opacity-40 mb-24 relative z-10 leading-relaxed uppercase">
                        Scale your creative operations with the power of <br className="hidden md:block" />
                        unified neural processing and boundless visual logic.
                    </p>
                    <div className="flex flex-wrap justify-center gap-24 relative z-10 opacity-30 grayscale saturate-0 contrast-125 uppercase">
                        {['NVIDIA', 'ADOBE', 'OPENAI', 'PIXAR', 'LUMON'].map(brand => (
                            <span key={brand} className="text-4xl font-black tracking-tighter">{brand}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final Call */}
            <section className="relative py-60 px-6 flex justify-center">
                <div className="max-w-[1200px] w-full p-24 rounded-[60px] bg-gradient-to-br from-zinc-900 to-black border border-white/[0.04] text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-600/5 blur-[120px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <h2 className="text-6xl md:text-8xl font-black tracking-[-0.05em] mb-12 uppercase leading-none">Enter the cortex.</h2>
                    <p className="text-zinc-500 max-w-xl mx-auto mb-16 text-xl font-medium tracking-tight">
                        Join the restricted ecosystem. Experience the next <br /> evolutionary step in human-AI collaboration.
                    </p>
                    <Link href="/sign-up">
                        <Button size="lg" className="bg-white text-black hover:bg-zinc-200 px-16 h-24 rounded-full text-[12px] font-bold tracking-[0.4em] uppercase transition-all hover:scale-105 shadow-[0_40px_100px_rgba(255,255,255,0.1)]">
                            Secure Access Token
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/[0.04] py-32 px-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-20 uppercase tracking-[0.4em] font-bold text-[9px] text-zinc-600">
                    <div className="flex items-center gap-4 text-white">
                        <Box className="w-5 h-5" strokeWidth={2.5} />
                        <span className="text-sm tracking-[-0.02em] font-black lowercase opacity-100">grain</span>
                    </div>

                    <div className="flex gap-16">
                        <Link href="#" className="hover:text-white transition-colors">Manifesto</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terminal</Link>
                        <Link href="#" className="hover:text-white transition-colors">IP Ops</Link>
                    </div>

                    <div className="flex items-center gap-10">
                        <span>© 2024 GRAIN CORP.</span>
                        <div className="flex gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                            <span className="text-green-500/80">SYSTEMS_OPERATIONAL</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
