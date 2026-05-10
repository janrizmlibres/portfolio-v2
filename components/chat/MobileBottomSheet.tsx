"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { useRef } from "react";

interface Props {
  children: React.ReactNode;
  collapsedVh?: number; // default 32
  expandedVh?: number;  // default 92
}

export function MobileBottomSheet({ children, collapsedVh = 32, expandedVh = 92 }: Props) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    if (!sheetRef.current || !handleRef.current) return;
    const sheet = sheetRef.current;

    gsap.registerPlugin(Draggable);
    gsap.set(sheet, { height: `${collapsedVh}vh` });

    let startVh = collapsedVh;
    let isExpanded = false;

    Draggable.create(handleRef.current, {
      type: "y",
      bounds: { minY: -window.innerHeight, maxY: window.innerHeight },
      inertia: false,
      onPress() {
        startVh = isExpanded ? expandedVh : collapsedVh;
      },
      onDrag() {
        const deltaVh = (-this.y / window.innerHeight) * 100;
        const next = Math.max(collapsedVh, Math.min(expandedVh, startVh + deltaVh));
        gsap.set(sheet, { height: `${next}vh` });
      },
      onDragEnd() {
        const deltaPx = -this.y;
        const threshold = window.innerHeight * 0.1;
        let willExpand = isExpanded;
        if (deltaPx > threshold) willExpand = true;
        else if (deltaPx < -threshold) willExpand = false;
        isExpanded = willExpand;
        gsap.to(sheet, {
          height: `${willExpand ? expandedVh : collapsedVh}vh`,
          duration: 0.36,
          ease: "power3.inOut",
        });
        gsap.set(handleRef.current, { y: 0 });
      },
    });
  });

  return (
    <div
      ref={sheetRef}
      className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
      style={{ height: `${collapsedVh}vh` }}
    >
      <div className="flex h-full flex-col">
        <div ref={handleRef} className="flex cursor-grab justify-center pt-2 pb-1 active:cursor-grabbing">
          <span className="block h-1 w-9 rounded-full bg-ink-line" />
        </div>
        <div className="flex-1 min-h-0" style={{ touchAction: "none" }}>{children}</div>
      </div>
    </div>
  );
}
