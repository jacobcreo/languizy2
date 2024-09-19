const fs = require('fs');
const path = require('path');

// Define the output file
const outputFilePath = path.join(__dirname, 'allscripts.txt');

// Function to combine files
const combineFiles = () => {
  // Clear or create the output file
  fs.writeFileSync(outputFilePath, '', 'utf8');

  // Read all files in the current directory
  fs.readdir(__dirname, (err, files) => {
    if (err) throw err;

    // Filter only .html, .js, and .css files
    const targetFiles = files.filter(file => /\.(html|js|css)$/.test(file));

    targetFiles.forEach(file => {
      // Get the file content
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
      const header = `// ${file}:\n`;

      // Append file name and content to the output file
      fs.appendFileSync(outputFilePath, header + content + '\n\n', 'utf8');
    });

    console.log(`All files have been combined into ${outputFilePath}`);
  });
};

// Run the combineFiles function
combineFiles();
