'use client'

import { useBrandStore } from "@/store/brand-store"
import { useEffect } from "react"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Type, Palette, Grid } from "lucide-react"

export default function FoundationsPage() {
  const { currentBrand } = useBrandStore()
  const router = useRouter()

  const foundations = [
    {
      title: "Typography",
      description: "Manage type scales, font families, and text styles",
      icon: Type,
      href: "/foundations/typography"
    },
    {
      title: "Colors",
      description: "Define color palettes and semantic tokens",
      icon: Palette,
      href: "/foundations/colors"
    },
    {
      title: "Grid & Layout",
      description: "Configure spacing, breakpoints, and grid systems",
      icon: Grid,
      href: "/foundations/grid"
    }
  ]

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Design Foundations</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {foundations.map((foundation) => {
          const Icon = foundation.icon
          return (
            <Card
              key={foundation.title}
              className="p-6 hover:border-primary cursor-pointer"
              onClick={() => router.push(foundation.href)}
            >
              <Icon className="h-8 w-8 mb-4" />
              <h2 className="text-xl font-semibold mb-2">{foundation.title}</h2>
              <p className="text-muted-foreground">{foundation.description}</p>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
