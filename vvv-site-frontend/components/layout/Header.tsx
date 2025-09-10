"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Header() {
    return (
        <header className="w-full border-b bg-background">
            <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
                {/* Logo / Brand */}
                <Link href="/" className="text-xl font-bold">
                    MySite
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

                {/* Call to action */}
                <Button size="sm">Sign In</Button>
            </div>
        </header>
    )
}
