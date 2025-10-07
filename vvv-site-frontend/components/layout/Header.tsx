"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Github, Linkedin } from "lucide-react"
import { ModeToggle } from "@/components/ui/theme-button"

function toggleDarkMode(event: React.MouseEvent) {
    document.documentElement.classList.toggle("dark");
}

export default function Header() {
    return (
        <header className="font-jakarta w-full h-[var(--header-height)] border-b bg-background">
            <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
                {/* Logo / Brand */}
                <Link href="/" className="font-grotesk text-3xl font-bold">
                    Jack Veith
                </Link>

                {/* Navigation */}
                <nav className="flex gap-4">
                    <Link href="/" className="text-md font-medium hover:underline">
                        Home
                    </Link>
                    <Link href="/about" className="text-md font-medium hover:underline">
                        About
                    </Link>
                    <Link href="/contact" className="text-md font-medium hover:underline">
                        Contact
                    </Link>
                </nav>

                <div className="flex items-center justify-between p-4 gap-4">
                    <a href="https://github.com/jackveith" target="_blank" rel="noreferrer">
                        <Github className="hover:stroke-secondary" />
                    </a>
                    <a href="https://www.linkedin.com/in/jveith/" target="_blank" rel="noreferrer">
                        <Linkedin className="hover:stroke-secondary" />
                    </a>
                    <ModeToggle />
                </div>

            </div>
        </header>
    )
}
