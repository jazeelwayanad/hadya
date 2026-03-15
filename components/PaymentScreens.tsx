"use client"

import * as React from "react"
import { Loader2, QrCode, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QRCodeSVG } from "qrcode.react"

interface PaymentScreensProps {
    type: "qr" 
    amount: string
    name: string
    qrString?: string
    donationId?: string
    onCancel: () => void
    onSuccess: (data: any) => void
}

export function PaymentScreens({
    type,
    amount,
    name,
    qrString, // Now we just expect the exact upi://pay string or anything we want to generate QR for
    donationId,
    onCancel,
    onSuccess
}: PaymentScreensProps) {

    // We only support "qr" type now, so no need to check for "razorpay"

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center bg-white rounded-[2rem] shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-[#115E59]" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Scan to Pay</h2>
            </div>

            <div className="relative p-3 bg-white border-2 border-[#115E59]/20 rounded-3xl group transition-all hover:border-[#115E59]/40">
                {qrString ? (
                    <div className="p-4 bg-white rounded-xl">
                        <QRCodeSVG value={qrString} size={200} level="H" includeMargin={false} />
                    </div>
                ) : (
                    <div className="w-64 h-64 flex items-center justify-center">
                        <Loader2 className="animate-spin text-gray-300" />
                    </div>
                )}
            </div>

            <div className="space-y-2 w-full">
                <p className="text-sm font-medium text-gray-700">₹{amount}</p>
                <p className="text-xs text-gray-500 leading-relaxed px-4">
                    Scan this QR using any UPI app like Google Pay, PhonePe, or Paytm to complete your donation. After scanning and paying, your payment will be manually verified by the admin.
                </p>
            </div>
            
            <Button
                onClick={() => onSuccess({amount, name, transactionId: donationId, date: new Date().toLocaleString()})}
                className="w-full bg-[#115E59] hover:bg-[#0f504c] text-white h-12 rounded-2xl font-semibold"
            >
                I have completed the payment
            </Button>

            <Button
                variant="outline"
                onClick={onCancel}
                className="w-full border-gray-200 text-gray-500 hover:bg-gray-50 h-10 rounded-xl font-semibold mt-2"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
        </div>
    )
}
