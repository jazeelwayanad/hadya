import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
    try {
        // 1. Total Amount Collected
        const totalAgg = await prisma.donation.aggregate({
            _sum: {
                amount: true
            },
            where: {
                paymentStatus: "SUCCESS" // Only count successful payments
            }
        })
        const totalAmount = totalAgg._sum.amount || 0

        // 2. Top Places (by total amount collected)
        const topPlacesAgg = await prisma.donation.groupBy({
            by: ['placeName'],
            _sum: {
                amount: true
            },
            where: {
                paymentStatus: "SUCCESS",
                placeName: { not: null }
            },
            orderBy: {
                _sum: {
                    amount: 'desc'
                }
            },
            take: 3
        })

        const topBatches = topPlacesAgg.map((item, index) => {
            return {
                id: `place-${index}`,
                name: item.placeName || "Unknown Place",
                amount: item._sum.amount || 0
            }
        })

        return NextResponse.json({
            totalAmount,
            topBatches // keeping the same key for backward compatibility if used in UI
        })
    } catch (error) {
        console.error("Error fetching stats:", error)
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }
}
