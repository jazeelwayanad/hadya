import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PaymentStatus } from '@prisma/client';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const {
            status,
            amount,
            name,
            mobile,
            transactionId,
            placeName,
            paymentMethod,
            hideName,
            category
        } = body;

        // If status is provided, validate it
        if (status && !['PENDING', 'SUCCESS', 'FAILED'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be PENDING, SUCCESS, or FAILED.' },
                { status: 400 }
            );
        }

        // Fetch the current donation
        const existingDonation = await prisma.donation.findUnique({
            where: { id }
        });

        if (!existingDonation) {
            return NextResponse.json(
                { error: 'Donation not found' },
                { status: 404 }
            );
        }

        // Prepare update data
        const updateData: any = {};
        if (status) updateData.paymentStatus = status as PaymentStatus;
        if (amount !== undefined) updateData.amount = parseFloat(amount);
        if (name !== undefined) updateData.name = name;
        if (mobile !== undefined) updateData.mobile = mobile;
        if (transactionId !== undefined) updateData.transactionId = transactionId;
        if (placeName !== undefined) updateData.placeName = placeName;
        if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
        if (hideName !== undefined) updateData.hideName = hideName;
        if (category !== undefined) updateData.category = category;

        const updatedDonation = await prisma.donation.update({
            where: { id },
            data: updateData,
            include: {
                collectedBy: { select: { name: true } }
            }
        });

        return NextResponse.json(updatedDonation);
    } catch (error) {
        console.error('Error updating donation status:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
