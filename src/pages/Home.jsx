import React from "react";
import Navbar from "@/components/Navbar";
import PullToRefresh from "@/components/PullToRefresh";
import Footer from "@/components/Footer";
import MobileStickyBar from "@/components/MobileStickyBar";
import AIAssistant from "@/components/AIAssistant";
import Hero from "@/components/sections/Hero";
import AllCategories from "@/components/sections/AllCategories";
import TopLocalPartners from "@/components/sections/TopLocalPartners";
import PopularProducts from "@/components/sections/PopularProducts";
import TrendingProducts from "@/components/sections/TrendingProducts";
import NewArrivals from "@/components/sections/NewArrivals";
import BestSellers from "@/components/sections/BestSellers";
import NearbyStores from "@/components/sections/NearbyStores";
import FlashSale from "@/components/sections/FlashSale";
import RecommendedForYou from "@/components/sections/RecommendedForYou";
import RecentlyAddedStores from "@/components/sections/RecentlyAddedStores";
import PromoBanner from "@/components/sections/PromoBanner";
import AISection from "@/components/sections/AISection";
import AIRecommendations from "@/components/customer/AIRecommendations";
import AISupportChatbot from "@/components/customer/AISupportChatbot";
import Services from "@/components/sections/Services";
import ServiceAreas from "@/components/sections/ServiceAreas";
import HowItWorks from "@/components/sections/HowItWorks";
import WhyChoose from "@/components/sections/WhyChoose";
import CouponShowcase from "@/components/sections/CouponShowcase";
import Testimonials from "@/components/sections/Testimonials";
import RewardsSection from "@/components/sections/RewardsSection";
import DualPortal from "@/components/sections/DualPortal";
import AppDownload from "@/components/sections/AppDownload";
import About from "@/components/sections/About";
import FAQ from "@/components/sections/FAQ";
import Contact from "@/components/sections/Contact";
import OnboardingWalkthrough from "@/components/OnboardingWalkthrough";
import CallSupportButton from "@/components/support/CallSupportButton";
import { useOrderStatusNotifications } from "@/hooks/useOrderStatusNotifications";

export default function Home() {
  useOrderStatusNotifications();
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <OnboardingWalkthrough />
      <main>
        <PullToRefresh onRefresh={() => window.location.reload()}>
        <Hero />
        <AllCategories />
        <PromoBanner />
        <TopLocalPartners />
        <PopularProducts />
        <FlashSale />
        <TrendingProducts />
        <NewArrivals />
        <BestSellers />
        <NearbyStores />
        <RecommendedForYou />
        <RecentlyAddedStores />
        <AISection />
        <AIRecommendations />
        <Services />
        <ServiceAreas />
        <HowItWorks />
        <WhyChoose />
        <CouponShowcase />
        <Testimonials />
        <RewardsSection />
        <DualPortal />
        <AppDownload />
        <About />
        <FAQ />
        <Contact />
        </PullToRefresh>
      </main>
      <Footer />
      <MobileStickyBar />
      <CallSupportButton userType="customer" bottomClass="bottom-24" />
      <AIAssistant />
      <AISupportChatbot />
    </div>
  );
}