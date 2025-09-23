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

    if (!mounted) {
        return null
    }

    //    return (
    //        <DropdownMenu>
    //            <DropdownMenuTrigger asChild>
    //                <Button variant="outline" size="icon">
    //                    <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
    //                    <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    //                    <span className="sr-only">Toggle theme</span>
    //                </Button>
    //            </DropdownMenuTrigger>
    //            <DropdownMenuContent align="end">
    //                <DropdownMenuItem onClick={() => setTheme("light")}>
    //                    Light
    //                </DropdownMenuItem>
    //                <DropdownMenuItem onClick={() => setTheme("dark")}>
    //                    Dark
    //                </DropdownMenuItem>
    //                <DropdownMenuItem onClick={() => setTheme("system")}>
    //                    System
    //                </DropdownMenuItem>
    //            </DropdownMenuContent>
    //        </DropdownMenu>
    //    )

    return (
        <a onClick={changeTheme} className="flex items-center justify-center h-[2rem] w-[2rem] bg-foreground rounded-md">
            <Eclipse className="h-[1.2rem] w-[1.2rem] scale-100 transition-all stroke-background" />
        </a>

    )
}
