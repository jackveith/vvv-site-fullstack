
import DefaultLayout from '@/app/layouts/DefaultLayout'

//currently a dummy layout that does nothing and exhibits the properties of the Root Layout
export default function HomeLayout({ children }: { children: React.ReactNode }) {

    return <DefaultLayout> {children} </DefaultLayout>

}
