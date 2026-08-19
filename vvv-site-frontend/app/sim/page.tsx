import StarMap from '@/components/StarMap';

type StarSystem = {
    id: string;
    name: string;
    x: number;
    y: number;
    z: number;
};

async function getStarSystems(): Promise<StarSystem[]> {
    console.log(`${process.env.API_URL}`)
    const res = await fetch(`${process.env.API_URL}/api/systems`, {
        cache: 'no-store', // live simulation state — always fetch fresh
    });

    if (!res.ok) {
        throw new Error('Failed to fetch star systems');
    }

    return res.json();
}

export default async function Home() {

    const systems = await getStarSystems();

    return (
        <div className="flex flex-col overflow-hidden bg-black w-full h-full min-h-0">
            <StarMap systems={systems} />
        </div>
    );
}
