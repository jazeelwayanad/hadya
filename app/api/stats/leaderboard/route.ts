import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") || "places"
    const limit = parseInt(searchParams.get("limit") || "10")
    const period = searchParams.get("period") // "today" or null for all-time

    // Build date filter for "today"
    let dateFilter: any = {}
    if (period === "today") {
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        dateFilter = { createdAt: { gte: startOfDay } }
    }

    try {
        let result: any[] = []

        if (type === "places") {
            const agg = await prisma.donation.groupBy({
                by: ['placeName'],
                _sum: { amount: true },
                where: { paymentStatus: "SUCCESS", placeName: { not: null }, ...dateFilter },
                orderBy: { _sum: { amount: 'desc' } },
                take: limit
            })

            result = agg.map((item, index) => {
                return { 
                    rank: index + 1,
                    name: item.placeName || "Unknown", 
                    amount: item._sum.amount 
                }
            })

        } else if (type === "individuals") {
            // Group by mobile and name
            const agg = await prisma.donation.groupBy({
                by: ['name', 'mobile', 'placeName', 'hideName'],
                _sum: { amount: true },
                where: { paymentStatus: "SUCCESS", ...dateFilter },
                orderBy: { _sum: { amount: 'desc' } },
                take: limit
            })

            result = agg.map((item, index) => {
                return {
                    rank: index + 1,
                    name: (item.hideName ? "Well Wisher" : item.name) || "Anonymous",
                    place: item.placeName || "General",
                    amount: item._sum.amount
                }
            })
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error("Error fetching leaderboard:", error)
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
    }
}
