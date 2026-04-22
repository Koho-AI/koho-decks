"use client";

import React, { useRef, useEffect, useState, ReactNode } from "react";
import ReactDOM from "react-dom/client";
import TiptapText from "./TiptapText";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import Underline from "@tiptap/extension-underline";

const extensions = [StarterKit, Markdown, Underline];

interface TiptapTextReplacerProps {
  children: ReactNode;
  slideData?: any;
  slideIndex?: number;
  onContentChange?: (
    content: string,
    path: string,
    slideIndex?: number
  ) => void;
}

const TiptapTextReplacer: React.FC<TiptapTextReplacerProps> = ({
  children,
  slideData,
  slideIndex,
  onContentChange = () => {},
}) => {

  

  const containerRef = useRef<HTMLDivElement>(null);
  const [processedElements, setProcessedElements] = useState(
    new Set<HTMLElement>()
  );

  // Phase 7c — escape hatch to disable the replacer entirely for debugging
  // (lets us isolate whether a slide crash is in the replacer or the template).
  //   NEXT_PUBLIC_DISABLE_TIPTAP_REPLACER=1 docker compose restart production
  const DISABLED =
    typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_DISABLE_TIPTAP_REPLACER === "1";
  // Track created React roots to update content when slideData changes
  const rootsRef = useRef<
    Map<HTMLElement, { root: any; dataPath: string;  fallbackText: string }>
  >(new Map());
  useEffect(() => {
    if (DISABLED) return;
    if (!containerRef.current) return;

    const container = containerRef.current;

    const replaceTextElements = () => {
      // Get all elements in the container
      const allElements = container.querySelectorAll("*");

      allElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        try {
        // Skip if already processed

        if (
          processedElements.has(htmlElement) ||
          htmlElement.classList.contains("tiptap-text-editor") ||
          htmlElement.closest(".tiptap-text-editor")
        ) {
          return;
        }

        // console.log("htmlElement", htmlElement);
        // Skip if element is inside an ignored element tree
        if (isInIgnoredElementTree(htmlElement)) return;

        // Get direct text content (not from child elements)
        const directTextContent = getDirectTextContent(htmlElement);
        const trimmedText = directTextContent.trim();

        // Check if element has meaningful text content
        if (!trimmedText || trimmedText.length <= 2) return;
        
        // Skip elements that contain other elements with text (to avoid double processing)
        if (hasTextChildren(htmlElement)) return;
        
        // Skip certain element types that shouldn't be editable
        if (shouldSkipElement(htmlElement)) return;

        // Get all computed styles to preserve them
        const allClasses = Array.from(htmlElement.classList);
        const allStyles = htmlElement.getAttribute("style");

        const dataPath = findDataPath(slideData, trimmedText);

        // Phase 7a — fail-loud: surface template ↔ data mismatches in the
        // browser console so the audit (per phase-7 plan) has a concrete
        // list to drive. Silently-orphaned text looks "hard-coded" to the
        // user because edits go nowhere.
        if (!dataPath.path) {
          // eslint-disable-next-line no-console
          console.warn(
            "[TiptapTextReplacer] No data path for",
            JSON.stringify(trimmedText.slice(0, 60)),
            "— template renders this text but no matching field in slide.content. " +
              "Either add it to the schema or wrap in data-koho-chrome='true'."
          );
        }

        // Create a container for the TiptapText
        const tiptapContainer = document.createElement("div");
        tiptapContainer.style.cssText = allStyles || "";
        tiptapContainer.className = Array.from(allClasses).join(" ");
    
        // Replace the element — guard against stale references from
        // framer-motion / other animation libs that may have removed
        // or reparented the node since we captured it.
        if (
          htmlElement.isConnected &&
          htmlElement.parentNode &&
          htmlElement.parentNode.contains(htmlElement)
        ) {
          htmlElement.parentNode.replaceChild(tiptapContainer, htmlElement);
          htmlElement.innerHTML = "";
        } else {
          // Node moved / removed under us. Skip without crashing.
          return;
        }
        setProcessedElements((prev) => new Set(prev).add(htmlElement));
        // Render TiptapText
        const root = ReactDOM.createRoot(tiptapContainer);
        const initialContent = dataPath.path
          ? getValueByPath(slideData, dataPath.path) ?? trimmedText
          : trimmedText;
        rootsRef.current.set(tiptapContainer, {
          root,
          dataPath: dataPath.path,
        
          fallbackText: trimmedText,
        });
        root.render(
          <TiptapText
            content={initialContent}

            onContentChange={(content: string) => {
              if (dataPath && onContentChange) {
                onContentChange(content, dataPath.path, slideIndex);
              }
            }}
            placeholder="Enter text..."
          />
        );
        } catch (err) {
          // One node failing (e.g. because framer-motion or some other
          // library rearranged the DOM under us) must not blow up the
          // whole slide. Swallow + continue so the remaining nodes get
          // processed and the user sees an editable deck.
          // eslint-disable-next-line no-console
          console.warn("TiptapTextReplacer: skipped a node due to", err);
        }
      });
    };

  
    // Replace text elements after a short delay to ensure DOM is ready
    const timer = setTimeout(replaceTextElements, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [slideData, slideIndex]);
  
  // When slideData changes, update existing editors' content using the stored dataPath
  useEffect(() => {
    if (!rootsRef.current || rootsRef.current.size === 0) return;
    rootsRef.current.forEach(({ root, dataPath, fallbackText }, container) => {
      try {
        if (!container.isConnected) return;
        const newContent = dataPath
          ? getValueByPath(slideData, dataPath) ?? fallbackText
          : fallbackText;
        root.render(
          <TiptapText
            content={newContent}
            onContentChange={(content: string) => {
              if (dataPath && onContentChange) {
                onContentChange(content, dataPath, slideIndex);
              }
            }}
            placeholder="Enter text..."
          />
        );
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("TiptapTextReplacer: update skipped due to", err);
      }
    });
  }, [slideData, slideIndex]);
  // helper functions
    // Function to check if element is inside an ignored element tree
    const isInIgnoredElementTree = (element: HTMLElement): boolean => {
      // List of element types that should be ignored entirely with all their children
      const ignoredElementTypes = [
        "TABLE",
        "TBODY",
        "THEAD",
        "TFOOT",
        "TR",
        "TD",
        "TH", // Table elements
        "SVG",
        "G",
        "PATH",
        "CIRCLE",
        "RECT",
        "LINE", // SVG elements
        "CANVAS", // Canvas element
        "VIDEO",
        "AUDIO", // Media elements
        "IFRAME",
        "EMBED",
        "OBJECT", // Embedded content
        "SELECT",
        "OPTION",
        "OPTGROUP", // Select dropdown elements
        "SCRIPT",
        "STYLE",
        "NOSCRIPT", // Script/style elements
      ];

      // List of class patterns that indicate ignored element trees
      const ignoredClassPatterns = [
        "chart",
        "graph",
        "visualization", // Chart/graph components
        "menu",
        "dropdown",
        "tooltip", // UI components
        "editor",
        "wysiwyg", // Editor components
        "calendar",
        "datepicker", // Date picker components
        "slider",
        "carousel",
        "flowchart",
        "mermaid",
        "diagram",
      ];

      // Check if current element or any parent is in ignored list
      let currentElement: HTMLElement | null = element;
      while (currentElement) {
        // Phase 7a — explicit chrome marker on Koho templates.
        // Anything under a `data-koho-chrome="true"` subtree is static
        // template chrome (section labels, page numbers, status badges)
        // that shouldn't be user-editable.
        if (currentElement.getAttribute?.("data-koho-chrome") === "true") {
          return true;
        }

        // Check element type
        if (ignoredElementTypes.includes(currentElement.tagName)) {
          return true;
        }

        // Check class patterns
        const className =
          currentElement.className.length > 0
            ? currentElement.className.toLowerCase()
            : "";
        if (
          ignoredClassPatterns.some((pattern) => className.includes(pattern))
        ) {
          return true;
        }
        if (currentElement.id.includes("mermaid")) {
          return true;
        }

        // Check for specific attributes that indicate non-text content
        if (
          currentElement.hasAttribute("contenteditable") ||
          currentElement.hasAttribute("data-chart") ||
          currentElement.hasAttribute("data-visualization") ||
          currentElement.hasAttribute("data-interactive")
        ) {
          return true;
        }

        currentElement = currentElement.parentElement;
      }
      return false;
    };

    // Resolve nested values by path like "a.b[0].c"
    const getValueByPath = (obj: any, path: string): any => {
      if (!obj || !path) return undefined;
      const tokens = path
        .replace(/\[(\d+)\]/g, ".$1")
        .split(".")
        .filter(Boolean);
      let current: any = obj;
      for (const token of tokens) {
        if (current == null) return undefined;
        current = current[token as keyof typeof current];
      }
      return current;
    };

    // Helper function to get only direct text content (not from children)
    const getDirectTextContent = (element: HTMLElement): string => {
      let text = "";
      const childNodes = Array.from(element.childNodes);
      for (const node of childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          text += node.textContent || "";
        }
      }
      return text;
    };

    // Helper function to check if element has child elements with text
    const hasTextChildren = (element: HTMLElement): boolean => {
      const children = Array.from(element.children) as HTMLElement[];
      return children.some((child) => {
        const childText = getDirectTextContent(child).trim();
        return childText.length > 1;
      });
    };

    // Helper function to determine if element should be skipped
    const shouldSkipElement = (element: HTMLElement): boolean => {
      // Skip form elements
      if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(element.tagName)) {
        return true;
      }

      // Skip elements with certain roles or types
      if (
        element.hasAttribute("role") ||
        element.hasAttribute("aria-label") ||
        element.hasAttribute("data-testid")
      ) {
        return true;
      }

      // Skip only truly interactive descendants (buttons, inputs). Images
      // and SVGs are fine as siblings of editable text — metric cards
      // routinely pair an icon with a number.
      if (
        element.querySelector("button, input, textarea, select")
      ) {
        return true;
      }

      // Skip container elements (elements that primarily serve as layout containers)
      const containerClasses = [
        "grid",
        "flex",
        "space-",
        "gap-",
        "container",
        "wrapper",
      ];
      const hasContainerClass = containerClasses.some((cls) =>
        element.className.length > 0 ? element.className.includes(cls) : false
      );
      if (hasContainerClass) return true;

      // Allow any non-empty text — metric values like "5" or "12" need
      // to stay editable. Single-char punctuation is rare in templates
      // and harmless if it picks up an editor instance.
      const text = getDirectTextContent(element).trim();
      if (text.length < 1) return true;

      return false;
    };

    // Helper function to find data path for text content
    const findDataPath = (
      data: any,
      targetText: string,
      path = ""
    ): {
      path: string;
      originalText: string;
    } => {
      if (!data || typeof data !== "object")
        return { path: "", originalText: "" };

      for (const [key, value] of Object.entries(data)) {
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof value === "string" && value.trim() === targetText.trim()) {
          return { path: currentPath, originalText: value };
        }

        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            const result = findDataPath(
              value[i],
              targetText,
              `${currentPath}[${i}]`
            );
            if (result.path) return result;
          }
        } else if (typeof value === "object" && value !== null) {
          const result = findDataPath(value, targetText, currentPath);
          if (result.path) return result;
        }
      }
      return { path: "", originalText: "" };
    };


  return (
    <div ref={containerRef} className="tiptap-text-replacer">
      {children}
    </div>
  );
};

export default TiptapTextReplacer;
