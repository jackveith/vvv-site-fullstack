
export default function DisplayHeightLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="antialiased flex-1 h-[calc(100vh-var(--header-height)-var(--footer-height))]
            max-h-[calc(100vh-var(--header-height)-var(--footer-height))] overflow-hidden flex flex-col">
            {children}
        </div>
    );
}
