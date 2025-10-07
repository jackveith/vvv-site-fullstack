
export default function DefaultLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    //currently a dummy layout that does nothing and exhibits the properties of the Root Layout
    return (
        <div>
            {children}
        </div>
    );
}
