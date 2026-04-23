import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupName = searchParams.get("group");

  if (!groupName) {
    return NextResponse.json({ error: "Missing group name" }, { status: 400 });
  }

  const schemaPageUrl = `http://localhost/schema?group=${encodeURIComponent(
    groupName
  )}`;

  let browser;
  try {
    browser = await puppeteer.launch({
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
    await page.setViewport({ width: 1280, height: 720 });
    page.setDefaultNavigationTimeout(300000);
    page.setDefaultTimeout(300000);

    // /schema is auth-gated by the NextAuth middleware. Puppeteer has
    // no session cookie, so without a token it lands on /signin and
    // the [data-layouts] selector below times out. Present the same
    // X-Koho-Internal-Token that lib/auth.ts recognises as internal
    // render identity (mirrors the pdf-maker/export-as-pdf routes).
    const internalToken = process.env.INTERNAL_RENDER_TOKEN;
    if (internalToken) {
      await page.setExtraHTTPHeaders({
        "X-Koho-Internal-Token": internalToken,
      });
    }

    await page.goto(schemaPageUrl, {
      waitUntil: "networkidle0",
      timeout: 300000,
    });

    await page.waitForSelector("[data-layouts]", { timeout: 300000 });
    await page.waitForSelector("[data-settings]", { timeout: 300000 });

    const { dataLayouts, dataGroupSettings } = await page.$eval(
      "[data-layouts]",
      (el) => ({
        dataLayouts: el.getAttribute("data-layouts"),
        dataGroupSettings: el.getAttribute("data-settings"),
      })
    );

    let slides, groupSettings;
    try {
      slides = JSON.parse(dataLayouts || "[]");
    } catch (e) {
      slides = [];
    }
    try {
      groupSettings = JSON.parse(dataGroupSettings || "null");
    } catch (e) {
      groupSettings = null;
    }

    const response = {
      name: groupName,
      ordered: groupSettings?.ordered ?? false,
      slides: slides.map((slide: any) => ({
        id: slide.id,
        name: slide.name,
        description: slide.description,
        json_schema: slide.json_schema,
      })),
    };

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error("template route: scrape failed", err);
    return NextResponse.json(
      { error: `Failed to fetch or parse client page: ${message.slice(0, 400)}` },
      { status: 500 }
    );
  } finally {
    if (browser) await browser.close();
  }
}
