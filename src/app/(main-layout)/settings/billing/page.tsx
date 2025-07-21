import Image from "next/image";
import Link from "next/link";
import { HiChevronLeft } from "react-icons/hi";
import StripeImage from "@/src/stripe.png";

export default function BillingPage() {
  return (
    <div className="flex flex-col items-center py-16 gap-8 w-[400px] md:w-[500px] lg:w-[700px] xl:w-[900px] mx-auto">
      <Link href="/settings" className="text-blue-700 hover:text-blue-500 flex items-center gap-2 mr-auto">
        <HiChevronLeft />
        Back to Settings
      </Link>
      <h1 className="text-3xl font-bold">Billing</h1>
      <p className="text-center text-gray-600 w-full md:w-4/6">
        Manage how you receive deposits and pay for rent. You can set up your preferred payment methods and view your billing history.
      </p>
      <div className="p-8 flex flex-col gap-16 rounded-lg border shadow-md w-full">
        <section className="space-y-4">
          <h3 className="text-xl font-semibold">Connect via Stripe</h3>
          <div className="space-y-2">
            <div className="border p-4 rounded-lg w-[400px] space-y-2">
              <Image className="w-32" src={StripeImage} alt="stripe" />
              <p>Connect to Stripe to pay or receive payments.</p>
              <button className="font-semibold tracking-wide relative rounded-md after:content-normal after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:absolute after:bg-gray-100 after:w-full after:h-full after:opacity-0 hover:after:opacity-100 after:-z-10 z-10 after:scale-125 after:rounded-md">CONNECT</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
