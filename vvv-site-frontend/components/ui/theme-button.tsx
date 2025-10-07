"use client"

import * as React from "react"
import { Moon, Sun, Eclipse } from "lucide-react"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
    const [mounted, setMounted] = useState(false)
    const { theme, setTheme } = useTheme()

    const changeTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark")
    }

    useEffect(() => {
        setMounted(true)
    }, [])

    //render a dummy button to fill space and prevent layout shift until button mounts
    if (!mounted) {
        return (
            <div
                className="flex items-center justify-center h-[2rem] w-[2rem] rounded-md bg-muted animate-pulse"
                aria-hidden="true"
            />
        )
    }

    return (
        <a onClick={changeTheme} className="flex items-center justify-center h-[2rem] w-[2rem] bg-foreground rounded-md cursor-pointer">
            <Eclipse className="h-[1.2rem] w-[1.2rem] scale-100 transition-all stroke-background" />
        </a>

    )
}
