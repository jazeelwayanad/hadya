"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Footer } from "@/components/Footer"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Loader2, Check } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { PaymentScreens } from "@/components/PaymentScreens"

const countries = [
    { code: "+91", name: "India", iso: "in", flag: "🇮🇳" },
    { code: "+971", name: "UAE", iso: "ae", flag: "🇦🇪" },
    { code: "+966", name: "Saudi Arabia", iso: "sa", flag: "🇸🇦" },
    { code: "+1", name: "USA", iso: "us", flag: "🇺🇸" },
    { code: "+44", name: "UK", iso: "gb", flag: "🇬🇧" },
    { code: "+974", name: "Qatar", iso: "qa", flag: "🇶🇦" },
    { code: "+965", name: "Kuwait", iso: "kw", flag: "🇰🇼" },
    { code: "+968", name: "Oman", iso: "om", flag: "🇴🇲" },
    { code: "+973", name: "Bahrain", iso: "bh", flag: "🇧🇭" },
    { code: "+60", name: "Malaysia", iso: "my", flag: "🇲🇾" },
    { code: "+65", name: "Singapore", iso: "sg", flag: "🇸🇬" },
]

export default function DonatePage() {
    const [amount, setAmount] = React.useState("")
    const [name, setName] = React.useState("")
    const [phone, setPhone] = React.useState("")
    const [hideName, setHideName] = React.useState(false)
    const [placeName, setPlaceName] = React.useState("")

    // Data state
    const [loading, setLoading] = React.useState(true)

    // Country Code state
    const [countryCode, setCountryCode] = React.useState("+91")
    const [countrySearch, setCountrySearch] = React.useState("")
    const [openCountryDropdown, setOpenCountryDropdown] = React.useState(false)
    const countryDropdownRef = React.useRef<HTMLDivElement>(null)

    const [presets, setPresets] = React.useState<number[]>([500, 1000, 2000, 5000, 10000])

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
                setOpenCountryDropdown(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Fetch preset amounts from settings
    React.useEffect(() => {
        const fetchPresets = async () => {
            try {
                const res = await fetch("/api/public/settings")
                if (res.ok) {
                    const data = await res.json()
                    if (Array.isArray(data.presetAmounts) && data.presetAmounts.length > 0) {
                        setPresets(data.presetAmounts.sort((a: number, b: number) => a - b))
                    }
                }
            } catch (error) {
                console.error("Error loading preset amounts", error)
            } finally {
                setLoading(false)
            }
        }
        fetchPresets()
    }, [])


    const filteredCountries = React.useMemo(() => {
        if (!countrySearch.trim()) return countries
        const q = countrySearch.toLowerCase()
        return countries.filter(c => c.name.toLowerCase().includes(q) || c.code.includes(q))
    }, [countrySearch])

    const selectedCountry = React.useMemo(() => {
        return countries.find(c => c.code === countryCode) || countries[0]
    }, [countryCode])

    // Selection state
    const [paymentMethod, setPaymentMethod] = React.useState("upi")
    const [showReceipt, setShowReceipt] = React.useState(false)
    const [receiptData, setReceiptData] = React.useState<any>(null)

    const [qrData, setQrData] = React.useState<{ upiId: string, donationId: string, qrString?: string, amount: string, name: string, isDesktop: boolean } | null>(null)
    const [showQrModal, setShowQrModal] = React.useState(false)
    const [showSuccessScreen, setShowSuccessScreen] = React.useState(false)

    // Helper to determine if user is on mobile or desktop
    React.useEffect(() => {
        const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
        const isMobile = Boolean(userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i));
    }, [])

    const handleSuccess = (data: any) => {
        setShowQrModal(false);
        setQrData(null);
        setReceiptData({
            amount: data.amount,
            name: data.name,
            transactionId: data.transactionId,
            date: new Date().toLocaleString()
        });
        setShowReceipt(true);
        toast.success("Donation details submitted! Pending Admin Approval.");
    };


    const handlePayment = async () => {
        if (!amount) {
            toast.error("Please enter an amount")
            return
        }
        if (!name) {
            toast.error("Please enter your name")
            return
        }
        if (!phone) {
            toast.error("Please enter your mobile number")
            return
        }
        if (!placeName) {
            toast.error("Please enter your Place or Area")
            return
        }

        setLoading(true);

        try {
            // Create PENDING donation
            const res = await fetch("/api/public/donations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount,
                    name,
                    mobile: `${countryCode} ${phone}`,
                    hideName,
                    placeName,
                })
            });

            if (!res.ok) {
                const err = await res.json();
                toast.error(err.error || "Failed to initiate payment");
                setLoading(false);
                return;
            }

            const data = await res.json();

            // Check if mobile or desktop
            const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
            const isMobile = Boolean(userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i));

            const campaignTitle = data.campaignTitle || "Hadya Ramadan";
            // Construct UPI Link
            // upi://pay?pa=UPI_ID&pn=PAYEE_NAME&am=AMOUNT&cu=INR&mc=0000
            const upiLink = `upi://pay?pa=${data.upiId}&pn=${encodeURIComponent(campaignTitle)}&am=${parseFloat(data.amount).toFixed(2)}&cu=INR&mc=0000&tr=${data.transactionId}&tn=Donation`;

            if (isMobile) {
                // If mobile, open UPI app directly, then show success
                window.location.href = upiLink;
                
                // Store receipt data for manual button click, preventing automatic redirect from breaking context
                setReceiptData({
                    amount: data.amount,
                    name: name,
                    transactionId: data.transactionId,
                    date: new Date().toLocaleString()
                });
                setShowSuccessScreen(true);
            } else {
                // If desktop, show QR code modal
                setQrData({
                    upiId: data.upiId,
                    donationId: data.transactionId,
                    qrString: upiLink,
                    amount: data.amount.toString(),
                    name: name,
                    isDesktop: true
                });
                setShowQrModal(true);
            }

            setLoading(false);

        } catch (error) {
            console.error("Error submitting donation", error)
            toast.error("An error occurred. Please try again.")
            setLoading(false);
        }
    }

    if (showSuccessScreen) {
        return (
            <div className="min-h-screen bg-[#FFF9ED] font-sans flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full mx-4">
                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Initiated</h2>
                    <p className="text-gray-500 text-sm mb-6">
                        Your UPI app has been opened. Please complete the payment. The admin will verify it shortly.
                    </p>
                    <Button
                        onClick={() => {
                            setShowSuccessScreen(false);
                            setShowReceipt(true);
                        }}
                        className="w-full bg-primary hover:brightness-90 text-white rounded-xl h-11 mb-3"
                    >
                        View Receipt
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setShowSuccessScreen(false)
                            setAmount("")
                            setName("")
                            setPhone("")
                        }}
                        className="w-full rounded-xl h-11 text-gray-600 border-gray-200"
                    >
                        Make another donation
                    </Button>
                </div>
            </div>
        )
    }

    if (showReceipt && receiptData) {
        // Redirect to receipt page
        if (typeof window !== 'undefined') {
            window.location.href = `/receipt/${receiptData.transactionId}`;
        }
        return (
            <div className="min-h-screen bg-[#FFF9ED] font-sans flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-gray-600">Redirecting to receipt...</p>
                </div>
            </div>
        )
    }

    // 2. QR Code Payment Screen (Desktop)
    if (showQrModal && qrData) {
        return (
            <PaymentScreens
                type="qr"
                amount={qrData.amount}
                name={qrData.name}
                qrString={qrData.qrString}
                donationId={qrData.donationId}
                onCancel={() => {
                    setShowQrModal(false)
                    setLoading(false)
                }}
                onSuccess={handleSuccess}
            />
        )
    }

    // 3. Loading (General)
    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9ED]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    // 4. Main Form
    return (
        <div className="min-h-screen bg-[#FFF9ED] font-sans relative">
            {/* Header */}
            <div className="container px-4 pt-6 pb-4 sm:px-6 sm:pt-10 sm:pb-6 flex items-center justify-between">
                <Link href="/">
                    <Button size="sm" className="rounded-full bg-[#8B4513] hover:bg-[#723a10] text-white px-4 h-8 text-[10px] sm:text-xs sm:px-5 sm:h-9 font-semibold shadow-sm">
                        <ArrowLeft className="w-3 h-3 mr-1" /> Back
                    </Button>
                </Link>
                <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Contribute Now</h1>
            </div>

            <div className="container px-4 mt-2 mb-10 max-w-lg mx-auto space-y-6">
                {/* Main Content Card */}
                <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 shadow-sm border border-gray-100 space-y-5">

                    {/* Amount Section */}
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-gray-700 font-medium text-xs">Enter Amount<span className="text-red-500">*</span></Label>
                        <Input
                            id="amount"
                            placeholder="Enter Amount"
                            value={amount}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (/^\d*\.?\d*$/.test(val)) {
                                    setAmount(val);
                                }
                            }}
                            className="h-12 border-primary rounded-xl bg-white text-base px-4 shadow-none placeholder:text-gray-300 text-gray-800 focus-visible:ring-2 focus-visible:ring-primary"
                            type="text"
                            inputMode="decimal"
                        />
                        <div className="flex flex-wrap gap-2 pt-1">
                            {presets.map((val) => (
                                <button
                                    key={val}
                                    onClick={() => setAmount(String(val))}
                                    className="bg-[#FDE68A] hover:bg-[#ffe066] text-black/90 text-[10px] sm:text-[11px] font-bold py-1.5 px-3 sm:px-3.5 rounded-full transition-all"
                                >
                                    ₹{val.toLocaleString("en-IN")}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Name Section */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="name" className="text-gray-700 font-medium text-xs">Enter Name<span className="text-red-500">*</span></Label>
                            <div className="flex items-center gap-1.5">
                                <Checkbox
                                    id="hide-name"
                                    className="w-4 h-4 rounded-[3px] border-gray-700 data-[state=checked]:bg-black data-[state=checked]:border-black"
                                    checked={hideName}
                                    onCheckedChange={(c) => setHideName(c as boolean)}
                                />
                                <Label htmlFor="hide-name" className="text-[10px] text-gray-500 font-medium cursor-pointer">Hide Name</Label>
                            </div>
                        </div>
                        <Input
                            id="name"
                            placeholder="Enter Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-12 border-primary rounded-xl bg-white px-4 text-gray-800 shadow-none placeholder:text-gray-300 focus-visible:ring-2 focus-visible:ring-primary"
                        />
                    </div>

                    {/* Phone Section */}
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-gray-700 font-medium text-xs">Mobile Number<span className="text-red-500">*</span></Label>
                        <div className="relative" ref={countryDropdownRef}>
                            {/* Country Code Dropdown Trigger */}
                            <div
                                className="flex items-center absolute left-3 top-[10px] z-10 gap-2 cursor-pointer p-1 rounded hover:bg-gray-100 transition-colors"
                                onClick={() => setOpenCountryDropdown(!openCountryDropdown)}
                            >
                                <img
                                    src={`https://flagcdn.com/w40/${selectedCountry.iso}.png`}
                                    alt={selectedCountry.name}
                                    className="w-5 h-3.5 object-cover rounded-[2px]"
                                />
                                <div className="h-4 w-[1px] bg-gray-300"></div>
                                <span className="text-sm font-medium text-black">{selectedCountry.code}</span>
                            </div>

                            {/* Country Dropdown */}
                            {openCountryDropdown && (
                                <div className="absolute top-full left-0 w-[240px] mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                    <Input
                                        autoFocus
                                        placeholder="Search country or code..."
                                        value={countrySearch}
                                        onChange={(e) => setCountrySearch(e.target.value)}
                                        className="h-9 text-xs mb-2 border-gray-200 text-gray-800"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                        {filteredCountries.length === 0 ? (
                                            <div className="p-2 text-center text-xs text-gray-400">No countries found</div>
                                        ) : (
                                            filteredCountries.map(c => (
                                                <div
                                                    key={c.code}
                                                    onClick={() => {
                                                        setCountryCode(c.code)
                                                        setOpenCountryDropdown(false)
                                                        setCountrySearch("")
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors hover:bg-teal-50 flex items-center justify-between cursor-pointer ${countryCode === c.code ? "bg-teal-50 text-teal-800 font-medium" : "text-gray-700"
                                                        }`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <img
                                                            src={`https://flagcdn.com/w40/${c.iso}.png`}
                                                            alt={c.name}
                                                            className="w-5 h-3.5 object-cover rounded-[2px]"
                                                        />
                                                        <span>{c.name}</span>
                                                    </span>
                                                    <span className="text-xs text-gray-400">{c.code}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            <Input
                                id="phone"
                                placeholder="Mobile Number"
                                value={phone}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^\d*$/.test(val)) {
                                        setPhone(val);
                                    }
                                }}
                                className="h-12 border-primary rounded-xl text-gray-800 bg-white pl-[90px] px-4 pl-20 shadow-none placeholder:text-gray-300 focus-visible:ring-2 focus-visible:ring-primary"
                                type="text"
                                inputMode="numeric"
                            />
                        </div>
                    </div>



                    {/* Place / Area Input */}
                    <div className="space-y-2">
                        <Label className="text-gray-700 font-medium text-xs">Place / Area<span className="text-red-500">*</span></Label>
                        <Input
                            id="place"
                            placeholder="Enter Place / Municipality name"
                            value={placeName}
                            onChange={(e) => setPlaceName(e.target.value)}
                            className="h-12 border-primary rounded-xl bg-white px-4 text-gray-800 shadow-none placeholder:text-gray-300 focus-visible:ring-2 focus-visible:ring-primary"
                        />
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-3 pt-2">
                        <Label className="text-xs font-medium text-gray-700">Payment Methods</Label>
                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                            <Label htmlFor="upi" className={`flex items-center justify-between border border-gray-400 rounded-xl px-4 py-3.5 bg-white shadow-none cursor-pointer hover:bg-gray-50 ${paymentMethod === 'upi' ? 'ring-2 ring-black border-transparent' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="w-full h-full object-contain" />
                                    </div>
                                    <span className="font-semibold text-base text-gray-800">Pay via UPI App / QR</span>
                                </div>
                                <RadioGroupItem value="upi" id="upi" className="w-5 h-5 text-black border-2 border-black" />
                            </Label>
                        </RadioGroup>
                    </div>

                    {/* Pay Button */}
                    <Button
                        onClick={handlePayment}
                        disabled={loading || !amount || parseFloat(amount) <= 0}
                        className="w-full h-14 bg-primary hover:brightness-90 text-white text-lg font-bold rounded-2xl shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                    >
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Proceed to Pay"}
                    </Button>

                </div>
            </div>
            <Footer />
        </div>
    )
}
