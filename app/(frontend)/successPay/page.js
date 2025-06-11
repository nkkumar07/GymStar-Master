"use client";
<<<<<<< HEAD
=======
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
>>>>>>> da070be28c9c07cdd79861649da1c0f16c434dc5

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { GiGymBag } from "react-icons/gi";
import { FaDumbbell, FaHeartbeat } from "react-icons/fa";
<<<<<<< HEAD
import { API_URL } from "@/utils/api";
import { loadStripe } from "@stripe/stripe-js";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const SuccessPay = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  const runConfetti = () => {
    if (typeof window === 'undefined') return;

=======
import { loadStripe } from "@stripe/stripe-js";
import { API_URL } from "@/utils/api";

const runConfetti = () => {
  if (typeof window !== "undefined") {
>>>>>>> da070be28c9c07cdd79861649da1c0f16c434dc5
    import("canvas-confetti").then((confetti) => {
      confetti.default({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ff0000", "#00ff00", "#0000ff"],
      });

      setTimeout(() => {
        confetti.default({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#ffffff", "#4CAF50"],
        });
        confetti.default({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#ffffff", "#2196F3"],
        });
      }, 300);
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const session_id = params.get("session_id");

    if (!session_id) {
      toast.error("Missing session ID.");
      setIsProcessing(false);
      return;
    }

    const fetchSessionAndProcess = async () => {
<<<<<<< HEAD
      try {

        const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!stripeKey) throw new Error("Stripe public key is not defined");
=======
      const session_id = searchParams.get("session_id");
      if (!session_id) {
        toast.error("Missing session ID.");
        setIsProcessing(false);
        return;
      }

      try {
        const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!stripeKey) throw new Error("Stripe public key is not defined");

        const stripe = await loadStripe(stripeKey);
        if (!stripe) throw new Error("Stripe failed to initialize");

        const sessionRes = await fetch(`/api/stripe/session?session_id=${session_id}`);
        const session = await sessionRes.json();
>>>>>>> da070be28c9c07cdd79861649da1c0f16c434dc5

        const stripe = await loadStripe(stripeKey);
        if (!stripe) throw new Error("Stripe failed to initialize");

<<<<<<< HEAD


        const verificationResponse = await fetch(`/api/verify-payment?session_id=${session_id}`);
        const verificationData = await verificationResponse.json();

        if (!verificationResponse.ok || !verificationData.success) {
          throw new Error(verificationData.error || "Payment verification failed");
        }

=======
>>>>>>> da070be28c9c07cdd79861649da1c0f16c434dc5
        const {
          user_id,
          membership_id,
          price,
          originalPrice,
          discount,
          final_price,
          plan_type,
<<<<<<< HEAD
          promocode
        } = verificationData.session.metadata;

        const prevSubResponse = await fetch(`${API_URL}/subscription/by_user/${user_id}`);
        const prevSubs = prevSubResponse.ok ? await prevSubResponse.json() : [];

        let newStartDate = new Date();

        if (Array.isArray(prevSubs) && prevSubs.length > 0) {
          const latestSub = prevSubs.reduce((latest, current) => {
            return new Date(current.expiry_date) > new Date(latest.expiry_date) ? current : latest;
          }, prevSubs[0]);

=======
          promocode,
        } = session.metadata || {};

        if (!user_id || !membership_id || !final_price || !plan_type) {
          toast.error("Missing subscription metadata.");
          setIsProcessing(false);
          return;
        }

        const prevSubRes = await fetch(`${API_URL}/subscription/by_user/${user_id}`);
        const prevSubs = prevSubRes.ok ? await prevSubRes.json() : [];

        let newStartDate = new Date();
        if (Array.isArray(prevSubs) && prevSubs.length > 0) {
          const latestSub = prevSubs.reduce((latest, current) =>
            new Date(current.expiry_date) > new Date(latest.expiry_date) ? current : latest
          );
>>>>>>> da070be28c9c07cdd79861649da1c0f16c434dc5
          const latestExpiry = new Date(latestSub.expiry_date);
          if (latestExpiry > new Date()) newStartDate = latestExpiry;
        }

        const expiryDate = new Date(newStartDate);
<<<<<<< HEAD
        const durationMap = {
          monthly: () => expiryDate.setMonth(expiryDate.getMonth() + 1),
          "half-yearly": () => expiryDate.setMonth(expiryDate.getMonth() + 6),
          yearly: () => expiryDate.setFullYear(expiryDate.getFullYear() + 1)
        };

        if (!durationMap[plan_type]) {
          throw new Error("Invalid plan type");
        }
        durationMap[plan_type]();
=======
        if (plan_type === "monthly") expiryDate.setMonth(expiryDate.getMonth() + 1);
        else if (plan_type === "half-yearly") expiryDate.setMonth(expiryDate.getMonth() + 6);
        else if (plan_type === "yearly") expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        else throw new Error("Invalid plan type");
>>>>>>> da070be28c9c07cdd79861649da1c0f16c434dc5

        const createSub = await fetch(`${API_URL}/subscription`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id,
            membership_id,
            start_date: newStartDate.toISOString(),
            expiry_date: expiryDate.toISOString(),
            subtotal: parseFloat(originalPrice || price),
            discount: parseFloat(discount || 0),
            total: parseFloat(final_price),
            promocode: promocode || "None",
            payment_status: "paid",
          }),
        });

        if (!createSub.ok) throw new Error("Failed to create subscription");

        if (typeof window !== 'undefined') {
          localStorage.removeItem("cart");
        }

        runConfetti();
        setIsSuccess(true);
        toast.success("Payment successful! Subscription activated.");
      } catch (err) {
        console.error("Payment processing error:", err);
        toast.error(err.message || "Failed to complete payment processing");
      } finally {
        setIsProcessing(false);
      }
    };

<<<<<<< HEAD
    fetchSessionAndProcess();
  }, []);
=======
    if (typeof window !== "undefined") {
      fetchSessionAndProcess();
    }
  }, [searchParams]);
>>>>>>> da070be28c9c07cdd79861649da1c0f16c434dc5

  return (
    <div className="success-wrapper">
      <div className="small-container">
        <div className="success-content">
          <div className="icon-circle-small">
            <GiGymBag className="main-icon-small" />
            <FaDumbbell className="decor-icon-small dumbell-icon" />
            <FaHeartbeat className="decor-icon-small heart-icon" />
          </div>

          <h2 className="small-title">Welcome to GymStar Premium!</h2>
          <p className="small-subtitle">Your fitness transformation starts now</p>

          {isProcessing && (
            <>
              <div className="small-progress-bar">
                <div className="small-progress-fill animate-pulse"></div>
              </div>
              <p className="small-status-text">Activating your premium membership...</p>
            </>
          )}

          {!isProcessing && isSuccess && (
            <>
              <p className="text-green-600 font-semibold mt-4">
                Membership activated successfully!
              </p>
              <div className="small-benefits-box">
                <h4 className="small-benefits-title">Your Premium Benefits:</h4>
                <ul className="small-benefits-list">
                  <li>Unlimited access to all gym facilities</li>
                  <li>Personal training session</li>
                  <li>Premium workout plans</li>
                  <li>Nutrition guides</li>
                </ul>
              </div>
              <Link href="/subscription" className="small-cta-button">
                Go to Your Subscription
              </Link>
            </>
          )}

          {!isProcessing && !isSuccess && (
            <Link href="/membership" className="small-cta-button">
              Back to Membership Plans
            </Link>
          )}

          <p className="small-support-text">
            Need help? <a href="mailto:support@gymstar.com">support@gymstar.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessPay;
