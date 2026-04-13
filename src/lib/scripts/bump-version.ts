import fs from "fs";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

try {
    console.log("🔄 Auto-incrementing version...");

    // 1. Run npm version patch
    execSync("npm version patch --no-git-tag-version --force", {
        cwd: rootDir,
        stdio: "inherit",
    });

    // 2. Read the new version
    const packageJsonPath = path.resolve(rootDir, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const newVersion = packageJson.version;

    // 3. Update static/app-version.json
    const staticDir = path.resolve(rootDir, "static");
    if (!fs.existsSync(staticDir)) {
        fs.mkdirSync(staticDir, { recursive: true });
    }
    
    const staticVersionPath = path.resolve(staticDir, "app-version.json");
    const staticVersionData = { version: newVersion, updatedAt: new Date().toISOString() };

    fs.writeFileSync(
        staticVersionPath,
        JSON.stringify(staticVersionData, null, 4),
    );

    // 4. Stage the changes
    execSync("git add package.json package-lock.json static/app-version.json", {
        cwd: rootDir,
        stdio: "inherit",
    });

    console.log(`✅ Version bumped to ${newVersion} and changes staged.`);
} catch (error) {
    console.error("❌ Failed to bump version:", error);
    process.exit(1);
}
