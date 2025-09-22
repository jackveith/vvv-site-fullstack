
export default function Footer() {
    return (
        <footer className="w-full border-t bg-background">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 p-4 text-sm text-muted-foreground md:flex-row">
                <p>&copy; {new Date().getFullYear()} Jack Veith. All rights reserved.</p>
                <div className="flex gap-4">
                    <a href="https://www.linkedin.com/in/jveith/" target="_blank" rel="noopener noreferrer">
                        Linkedin
                    </a>
                    <a href="https://github.com/jackveith" target="_blank" rel="noopener noreferrer">
                        GitHub
                    </a>
                </div>
            </div>
        </footer>
    )
}
