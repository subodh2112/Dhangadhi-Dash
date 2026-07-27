import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TransactionHistory from "@/components/customer/TransactionHistory";

export default function Transactions() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground mb-6">Transaction History</h1>
          <TransactionHistory />
        </div>
      </main>
      <Footer />
    </div>
  );
}