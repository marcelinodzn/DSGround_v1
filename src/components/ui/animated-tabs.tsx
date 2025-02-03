"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";

interface Tab {
  id: string;
  label: string;
}

interface AnimatedTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  layoutId: string;
}

export function AnimatedTabs({ 
  tabs, 
  defaultTab,
  onChange,
  layoutId 
}: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0].id);
  const prevTabRef = useRef(activeTab);

  const handleTabChange = (tabId: string) => {
    if (tabId !== activeTab) {
      prevTabRef.current = activeTab;
      setActiveTab(tabId);
      onChange?.(tabId);
    }
  };

  return (
    <div className="flex space-x-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabChange(tab.id)}
          className={`
            relative rounded-[--radius] px-3 py-1.5 text-sm font-medium
            transition focus-visible:outline-2
            ${activeTab === tab.id 
              ? "text-[#0F172A]" 
              : "text-foreground/60 hover:text-foreground"
            }
          `}
          style={{
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {activeTab === tab.id && (
            <motion.span
              layoutId={layoutId}
              className="absolute inset-0 z-0"
              style={{ 
                borderRadius: "var(--radius)",
                backgroundColor: "#F1F5F9" 
              }}
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
} 