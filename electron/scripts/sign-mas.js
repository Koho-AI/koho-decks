const fs = require("fs")
const path = require("path")
const { signAsync } = require("@electron/osx-sign")

const fail = (message) => {
  console.error(`[sign-mas] ${message}`)
  process.exit(1)
}

const resolvePath = (inputPath) =>
  path.isAbsolute(inputPath) ? inputPath : path.resolve(process.cwd(), inputPath)

const signMode = (process.env.MAS_SIGN_MODE || "distribution").toLowerCase()
const appPathInput = process.env.MAS_APP_PATH
const appRoot = path.resolve(__dirname, "..")

if (!appPathInput) {
  fail("MAS_APP_PATH is required. Example: dist/mas-arm64/Presenton Open Source.app")
}

if (!["distribution", "development"].includes(signMode)) {
  fail('MAS_SIGN_MODE must be either "distribution" or "development"')
}

const appPath = resolvePath(appPathInput)
if (!fs.existsSync(appPath)) {
  fail(`App not found at: ${appPath}`)
}

const provisioningProfileInput = process.env.MAS_PROVISIONING_PROFILE
const defaultProvisioningProfile =
  signMode === "development"
    ? path.join(appRoot, "build", "AppleDevelopment.provisionprofile")
    : path.join(appRoot, "build", "MacAppStore.provisionprofile")

let provisioningProfile = provisioningProfileInput
  ? resolvePath(provisioningProfileInput)
  : undefined

if (!provisioningProfile && fs.existsSync(defaultProvisioningProfile)) {
  provisioningProfile = defaultProvisioningProfile
}

if (signMode === "development" && !provisioningProfile) {
  fail("MAS_PROVISIONING_PROFILE is required for development signing")
}

if (provisioningProfile && !fs.existsSync(provisioningProfile)) {
  fail(`Provisioning profile not found at: ${provisioningProfile}`)
}

const identity =
  process.env.MAS_IDENTITY ||
  (signMode === "development" ? "Apple Development" : "Apple Distribution")

const signOptions = {
  app: appPath,
  identity,
  type: signMode,
  entitlements: path.join(appRoot, "build", "entitlements.mas.plist"),
  entitlementsInherit: path.join(appRoot, "build", "entitlements.mas.inherit.plist"),
}

if (provisioningProfile) {
  signOptions.provisioningProfile = provisioningProfile
}

;(async () => {
  try {
    console.log(`[sign-mas] Signing ${appPath}`)
    console.log(`[sign-mas] Mode: ${signMode}`)
    console.log(`[sign-mas] Identity: ${identity}`)
    if (provisioningProfile) {
      console.log(`[sign-mas] Provisioning profile: ${provisioningProfile}`)
    }
    await signAsync(signOptions)
    console.log("[sign-mas] Signing completed")
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error))
  }
})()