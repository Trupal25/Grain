import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignUpPage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
                {/* Logo */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center text-lg font-black">
                            G
                        </div>
                        <h1 className="text-2xl font-bold text-white">Grain</h1>
                    </div>
                    <p className="text-sm text-zinc-500">Creative AI Canvas</p>
                </div>

                <SignUp
                    appearance={{
                        baseTheme: dark,
                        variables: { colorPrimary: '#2563eb' },
                        elements: {
                            rootBox: "mx-auto",
                            card: "bg-zinc-900 border-zinc-800",
                        },
                    }}
                    routing="hash"
                    fallbackRedirectUrl="/"
                    signInUrl="/login"
                />
            </div>
        </div>
    );
}
