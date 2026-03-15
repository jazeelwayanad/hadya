
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // 1. Total Revenue
        const revenue = await prisma.donation.aggregate({
            _sum: { amount: true },
            where: { paymentStatus: 'SUCCESS' }
        });
        const totalRevenue = revenue._sum.amount || 0;

        // 2. Active Donors (Total unique successful donations for now, or just total successful donations)
        const totalDonations = await prisma.donation.count({
            where: { paymentStatus: 'SUCCESS' }
        });

        // Extinct stats: Batches and Units removed

        // 5. Recent Transactions
        const recentDonations = await prisma.donation.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
        });

        // 6. Payment Method Stats (for Reports)
        const paymentStats = await prisma.donation.groupBy({
            by: ['paymentMethod'],
            _sum: { amount: true },
            where: { paymentStatus: 'SUCCESS' },
        });

        // 7. Top Places (for Reports)
        const topPlacesAgg = await prisma.donation.groupBy({
            by: ['placeName'],
            _sum: { amount: true },
            _count: { _all: true },
            where: { paymentStatus: 'SUCCESS', placeName: { not: null } },
            orderBy: { _sum: { amount: 'desc' } },
            take: 5
        });
        const topPlaces = topPlacesAgg.map(p => ({
            name: p.placeName || "Unknown",
            totalAmount: p._sum.amount || 0,
            _count: { donations: p._count._all }
        }));

        // 8. Monthly Stats (for Reports - Current Month)
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyRevenue = await prisma.donation.aggregate({
            _sum: { amount: true },
            where: {
                paymentStatus: 'SUCCESS',
                createdAt: { gte: firstDay }
            }
        });

        return NextResponse.json({
            metrics: {
                totalRevenue,
                totalDonations,
                monthlyRevenue: monthlyRevenue._sum.amount || 0
            },
            recentDonations,
            reports: {
                paymentStats,
                topPlaces
            }
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
