const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// Input directory (your root directory)
const inputDir = path.resolve(__dirname, '.'); // Current directory (root)
const outputDir = path.resolve(__dirname, 'dist'); // Temporary folder for minified files

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Minify and remove console.logs
fs.readdirSync(inputDir).forEach(async (file) => {
    if (file.endsWith('.js')) { // Only process JavaScript files
        const filePath = path.join(inputDir, file);
        const code = fs.readFileSync(filePath, 'utf8');

        // Minify the JavaScript and remove console.log
        const result = await minify(code, {
            compress: {
                drop_console: true, // Removes console.log
            },
        });

        // Write minified file to the output directory
        const outputPath = path.join(outputDir, file); // Save to 'dist' folder temporarily
        fs.writeFileSync(outputPath, result.code, 'utf8');
        console.log(`Minified ${file} -> ${outputPath}`);
    }
});
