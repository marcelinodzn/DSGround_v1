'use client'

import { useLayout } from "@/contexts/layout-context"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2 } from 'lucide-react'
import { cn } from "@/lib/utils"

export default function HomePage() {
  const { isFullscreen, setIsFullscreen } = useLayout()

  return (
    <div className={cn(
      "h-full flex transition-all duration-300 ease-in-out",
      isFullscreen && "fixed inset-0 bg-background z-50 overflow-y-auto p-6 max-w-[100vw]"
    )}>
      <div className="flex-1 min-w-0 max-w-full">
        <div className={cn(
          "flex items-center justify-between mb-6",
          isFullscreen ? "" : "pt-6 px-6"
        )}>
          <div>
            <h1 className="text-[30px] font-bold">Overview</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="ml-2"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="py-8 px-6 max-w-full overflow-x-hidden">
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="border rounded-lg p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Total Brands</h3>
                <p className="text-2xl font-bold mt-2">3</p>
              </div>
              <div className="border rounded-lg p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Active Projects</h3>
                <p className="text-2xl font-bold mt-2">12</p>
              </div>
              <div className="border rounded-lg p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Design Tokens</h3>
                <p className="text-2xl font-bold mt-2">156</p>
              </div>
              <div className="border rounded-lg p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Team Members</h3>
                <p className="text-2xl font-bold mt-2">8</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <div className="border rounded-lg divide-y">
                <div className="p-4">
                  <p className="text-sm font-medium">Typography scale updated</p>
                  <p className="text-sm text-muted-foreground mt-1">Updated by John Doe • 2h ago</p>
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium">New brand created</p>
                  <p className="text-sm text-muted-foreground mt-1">Created by Jane Smith • 5h ago</p>
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium">Color tokens modified</p>
                  <p className="text-sm text-muted-foreground mt-1">Updated by Mike Johnson • 1d ago</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Button variant="outline" className="h-auto py-4 px-6">
                  <div className="text-left">
                    <p className="font-medium">Create New Brand</p>
                    <p className="text-sm text-muted-foreground mt-1">Set up a new design system</p>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4 px-6">
                  <div className="text-left">
                    <p className="font-medium">Import Tokens</p>
                    <p className="text-sm text-muted-foreground mt-1">Import from Figma or JSON</p>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4 px-6">
                  <div className="text-left">
                    <p className="font-medium">Invite Team Member</p>
                    <p className="text-sm text-muted-foreground mt-1">Add collaborators</p>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
