const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// Input directory (your root directory)
const inputDir = path.resolve(__dirname, '.'); // Current directory (root)

console.log(`Starting build process in directory: ${inputDir}`);

// Function to minify a single file
const minifyFile = async (file) => {
    const filePath = path.join(inputDir, file);
    console.log(`Processing file: ${filePath}`);

    if (file.endsWith('.js')) { // Only process JavaScript files
        try {
            const code = fs.readFileSync(filePath, 'utf8');
            console.log(`Read code from ${filePath}`);

            // Minify the JavaScript and remove console.log
            const result = await minify(code, {
                compress: {
                    drop_console: true, // Removes console.log
                },
                mangle: true, // Optional: Mangle variable names for additional compression
            });

            if (result.error) {
                console.error(`Error minifying ${file}:`, result.error);
                return;
            }

            // Write minified file back to the root directory, overwriting the original
            fs.writeFileSync(filePath, result.code, 'utf8');
            console.log(`Minified ${file} and updated ${filePath}`);
        } catch (err) {
            console.error(`Failed to process ${file}:`, err);
        }
    } else {
        console.log(`Skipping non-JS file: ${file}`);
    }
};

// Read all files in the input directory
const files = fs.readdirSync(inputDir);

// Process all JS files concurrently
const build = async () => {
    const promises = files.map(minifyFile);
    await Promise.all(promises);
    console.log('Build completed successfully.');
};

build().catch((err) => {
    console.error('Build failed:', err);
    process.exit(1);
});
