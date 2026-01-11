import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import archiver from "archiver";

console.log("Building Lambda package...\n");

// Define paths
const rootDir = process.cwd();
const deployDir = path.join(rootDir, "deploy");
const functionDir = path.join(deployDir, "function");
const layersDir = path.join(deployDir, "layers");
const outputDir = path.join(deployDir, "output");
// Source paths
const distDir = path.join(rootDir, "dist");
const envFile = path.join(rootDir, ".env");
const prismaDir = path.join(rootDir, "prisma");

// Layer paths
const layerOrmDir = path.join(layersDir, "layer-orm");
const layerNativeDir = path.join(layersDir, "layer-native");

// Output zip paths
const functionZip = path.join(outputDir, "function.zip");
const layerOrmZip = path.join(outputDir, "layer-orm.zip");
const layerNativeZip = path.join(outputDir, "layer-native.zip");

/**
 * Recursively copy a directory
 */
function copyDirectory(src: string, dest: string) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * Copy a file
 */
function copyFile(src: string, dest: string) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
}

/**
 * Create layer package.json files
 */
function createLayerPackageJson(layerDir: string, config: any) {
    const packageJsonPath = path.join(layerDir, "package.json");

    if (!fs.existsSync(layerDir)) {
        fs.mkdirSync(layerDir, { recursive: true });
    }

    fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(config, null, 2),
        "utf-8"
    );
    console.log(`Created ${path.basename(layerDir)}/package.json`);
}

/**
 * Run pnpm install in a directory
 */
function runPnpmInstall(dir: string, layerName: string) {
    console.log(`Installing dependencies for ${layerName}...`);
    try {
        execSync("pnpm install --prod --config.confirmModulesPurge=false", {
            cwd: dir,
            stdio: "inherit",
        });
        console.log(`Dependencies installed for ${layerName}\n`);
    } catch (error) {
        console.error(`Failed to install dependencies for ${layerName}`);
        throw error;
    }
}

/**
 * Create a zip archive
 */
async function createZip(
    sourceDir: string,
    outputPath: string,
    name: string
): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log(`Creating ${name} archive...`);

        const output = fs.createWriteStream(outputPath);
        const archive = archiver("zip", {
            zlib: { level: 9 }, // Maximum compression
        });

        output.on("close", () => {
            const sizeInMB = (archive.pointer() / (1024 * 1024)).toFixed(2);
            console.log(`${name} created: ${outputPath} (${sizeInMB} MB)\n`);
            resolve();
        });

        archive.on("error", (err) => {
            console.error(`Error creating ${name}:`, err);
            reject(err);
        });

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

/**
 * Create a zip archive for Lambda layer (with nodejs/ folder structure)
 */
async function createLayerZip(
    sourceDir: string,
    outputPath: string,
    name: string
): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log(`Creating ${name} layer archive...`);

        const output = fs.createWriteStream(outputPath);
        const archive = archiver("zip", {
            zlib: { level: 9 }, // Maximum compression
        });

        output.on("close", () => {
            const sizeInMB = (archive.pointer() / (1024 * 1024)).toFixed(2);
            console.log(`${name} layer created: ${outputPath} (${sizeInMB} MB)\n`);
            resolve();
        });

        archive.on("error", (err) => {
            console.error(`Error creating ${name} layer:`, err);
            reject(err);
        });

        archive.pipe(output);

        // Lambda layers require node_modules to be in nodejs/ directory
        const nodeModulesPath = path.join(sourceDir, "node_modules");
        if (fs.existsSync(nodeModulesPath)) {
            archive.directory(nodeModulesPath, "nodejs/node_modules");
        }

        archive.finalize();
    });
}

// Main execution
async function main() {
    try {
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Step 0: Create layer package.json files
        console.log("Setting up Lambda layers...\n");

        createLayerPackageJson(layerOrmDir, {
            name: "lambda-layer-orm",
            version: "1.0.0",
            description: "AWS Lambda Layer for ORM dependencies (Prisma and PostgreSQL)",
            type: "module",
            dependencies: {
                "@prisma/adapter-pg": "^7.1.0",
                "@prisma/client": "^7.1.0",
                "prisma": "^7.1.0",
                "pg": "^8.16.3"
            },
            scripts: {
                "postinstall": "prisma generate"
            },
        });

        createLayerPackageJson(layerNativeDir, {
            name: "lambda-layer-native",
            version: "1.0.0",
            description: "AWS Lambda Layer for native application dependencies (Hono, logging, validation)",
            type: "module",
            dependencies: {
                "@hono/node-server": "^1.19.6",
                "dotenv": "^17.2.3",
                "hono": "^4.11.1",
                "hono-rate-limiter": "^0.5.0",
                "pino": "^10.1.0",
                "pino-pretty": "^13.1.3",
                "zod": "^4.2.1"
            }
        });

        console.log("Layer setup completed\n");

        // Step 0.5: Copy prisma folder to layer-orm (needed for generating client)
        if (fs.existsSync(prismaDir)) {
            const destLayerOrmPrisma = path.join(layerOrmDir, "prisma");
            copyDirectory(prismaDir, destLayerOrmPrisma);
            console.log(`Copied prisma to ${destLayerOrmPrisma}\n`);
        }

        // Step 1: Copy dist folder
        console.log("Copying dist folder...");
        const destDistDir = path.join(functionDir, "dist");
        if (fs.existsSync(distDir)) {
            copyDirectory(distDir, destDistDir);
            console.log(`Copied dist to ${destDistDir}\n`);
        } else {
            console.warn(`WARNING: dist folder not found at ${distDir}\n`);
        }

        // Step 2: Copy .env file
        console.log("Copying .env file...");
        const destEnvFile = path.join(functionDir, ".env");
        if (fs.existsSync(envFile)) {
            copyFile(envFile, destEnvFile);
            console.log(`Copied .env to ${destEnvFile}\n`);
        } else {
            console.warn(`WARNING: .env file not found at ${envFile}\n`);
        }

        // Step 3: Copy prisma folder
        console.log("Copying prisma folder...");
        const destPrismaDir = path.join(functionDir, "prisma");
        if (fs.existsSync(prismaDir)) {
            copyDirectory(prismaDir, destPrismaDir);
            console.log(`Copied prisma to ${destPrismaDir}\n`);
        } else {
            console.warn(`WARNING: prisma folder not found at ${prismaDir}\n`);
        }

        // Step 4: Install dependencies for layer-native
        if (fs.existsSync(layerNativeDir)) {
            runPnpmInstall(layerNativeDir, "layer-native");
        } else {
            console.warn(
                `WARNING: layer-native directory not found at ${layerNativeDir}\n`
            );
        }

        // Step 5: Install dependencies for layer-orm
        if (fs.existsSync(layerOrmDir)) {
            runPnpmInstall(layerOrmDir, "layer-orm");
        } else {
            console.warn(
                `WARNING: layer-orm directory not found at ${layerOrmDir}\n`
            );
        }

        // Step 6: Create zip archives
        console.log("\n--- Creating ZIP archives ---\n");

        // Zip function directory
        if (fs.existsSync(functionDir)) {
            await createZip(functionDir, functionZip, "function");
        }

        // Zip layer-native
        if (fs.existsSync(layerNativeDir)) {
            await createLayerZip(layerNativeDir, layerNativeZip, "layer-native");
        }

        // Zip layer-orm
        if (fs.existsSync(layerOrmDir)) {
            await createLayerZip(layerOrmDir, layerOrmZip, "layer-orm");
        }

        console.log("Lambda package build completed successfully!");
        console.log(`\nOutput directory: ${outputDir}`);
    } catch (error) {
        console.error("Build failed:", error);
        process.exit(1);
    }
}

main();
