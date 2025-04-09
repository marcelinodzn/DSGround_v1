'use client'

import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { FileText } from "lucide-react"
import { useBrandStore } from "@/store/brand-store"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TypographySyncStatus } from "@/components/typography-sync-status"
import { TypographyHistoryButton } from "@/components/typography-history-button"

export function Header({ 
  onDocumentationClick 
}: { 
  onDocumentationClick?: () => void 
}) {
  const pathname = usePathname()
  const isTypographyPage = pathname === "/foundations/typography"
  const { brands, currentBrand, setCurrentBrand, isLoading } = useBrandStore()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center space-x-4">
          <a className="flex items-center space-x-2" href="/">
            <span className="font-bold sm:inline-block">
              Design System
            </span>
          </a>
          {!isLoading && brands.length > 0 && (
            <Select onValueChange={setCurrentBrand}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Brands</SelectLabel>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {isTypographyPage && <TypographySyncStatus />}
          {isTypographyPage && <TypographyHistoryButton />}
          {isTypographyPage && onDocumentationClick && (
            <Button variant="ghost" size="sm" onClick={onDocumentationClick}>
              <FileText className="h-5 w-5" />
              <span className="ml-2 hidden md:inline">Documentation</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
} 