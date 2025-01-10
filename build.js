const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// Input directory (your root directory)
const inputDir = path.resolve(__dirname, '.'); // Current directory (root)
const outputDir = path.resolve(__dirname, 'public'); // Output directory

// Files and folders to exclude (add any others you need)
const excludedFiles = [
    'build.js',
    'package.json',
    'package-lock.json',
    'capacitor.config.json',
    'node_modules',
    '.git',
    'android',
    'ios',
    '.gitignore',
    'README.md',
    'backups',
    'adminer',
    '.vscode',
    'backupFiles',
    'public' // Add 'public' here to prevent infinite loop
];

console.log(`Starting build process in directory: ${inputDir}`);

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Function to recursively copy a directory
function copyDirSync(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Function to process files
const processFile = async (file) => {
    const inputFilePath = path.join(inputDir, file);
    const outputFilePath = path.join(outputDir, file);

    if (excludedFiles.includes(file)) {
        console.log(`Skipping excluded file or directory: ${file}`);
        return;
    }

    const stat = fs.statSync(inputFilePath);

    if (stat.isDirectory()) {
        console.log(`Copying directory: ${inputFilePath}`);
        copyDirSync(inputFilePath, outputFilePath);
    } else if (file.endsWith('.js')) {
        try {
            const code = fs.readFileSync(inputFilePath, 'utf8');
            console.log(`Read code from ${inputFilePath}`);

            const result = await minify(code, {
                compress: {
                    drop_console: true,
                },
                format: {
                    comments: false, // Removes all comments
                    beautify: true //  Add it under the `format` object
                },
                mangle: false
            });

            if (result.error) {
                console.error(`Error processing ${file}:`, result.error);
                return;
            }

            const outputDirPath = path.dirname(outputFilePath);
            if (!fs.existsSync(outputDirPath)) {
                fs.mkdirSync(outputDirPath, { recursive: true });
            }

            fs.writeFileSync(outputFilePath, result.code, 'utf8');
            console.log(`Processed ${file} and wrote to ${outputFilePath}`);
        } catch (err) {
            console.error(`Failed to process ${file}:`, err);
        }
    } else {
        console.log(`Copying non-JS file: ${file}`);
        try {
            const outputDirPath = path.dirname(outputFilePath);
            if (!fs.existsSync(outputDirPath)) {
                fs.mkdirSync(outputDirPath, { recursive: true });
            }
            fs.copyFileSync(inputFilePath, outputFilePath);
            console.log(`Copied ${file} to ${outputFilePath}`);
        } catch (err) {
            console.error(`Failed to copy ${file}:`, err);
        }
    }
};

// Read all files and directories in the input directory
const entries = fs.readdirSync(inputDir, { withFileTypes: true });

// Process all files and directories concurrently
const build = async () => {
    const promises = entries.map((entry) => processFile(entry.name));
    await Promise.all(promises);
    console.log('Build completed successfully.');
};

build().catch((err) => {
    console.error('Build failed:', err);
    process.exit(1);
});