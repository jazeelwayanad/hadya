"use client"

import * as React from "react"
import { Loader2, Copy, Check, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"

interface PaymentScreensProps {
    amount: string
    name: string
    upiId: string
    qrString?: string
    donationId?: string
    isMobile?: boolean
    onCancel: () => void
    onSuccess: (data: any) => void
    // kept for backward compat
    type?: string
}

const UPI_APPS = [
    {
        id: "gpay",
        label: "GPay",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png",
        scheme: (upiLink: string) => upiLink.replace("upi://", "tez://upi/"),
    },
    {
        id: "phonepe",
        label: "PhonePe",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/512px-PhonePe_Logo.svg.png",
        scheme: (upiLink: string) => upiLink.replace("upi://pay", "phonepe://pay"),
    },
    {
        id: "paytm",
        label: "Paytm",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/512px-Paytm_Logo_%28standalone%29.svg.png",
        scheme: (upiLink: string) => upiLink,     // paytm handles generic upi://
    },
    {
        id: "bhim",
        label: "BHIM",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/BHIM-Unified-Payments-Interface.svg/512px-BHIM-Unified-Payments-Interface.svg.png",
        scheme: (upiLink: string) => upiLink,
    },
]

function openUpiLink(link: string) {
    const anchor = document.createElement("a")
    anchor.href = link
    anchor.style.display = "none"
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
}

export function PaymentScreens({
    amount,
    name,
    upiId,
    qrString,
    donationId,
    isMobile = false,
    onCancel,
    onSuccess,
}: PaymentScreensProps) {
    const [copied, setCopied] = React.useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(upiId).then(() => {
            setCopied(true)
            toast.success("UPI ID copied!")
            setTimeout(() => setCopied(false), 2500)
        })
    }

    const handleAppClick = (app: (typeof UPI_APPS)[0]) => {
        if (!qrString) return
        openUpiLink(app.scheme(qrString))
    }

    return (
        <div className="flex flex-col items-center justify-center p-5 sm:p-8 space-y-5 text-center bg-white rounded-[2rem] shadow-sm border border-gray-100 w-full max-w-sm mx-auto">

            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
                <p className="text-xs text-gray-400 mt-0.5">Scan QR or tap your UPI app below</p>
            </div>

            {/* Amount badge */}
            <div className="bg-primary/10 text-primary font-bold text-2xl px-6 py-2 rounded-2xl">
                ₹{parseFloat(amount).toLocaleString("en-IN")}
            </div>

            {/* QR Code */}
            <div className="p-3 bg-white border-2 border-primary/20 rounded-3xl">
                {qrString ? (
                    <div className="p-2 bg-white rounded-xl">
                        <QRCodeSVG value={qrString} size={190} level="H" includeMargin={false} />
                    </div>
                ) : (
                    <div className="w-[190px] h-[190px] flex items-center justify-center">
                        <Loader2 className="animate-spin text-gray-300 w-8 h-8" />
                    </div>
                )}
            </div>

            {/* UPI ID Copy Row */}
            <div className="w-full flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <div className="text-left min-w-0">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">UPI ID</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{upiId}</p>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 shrink-0 bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>

            {/* UPI App Buttons — mobile only */}
            {isMobile && qrString && (
                <div className="w-full">
                    <p className="text-xs text-gray-400 mb-3 font-medium">Or open directly in your app</p>
                    <div className="grid grid-cols-4 gap-2">
                        {UPI_APPS.map((app) => (
                            <button
                                key={app.id}
                                onClick={() => handleAppClick(app)}
                                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all border border-gray-100"
                            >
                                <img
                                    src={app.logo}
                                    alt={app.label}
                                    className="w-9 h-9 object-contain rounded-lg"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none"
                                    }}
                                />
                                <span className="text-[10px] font-semibold text-gray-600">{app.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <p className="text-[11px] text-gray-400 leading-relaxed px-2">
                After completing the payment, tap <strong className="text-gray-600">I Paid</strong> below. Admin will verify and confirm your donation.
            </p>

            {/* I Paid */}
            <Button
                onClick={() => onSuccess({ amount, name, transactionId: donationId, date: new Date().toLocaleString() })}
                className="w-full bg-primary hover:brightness-90 text-white h-12 rounded-2xl font-semibold text-base shadow"
            >
                ✓ I Paid
            </Button>

            {/* Back */}
            <Button
                variant="outline"
                onClick={onCancel}
                className="w-full border-gray-200 text-gray-500 hover:bg-gray-50 h-10 rounded-xl font-semibold"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
        </div>
    )
}
