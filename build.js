const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// Input directory (your root directory)
const inputDir = path.resolve(__dirname, '.'); // Current directory (root)
const outputDir = path.resolve(__dirname, 'public'); // Output directory

// Files and folders to exclude (add any others you need)
const excludedFiles = ['build.js', 
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
    'public',
    '.DS_Store',
    
]; 

console.log(`Starting build process in directory: ${inputDir}`);

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Function to process files
const processFile = async (file) => {
    if (excludedFiles.includes(file)) {
        console.log(`Skipping excluded file: ${file}`);
        return;
    }
    
    const inputFilePath = path.join(inputDir, file);
    const outputFilePath = path.join(outputDir, file);
    console.log(`Processing file: ${inputFilePath}`);

    if (file.endsWith('.js')) { // Process JavaScript files
        try {
            const code = fs.readFileSync(inputFilePath, 'utf8');
            console.log(`Read code from ${inputFilePath}`);

            // Configure Terser to remove console.log and comments without minifying
            const result = await minify(code, {
                compress: {
                    drop_console: true, // Removes console.log statements
                },
                format: {
                    comments: false, // Removes all comments
                },
                mangle: false, // Prevents variable and function name mangling
                // Optionally, preserve certain formatting aspects
                beautify: true
            });

            if (result.error) {
                console.error(`Error processing ${file}:`, result.error);
                return;
            }

            // Ensure the directory structure exists in the output directory
            const outputDirPath = path.dirname(outputFilePath);
            if (!fs.existsSync(outputDirPath)) {
                fs.mkdirSync(outputDirPath, { recursive: true });
            }

            // Write the processed code to the output directory
            fs.writeFileSync(outputFilePath, result.code, 'utf8');
            console.log(`Processed ${file} and wrote to ${outputFilePath}`);
        } catch (err) {
            console.error(`Failed to process ${file}:`, err);
        }
    } else {
        // Copy other files without processing
        console.log(`Copying non-JS file: ${file}`);
        try {
            // Ensure the directory structure exists in the output directory
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

// Read all files in the input directory
const files = fs.readdirSync(inputDir);

// Process all files concurrently
const build = async () => {
    const promises = files.map(processFile);
    await Promise.all(promises);
    console.log('Build completed successfully.');
};

build().catch((err) => {
    console.error('Build failed:', err);
    process.exit(1);
});