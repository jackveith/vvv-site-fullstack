import { PrismaClient } from './generated/prisma/client.js';

// One shared instance
const prisma = new PrismaClient();

export default prisma;
