
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"


export default function DisplayHeightLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="antialiased h-screen max-h-screen overflow-hidden flex flex-col"
            style={{ height: "100vh" }}>
            <Header />
            <main className="flex-1"> {children} </main>
            <Footer />
        </div>

    );
}
