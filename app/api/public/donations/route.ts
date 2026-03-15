import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            amount,
            name,
            mobile,
            hideName,
            placeName,
            category
        } = body;

        // Generate a simple unique transaction ID for reference
        // Format to strict alphanumeric without underscores to avoid UPI intent rejection
        const transactionId = `TXN${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

        const donation = await prisma.donation.create({
            data: {
                amount: parseFloat(amount),
                name,
                mobile,
                hideName: hideName || false,
                placeName: placeName || null,
                category: category === "PARENT" ? "PARENT" : "GENERAL",
                paymentMethod: "UPI",
                paymentStatus: "PENDING",
                transactionId: transactionId
            }
        });

        // Get UPI settings from database
        const settings = await prisma.settings.findFirst();

        return NextResponse.json({
            success: true,
            donationId: donation.id,
            transactionId: donation.transactionId,
            upiId: settings?.upiId || process.env.DEFAULT_UPI_ID || "",
            campaignTitle: settings?.campaignTitle || "Hadya Ramadan",
            amount: parseFloat(amount)
        });

    } catch (error) {
        console.error("Error creating PENDING donation:", error);

        // Return actual error context for debugging if needed
        return NextResponse.json(
            { error: "Failed to create donation request", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
