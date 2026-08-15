import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import Image from "next/image"
import { LucideIcon } from 'lucide-react'

// static image data

type ContactCardProps = {
    icon: LucideIcon
    label: string
    href: string
    linktext?: string
}

export function ContactCard({ icon: Icon, label, href, linktext }: ContactCardProps) {
    return (
        <Card className='bg-card hover:bg-primary w-full p-8 transition-all'>
            <CardContent className='flex items-center gap-4 p-4'>
                <Image src='/images/contact-card-bg.svg' alt='' width={48} height={48} className='absolute -z-10 opacity-10' />
                <Icon className='w-8 h-8 shrink-0' />
                <span className='flex-1 font-medium'>{label}</span>
                <Link href={href} className='' target='_blank' rel='noopener noreferrer'>
                    {linktext ?? "Open"}
                </Link>
            </CardContent>
        </Card>
    );
}


