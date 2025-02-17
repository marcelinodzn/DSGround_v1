import { LucideIcon, Type, Palette, Ruler, Square, LayoutGrid, Settings, Box, Layers } from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

interface NavSection {
  title: string
  links: NavItem[]
}

export const navigation: NavSection[] = [
  {
    title: "Overview",
    links: [
      {
        title: "Dashboard",
        href: "/app/overview",
        icon: LayoutGrid
      }
    ]
  },
  {
    title: "Foundations",
    links: [
      {
        title: "Typography",
        href: "/app/foundations/typography",
        icon: Type
      },
      {
        title: "Colors",
        href: "/app/foundations/colors",
        icon: Palette
      },
      {
        title: "Spacing",
        href: "/app/foundations/spacing",
        icon: Ruler
      },
      {
        title: "Surfaces",
        href: "/app/foundations/surfaces",
        icon: Square
      }
    ]
  }
] 