import type { Metadata } from "next";
import { Geist_Mono, Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
    variable: "--font-space-grotesk",
    subsets: ["latin"],
    weight: ["400", "700"],
})


const plusJakartaSans = Plus_Jakarta_Sans({
    variable: "--font-plus-jakarta-sans",
    subsets: ["latin"],
    weight: ["200", "400", "700", "800"],
})

export const metadata: Metadata = {
    title: "All You Need is V",
    description: "kappadaniels",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${spaceGrotesk.variable} ${plusJakartaSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
            <body>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    <div className="antialiased min-h-screen flex flex-col">
                        <Header />
                        <main className="flex-1"> {children} </main>
                        <Footer />
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}
