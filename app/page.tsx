'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
    Sparkles,
    Layout,
    FileText,
    Wand2,
    Video,
    ImageIcon,
    Zap,
    ArrowRight,
    Check,
    Play,
    ChevronRight,
    Star,
    Users,
    Layers,
    MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
    {
        icon: Layout,
        title: 'Infinite Canvas',
        description: 'Drag, drop, and arrange your ideas on a limitless canvas. Think Miro meets Figma.',
        gradient: 'from-purple-500 to-pink-500',
    },
    {
        icon: FileText,
        title: 'Rich Documents',
        description: 'Create beautiful notes with a Notion-like editor. Markdown, embedded media, and more.',
        gradient: 'from-blue-500 to-cyan-500',
    },
    {
        icon: Wand2,
        title: 'AI Generation',
        description: 'Generate stunning images and videos with a single prompt. Powered by cutting-edge AI.',
        gradient: 'from-orange-500 to-red-500',
    },
    {
        icon: Layers,
        title: 'Visual Workflows',
        description: 'Connect nodes to build AI pipelines. Chain prompts, images, and videos together.',
        gradient: 'from-green-500 to-emerald-500',
    },
];

const useCases = [
    { icon: ImageIcon, label: 'Storyboarding', color: 'text-purple-400' },
    { icon: Video, label: 'Video Production', color: 'text-pink-400' },
    { icon: MessageSquare, label: 'Content Creation', color: 'text-blue-400' },
    { icon: Sparkles, label: 'Brainstorming', color: 'text-yellow-400' },
    { icon: Users, label: 'Team Collaboration', color: 'text-green-400' },
    { icon: Zap, label: 'Rapid Prototyping', color: 'text-orange-400' },
];

const testimonials = [
    {
        quote: "Grain has completely transformed how I create content. The AI generation is unreal.",
        author: "Sarah Chen",
        role: "Creative Director",
        avatar: "SC",
    },
    {
        quote: "Finally, a tool that combines the best of Miro and Notion with powerful AI capabilities.",
        author: "Marcus Johnson",
        role: "Product Designer",
        avatar: "MJ",
    },
    {
        quote: "The workflow builder is a game-changer for my video production pipeline.",
        author: "Elena Rodriguez",
        role: "Video Producer",
        avatar: "ER",
    },
];

export default function HomePage() {
    const { isSignedIn, isLoaded } = useUser();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Redirect signed-in users to dashboard
    useEffect(() => {
        if (isLoaded && isSignedIn) {
            router.push('/dashboard');
        }
    }, [isLoaded, isSignedIn, router]);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-zinc-950 text-white overflow-x-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute top-1/3 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
                <div className="absolute bottom-20 right-1/4 w-60 h-60 bg-pink-500/20 rounded-full blur-[100px] animate-pulse delay-500" />
            </div>

            {/* Navigation */}
            <nav className="relative z-50 border-b border-white/10 backdrop-blur-xl bg-zinc-950/80">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-lg">
                            G
                        </div>
                        <span className="text-xl font-bold">Grain</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href="#features" className="text-zinc-400 hover:text-white transition-colors">
                            Features
                        </Link>
                        <Link href="#use-cases" className="text-zinc-400 hover:text-white transition-colors">
                            Use Cases
                        </Link>
                        <Link href="#testimonials" className="text-zinc-400 hover:text-white transition-colors">
                            Testimonials
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/sign-in">
                            <Button variant="ghost" className="text-zinc-400 hover:text-white">
                                Sign In
                            </Button>
                        </Link>
                        <Link href="/sign-up">
                            <Button className="bg-white text-black hover:bg-zinc-200">
                                Get Started Free
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-zinc-300">Powered by Gemini, Imagen & Veo</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
                        <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                            The Creative AI Canvas
                        </span>
                        <br />
                        <span className="text-zinc-400">for Visual Thinkers</span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-12">
                        Combine the power of an infinite canvas, rich documents, and AI generation
                        in one seamless workspace. Create, connect, and bring your ideas to life.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Link href="/sign-up">
                            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 py-6 text-lg shadow-lg shadow-purple-500/25">
                                Start Creating Free
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                        <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg">
                            <Play className="mr-2 w-5 h-5" />
                            Watch Demo
                        </Button>
                    </div>

                    {/* Hero Visual */}
                    <div className="relative max-w-5xl mx-auto">
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10 pointer-events-none" />
                        <div className="relative rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm overflow-hidden shadow-2xl shadow-purple-500/10">
                            {/* Mock Canvas UI */}
                            <div className="aspect-[16/10] p-4">
                                {/* Toolbar */}
                                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                            <ImageIcon className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <Video className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                            <FileText className="w-4 h-4 text-green-400" />
                                        </div>
                                    </div>
                                    <div className="flex-1" />
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-sm text-zinc-400">
                                        <Wand2 className="w-4 h-4" />
                                        AI Ready
                                    </div>
                                </div>

                                {/* Canvas Content */}
                                <div className="grid grid-cols-3 gap-4 h-[calc(100%-60px)]">
                                    {/* Left Panel - Document */}
                                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
                                        <div className="text-sm font-medium mb-3">Campaign Brief</div>
                                        <div className="space-y-2">
                                            <div className="h-2 bg-white/10 rounded w-full" />
                                            <div className="h-2 bg-white/10 rounded w-4/5" />
                                            <div className="h-2 bg-white/10 rounded w-3/5" />
                                        </div>
                                    </div>

                                    {/* Center - Image Node */}
                                    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30 flex flex-col">
                                        <div className="text-sm font-medium mb-3 flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4 text-purple-400" />
                                            Generated Image
                                        </div>
                                        <div className="flex-1 rounded-lg bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center">
                                            <Sparkles className="w-8 h-8 text-purple-300" />
                                        </div>
                                    </div>

                                    {/* Right - Video Node */}
                                    <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-500/30 flex flex-col">
                                        <div className="text-sm font-medium mb-3 flex items-center gap-2">
                                            <Video className="w-4 h-4 text-blue-400" />
                                            AI Video
                                        </div>
                                        <div className="flex-1 rounded-lg bg-gradient-to-br from-blue-600/30 to-cyan-600/30 flex items-center justify-center">
                                            <Play className="w-8 h-8 text-blue-300" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Everything you need to create
                        </h2>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                            A powerful toolkit that combines visual thinking with AI-powered creation.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group relative p-8 rounded-2xl bg-zinc-900/50 border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-zinc-400 text-lg">{feature.description}</p>

                                <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight className="w-6 h-6 text-zinc-500" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Use Cases Section */}
            <section id="use-cases" className="relative py-32 px-6 bg-zinc-900/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Built for creators
                        </h2>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                            Whether you're a solo creator or part of a team, Grain adapts to your workflow.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {useCases.map((useCase, index) => (
                            <div
                                key={index}
                                className="flex flex-col items-center p-6 rounded-xl bg-zinc-800/50 border border-white/5 hover:border-white/20 transition-all hover:-translate-y-1"
                            >
                                <useCase.icon className={`w-8 h-8 ${useCase.color} mb-3`} />
                                <span className="text-sm font-medium text-center">{useCase.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="relative py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Loved by creators
                        </h2>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                            See what our users are saying about Grain.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className="p-8 rounded-2xl bg-zinc-900/50 border border-white/10"
                            >
                                <div className="flex items-center gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    ))}
                                </div>
                                <p className="text-lg text-zinc-300 mb-6 italic">
                                    "{testimonial.quote}"
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-sm">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <div className="font-medium">{testimonial.author}</div>
                                        <div className="text-sm text-zinc-500">{testimonial.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-32 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="p-12 rounded-3xl bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20 border border-white/10">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Ready to create?
                        </h2>
                        <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
                            Join thousands of creators who are already building with Grain.
                            Start for free, no credit card required.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/sign-up">
                                <Button size="lg" className="bg-white text-black hover:bg-zinc-200 px-8 py-6 text-lg">
                                    Get Started Free
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </Link>
                        </div>
                        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-zinc-500">
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-400" />
                                Free to start
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-400" />
                                No credit card
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-400" />
                                100 AI credits
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-sm">
                            G
                        </div>
                        <span className="font-bold">Grain</span>
                    </div>

                    <div className="flex items-center gap-8 text-sm text-zinc-500">
                        <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms</Link>
                        <Link href="#" className="hover:text-white transition-colors">Contact</Link>
                    </div>

                    <div className="text-sm text-zinc-500">
                        © 2024 Grain. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
