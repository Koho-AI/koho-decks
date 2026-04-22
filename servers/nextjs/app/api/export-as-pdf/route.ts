import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";

import { sanitizeFilename } from "@/app/(presentation-generator)/utils/others";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { id, title } = await req.json();
  if (!id) {
    return NextResponse.json(
      { error: "Missing Presentation ID" },
      { status: 400 }
    );
  }
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-web-security",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-features=TranslateUI",
      "--disable-ipc-flooding-protection",
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  page.setDefaultNavigationTimeout(300000);
  page.setDefaultTimeout(300000);

  // /pdf-maker is public in NextAuth (lib/auth.ts), but PdfMakerPage
  // fetches /api/v1/ppt/presentation/{id} from FastAPI, whose
  // PRESENTATION_ROUTER has a router-wide get_current_user_strict
  // dependency. Puppeteer has no NextAuth session, so we pass an
  // internal shared secret via X-Koho-Internal-Token; FastAPI's
  // AuthMiddleware grants a read-only render context on match.
  const internalToken = process.env.INTERNAL_RENDER_TOKEN;
  if (internalToken) {
    await page.setExtraHTTPHeaders({
      "X-Koho-Internal-Token": internalToken,
    });
  }

  await page.goto(`http://localhost/pdf-maker?id=${id}`, {
    waitUntil: "networkidle0",
    timeout: 300000,
  });

  await page.waitForFunction('() => document.readyState === "complete"');

  try {
    await page.waitForFunction(
      `
      () => {
        const allElements = document.querySelectorAll('*');
        let loadedElements = 0;
        let totalElements = allElements.length;
        
        for (let el of allElements) {
            const style = window.getComputedStyle(el);
            const isVisible = style.display !== 'none' && 
                            style.visibility !== 'hidden' && 
                            style.opacity !== '0';
            
            if (isVisible && el.offsetWidth > 0 && el.offsetHeight > 0) {
                loadedElements++;
            }
        }
        
        return (loadedElements / totalElements) >= 0.99;
      }
      `,
      { timeout: 300000 }
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    console.log("Warning: Some content may not have loaded completely:", error);
  }

  const pdfBuffer = await page.pdf({
    width: "1920px",
    height: "1080px",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  browser.close();

  const sanitizedTitle = sanitizeFilename(title ?? "presentation");
  const appDataDirectory = process.env.APP_DATA_DIRECTORY!;
  if (!appDataDirectory) {
    return NextResponse.json({
      error: "App data directory not found",
      status: 500,
    });
  }
  const destinationPath = path.join(
    appDataDirectory,
    "exports",
    `${sanitizedTitle}.pdf`
  );
  await fs.promises.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.promises.writeFile(destinationPath, pdfBuffer);

  return NextResponse.json({
    success: true,
    path: destinationPath,
  });
}
