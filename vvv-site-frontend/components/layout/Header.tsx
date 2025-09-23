"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Github, Linkedin, Bubbles } from "lucide-react"
import { ModeToggle } from "@/components/ui/theme-button"

function toggleDarkMode(event: React.MouseEvent) {
    document.documentElement.classList.toggle("dark");
}

export default function Header() {
    return (
        <header className="w-full border-b bg-background">
            <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
                {/* Logo / Brand */}
                <Link href="/" className="text-xl font-bold">
                    Jack Veith
                </Link>

                {/* Navigation */}
                <nav className="flex gap-4">
                    <Link href="/about" className="text-sm font-medium hover:underline">
                        About
                    </Link>
                    <Link href="/contact" className="text-sm font-medium hover:underline">
                        Contact
                    </Link>
                </nav>

                <div className="flex items-end justify-between p-4 gap-4">
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
