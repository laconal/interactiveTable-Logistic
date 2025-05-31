"use client"

import { motion } from "framer-motion"
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function mainPage() {
    return (
        <>
            <DotLottieReact
                src="logisticAnimation.lottie"
                className="h-[calc(100vh-110px)]"
                loop
                autoplay
            />
        </>
    )
}