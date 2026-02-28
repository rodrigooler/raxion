"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function SiteEffects() {
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    const cursor = document.getElementById("cursor-ring");
    const flare1 = document.getElementById("flare-1");
    const flare2 = document.getElementById("flare-2");
    const prefersFinePointer = window.matchMedia("(pointer: fine)").matches;

    if (pathname?.startsWith("/pt-BR")) html.lang = "pt-BR";
    else if (pathname?.startsWith("/zh")) html.lang = "zh";
    else if (pathname?.startsWith("/ja")) html.lang = "ja";
    else if (pathname?.startsWith("/es")) html.lang = "es";
    else html.lang = "en";

    const onMove = (event: MouseEvent) => {
      if (cursor) {
        cursor.style.left = `${event.clientX}px`;
        cursor.style.top = `${event.clientY}px`;
      }

      const x = (event.clientX / window.innerWidth - 0.5) * 50;
      const y = (event.clientY / window.innerHeight - 0.5) * 50;
      if (flare1) flare1.style.transform = `translate(${x}px, ${y}px)`;
      if (flare2) flare2.style.transform = `translate(${-x}px, ${-y}px)`;
    };

    const interactiveNodes = Array.from(document.querySelectorAll("a, button"));
    const onEnter = () => cursor?.classList.add("hover");
    const onLeave = () => cursor?.classList.remove("hover");

    if (prefersFinePointer) {
      interactiveNodes.forEach((node) => {
        node.addEventListener("mouseenter", onEnter);
        node.addEventListener("mouseleave", onLeave);
      });
      document.addEventListener("mousemove", onMove);
    } else if (cursor) {
      cursor.style.display = "none";
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.08 },
    );

    document.querySelectorAll(".reveal").forEach((node) => {
      const element = node as HTMLElement;
      const rect = element.getBoundingClientRect();
      const visibleNow = rect.top < window.innerHeight * 0.92 && rect.bottom > 0;

      if (visibleNow) {
        element.classList.add("visible");
      }

      observer.observe(element);
    });
    html.dataset.motion = "ready";

    return () => {
      delete html.dataset.motion;
      if (prefersFinePointer) {
        document.removeEventListener("mousemove", onMove);
        interactiveNodes.forEach((node) => {
          node.removeEventListener("mouseenter", onEnter);
          node.removeEventListener("mouseleave", onLeave);
        });
      }
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
