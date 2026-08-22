import Delaunator from "delaunator";
import { StarSystem, SystemEdge } from "./types.js";

export interface SystemEdgeOptions {
    redundancy?: number;
}

export class UnionFind {
    private parent: number[];
    private rank: number[];

    constructor(size: number) {
        this.parent = Array.from({ length: size }, (_, i) => i);
        this.rank = new Array(size).fill(0);
    }

    find(x: number): number {
        if (this.parent[x] !== x) {
            this.parent[x] = this.find(this.parent[x]);
        }
        return this.parent[x];
    }

    union(x: number, y: number): boolean {
        const rootX = this.find(x);
        const rootY = this.find(y);
        if (rootX === rootY) return false;

        if (this.rank[rootX] < this.rank[rootY]) {
            this.parent[rootX] = rootY;
        } else if (this.rank[rootX] > this.rank[rootY]) {
            this.parent[rootY] = rootX;
        } else {
            this.parent[rootY] = rootX;
            this.rank[rootX]++;
        }
        return true;
    }
}

export function edgeKey(a: string, b: string): string {
    return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function computeDelaunayEdges(points: StarSystem[]) {

    const coords = new Float64Array(points.length * 2);
    points.forEach((p, i) => {
        coords[i * 2] = p.x;
        coords[i * 2 + 1] = p.y;
    });

    const delaunay = new Delaunator(coords);
    const edgeMap = new Map<string, SystemEdge>();

    const addEdge = (i: number, j: number) => {
        const a = points[i];
        const b = points[j];
        const key = edgeKey(a.id, b.id);
        if (edgeMap.has(key)) return;
        edgeMap.set(key, { a: a.id, b: b.id, distance: Math.hypot(a.x - b.x, a.y - b.y) });
    };

    //after Delaunator creates triangles, add all edges (3 per tri)
    //to the candidate edge array for finding the MST
    for (let t = 0; t < delaunay.triangles.length; t += 3) {
        const p0 = delaunay.triangles[t];
        const p1 = delaunay.triangles[t + 1];
        const p2 = delaunay.triangles[t + 2];
        addEdge(p0, p1);
        addEdge(p1, p2);
        addEdge(p2, p0);
    }

    return Array.from(edgeMap.values());
}

//for finding Minimum Spanning Tree of the StarSystem graph
export function kruskalMST(edges: SystemEdge[], points: StarSystem[]): SystemEdge[] {
    const idToIndex = new Map(points.map((p, i) => [p.id, i]));
    const sorted = [...edges].sort((a, b) => a.distance - b.distance);
    const uf = new UnionFind(points.length);
    const mstEdges: SystemEdge[] = [];

    //add shortest edge that doesnt form a cycle to MST
    for (const edge of sorted) {
        const i = idToIndex.get(edge.a)!;
        const j = idToIndex.get(edge.b)!;
        if (uf.union(i, j)) {
            mstEdges.push(edge);
        }
    }

    return mstEdges;
}


//main function taking a collection of StarSystems and produces
//lanes (edges) between them based on the MST of the graph 
export function generateSystemEdges(
    systems: StarSystem[],
    options: SystemEdgeOptions = {}
): SystemEdge[] {

    const { redundancy = .25 } = options;

    //1. compute candidate edges and MST
    const delaunayEdges = computeDelaunayEdges(systems);
    const mstEdges = kruskalMST(delaunayEdges, systems);

    //2. find all the "leftover" delaunayEdges (i.e. all the edges not in the MST)
    //and sort them by their length. then add extra edges to the MST to
    //form the final graph, based on redundancy value
    const mstKeys = new Set(mstEdges.map((e) => edgeKey(e.a, e.b)));
    const leftover = delaunayEdges
        .filter((e) => !mstKeys.has(edgeKey(e.a, e.b)))
        .sort((a, b) => a.distance - b.distance);
    const extraCount = Math.round(leftover.length * redundancy);
    const extraEdges = leftover.slice(0, extraCount);

    return [...mstEdges, ...extraEdges];
}
