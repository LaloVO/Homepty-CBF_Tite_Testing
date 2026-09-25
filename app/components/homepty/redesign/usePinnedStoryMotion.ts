"use client";

import { useCallback, useRef, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const LAST_STORY_INDEX = 4;
const STORY_STEP_DURATION = 1.24;
const INTRO_HOLD_DURATION = 0.28;
const INTRO_MOTION_DURATION = 1.22;
const INTRO_DURATION = INTRO_HOLD_DURATION + INTRO_MOTION_DURATION;

export function usePinnedStoryMotion(
  rootRef: RefObject<HTMLDivElement | null>,
  setActive: (index: number) => void,
  introFullWidth = false,
) {
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const activeRef = useRef(0);
  const introFractionRef = useRef(0);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const frames = gsap.utils.toArray<HTMLElement>(".story-frame", root);
      const copies = gsap.utils.toArray<HTMLElement>(".story-copy-item", root);
      const pin = root.querySelector<HTMLElement>(".story-pin");
      const shell = root.querySelector<HTMLElement>(".story-shell");
      const copyColumn = root.querySelector<HTMLElement>(".story-copy-column");
      const visualColumn = root.querySelector<HTMLElement>(".story-visual-column");
      const firstBrowser = root.querySelector<HTMLElement>(
        ".story-frame:first-child .product-window",
      );

      if (!pin || frames.length < 2 || copies.length !== frames.length) return;

      const media = gsap.matchMedia();
      media.add(
        "(prefers-reduced-motion: no-preference) and (min-width: 821px)",
        () => {
          gsap.set(frames, { zIndex: (index) => 20 + index });
          gsap.set(frames.slice(1), {
            autoAlpha: 0,
            y: 90,
            scale: 1.08,
            filter: "blur(8px)",
            clipPath: "inset(16% 6% 0% 6% round 30px)",
          });
          gsap.set(copies.slice(1), { autoAlpha: 0, y: 28 });
          gsap.set(frames[0], {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            clipPath: "inset(0% 0% 0% 0% round 24px)",
          });
          gsap.set(copies[0], { autoAlpha: 1, y: 0 });

          const introEnabled =
            introFullWidth && shell && copyColumn && visualColumn && firstBrowser;
          const introDuration = introEnabled ? INTRO_DURATION : 0;
          const columnOffset = () =>
            copyColumn!.getBoundingClientRect().width +
            Number.parseFloat(getComputedStyle(shell!).columnGap);
          const gridVisualWidth = () => shell!.clientWidth - columnOffset();
          const initialLift = () => -window.innerHeight * 0.12;
          const gridBrowserMinHeight = () =>
            window.innerWidth <= 1080 ? 540 : 580;
          const gridBrowserHeight = () =>
            Math.max(
              gridBrowserMinHeight(),
              Math.min(660, window.innerHeight - 158),
            );

          if (introEnabled) {
            gsap.set(visualColumn, {
              width: () => shell.clientWidth,
              x: () => -columnOffset(),
              y: initialLift,
            });
            gsap.set(copyColumn, { autoAlpha: 0, x: -36 });
            gsap.set(firstBrowser, { height: 720, minHeight: 720 });
          }

          const timeline = gsap.timeline({
            defaults: { ease: "none" },
            onUpdate: () => {
              // Follow the scrubbed playhead; the intro still belongs to Home.
              const storyProgress = Math.max(
                0,
                (timeline.time() - introDuration) /
                  (timeline.duration() - introDuration),
              );
              const index = Math.round(storyProgress * LAST_STORY_INDEX);
              if (index === activeRef.current) return;
              activeRef.current = index;
              setActive(index);
            },
          });

          if (introEnabled) {
            timeline
              .fromTo(
                visualColumn,
                {
                  width: () => shell.clientWidth,
                  x: () => -columnOffset(),
                  y: initialLift,
                },
                {
                  width: gridVisualWidth,
                  x: 0,
                  y: 0,
                  duration: INTRO_MOTION_DURATION,
                  immediateRender: false,
                },
                INTRO_HOLD_DURATION,
              )
              .to(
                copyColumn,
                { autoAlpha: 1, x: 0, duration: 0.72 },
                INTRO_DURATION - 0.72,
              )
              .fromTo(
                firstBrowser,
                { height: 720, minHeight: 720 },
                {
                  height: gridBrowserHeight,
                  minHeight: gridBrowserMinHeight,
                  duration: INTRO_MOTION_DURATION,
                  immediateRender: false,
                },
                INTRO_HOLD_DURATION,
              );
          }

          for (let index = 1; index < frames.length; index += 1) {
            const previousFrame = frames[index - 1];
            const currentFrame = frames[index];
            const previousCopy = copies[index - 1];
            const currentCopy = copies[index];
            const position = introDuration + (index - 1) * STORY_STEP_DURATION;

            timeline
              .to(
                previousFrame,
                {
                  scale: 0.87,
                  y: -66,
                  rotationX: 2.2,
                  autoAlpha: 0.2,
                  filter: "blur(8px)",
                  clipPath: "inset(0% 4% 20% 4% round 28px)",
                  duration: 0.94,
                },
                position,
              )
              .fromTo(
                currentFrame,
                {
                  autoAlpha: 0,
                  y: 92,
                  scale: 1.085,
                  rotationX: -2.4,
                  filter: "blur(8px)",
                  clipPath: "inset(17% 6% 0% 6% round 32px)",
                },
                {
                  autoAlpha: 1,
                  y: 0,
                  scale: 1,
                  rotationX: 0,
                  filter: "blur(0px)",
                  clipPath: "inset(0% 0% 0% 0% round 24px)",
                  duration: 0.94,
                  immediateRender: false,
                },
                position + 0.18,
              )
              .to(
                previousCopy,
                { autoAlpha: 0, y: -24, duration: 0.42 },
                position + 0.05,
              )
              .fromTo(
                currentCopy,
                { autoAlpha: 0, y: 28 },
                { autoAlpha: 1, y: 0, duration: 0.52 },
                position + 0.4,
              )
              .to(
                previousFrame,
                {
                  autoAlpha: 0,
                  scale: 0.82,
                  y: -96,
                  filter: "blur(10px)",
                  duration: 0.32,
                },
                position + 0.72,
              );
          }

          introFractionRef.current = introDuration / timeline.duration();
          const trigger = ScrollTrigger.create({
            animation: timeline,
            trigger: root,
            pin,
            start: "top top",
            end: () =>
              `+=${
                window.innerHeight * LAST_STORY_INDEX * 0.96 *
                (timeline.duration() / (timeline.duration() - introDuration))
              }`,
            scrub: 0.72,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          });

          triggerRef.current = trigger;
          return () => {
            triggerRef.current = null;
          };
        },
      );

      return () => media.revert();
    },
    { scope: rootRef },
  );

  return useCallback(
    (index: number) => {
      const trigger = triggerRef.current;
      if (!trigger) {
        activeRef.current = index;
        setActive(index);
        return;
      }

      const progress =
        introFractionRef.current +
        (1 - introFractionRef.current) * (index / LAST_STORY_INDEX);
      window.scrollTo({
        top: trigger.start + (trigger.end - trigger.start) * progress,
        behavior: "smooth",
      });
    },
    [setActive],
  );
}
