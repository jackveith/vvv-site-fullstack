
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"


export default function DefaultLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="antialiased min-h-screen flex flex-col">
            <Header />
            <main className="flex-1"> {children} </main>
            <Footer />
        </div>

    );
}
