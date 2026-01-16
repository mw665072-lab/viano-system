"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, MessageSquare, Clock, Users, Star, ChevronDown } from "lucide-react";
import LandingUsman from "@/components/landing";
import SyedaLanding from "@/components/landing/syeda";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans">
      <LandingUsman />
      <SyedaLanding />

    </main>
  );
}

