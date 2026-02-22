const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create necessary directories
const tempDir = path.join(__dirname, 'temp');
const outputDir = path.join(__dirname, 'output');
fs.ensureDirSync(tempDir);
fs.ensureDirSync(outputDir);

// Tectonic path - detect OS and use appropriate binary
const TECTONIC_PATH = process.platform === 'win32' 
  ? path.join(__dirname, 'tectonic', 'tectonic.exe')
  : path.join(__dirname, 'tectonic', 'tectonic');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    cb(null, `${uniqueId}.tex`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/plain' || file.originalname.endsWith('.tex')) {
      cb(null, true);
    } else {
      cb(new Error('Only .tex files are allowed'), false);
    }
  }
});

// Helper function to fix common LaTeX issues
async function fixCommonLatexIssues(texContent, forceOutput = true) {
  if (!forceOutput) return texContent;
  
  let fixedContent = texContent;
  let changesCount = 0;
  
  // Check if document defines custom column types (L, C, R, etc.)
  const hasCustomColumnTypes = /\\newcolumntype\{[LCR]\}/i.test(fixedContent);
  
  if (!hasCustomColumnTypes) {
    // Only fix uppercase column types if they're NOT custom-defined
    // Fix common array package issues - Replace {L} with {l} in tabular definitions
    const lColumnPattern = /(\{[^}]*?)L([^}]*?\})/g;
    const beforeL = fixedContent;
    fixedContent = fixedContent.replace(lColumnPattern, '$1l$2');
    if (fixedContent !== beforeL) {
      changesCount++;
      console.log(`🔧 Fixed L column type to l in tabular definition`);
    }
    
    // Replace other uppercase column types
    const rColumnPattern = /(\{[^}]*?)R([^}]*?\})/g;
    const beforeR = fixedContent;
    fixedContent = fixedContent.replace(rColumnPattern, '$1r$2');
    if (fixedContent !== beforeR) {
      changesCount++;
      console.log(`🔧 Fixed R column type to r in tabular definition`);
    }
    
    const cColumnPattern = /(\{[^}]*?)C([^}]*?\})/g;
    const beforeC = fixedContent;
    fixedContent = fixedContent.replace(cColumnPattern, '$1c$2');
    if (fixedContent !== beforeC) {
      changesCount++;
      console.log(`🔧 Fixed C column type to c in tabular definition`);
    }
  } else {
    console.log(`✓ Document defines custom column types - skipping uppercase column type fixes`);
  }
  
  // Add array package if tabular is used but array isn't included
  if (fixedContent.includes('\\begin{tabular}') && !fixedContent.includes('\\usepackage{array}')) {
    fixedContent = fixedContent.replace(
      /(\\documentclass\{[^}]+\})/,
      '$1\n\\usepackage{array}'
    );
    changesCount++;
    console.log(`🔧 Added missing array package`);
  }
  
  if (changesCount > 0) {
    console.log(`🔧 Applied ${changesCount} automatic LaTeX fixes`);
  }
  
  return fixedContent;
}

// Check if Tectonic is available
function checkTectonic() {
  return fs.existsSync(TECTONIC_PATH);
}

// Simple Tectonic compilation function with error tolerance
function compileTectonic(texFilePath, outputPath, forceOutput = true) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(texFilePath, '.tex');
    
    console.log(`🚀 Compiling with Tectonic: ${texFilePath}`);
    console.log(`📁 Output directory: ${outputPath}`);
    
    const args = [
      '--outdir', outputPath,
      '--print',
      texFilePath
    ];
    
    // Add options to be more permissive with errors
    if (forceOutput) {
      args.unshift('--keep-logs');
      args.unshift('--keep-intermediates');
      // Don't halt on errors - let Tectonic try to continue
      args.unshift('--chatter', 'minimal');
    }
    
    // Set environment variables to be more permissive
    const env = { ...process.env };
    if (forceOutput) {
      // Try to ignore font config errors
      env.FONTCONFIG_FILE = '';
      env.FONTCONFIG_PATH = '';
    }
    
    const tectonicProc = spawn(TECTONIC_PATH, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: env
    });

    let stdout = '';
    let stderr = '';

    tectonicProc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    tectonicProc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Set timeout for compilation
    const timeout = setTimeout(() => {
      tectonicProc.kill();
      reject(new Error('Compilation timed out after 60 seconds'));
    }, 60000);

    tectonicProc.on('close', (code) => {
      clearTimeout(timeout);
      
      const pdfPath = path.join(outputPath, `${fileName}.pdf`);
      
      // Check if PDF was generated regardless of exit code when forceOutput is true
      if (fs.existsSync(pdfPath)) {
        console.log(`✅ PDF generated successfully: ${pdfPath}`);
        if (code !== 0) {
          console.log(`⚠️  Warning: Compilation had errors (code ${code}) but PDF was still created`);
        }
        resolve({ 
          pdfPath, 
          log: stdout, 
          stderr: stderr,
          hasWarnings: code !== 0,
          exitCode: code 
        });
      } else {
        console.log(`❌ Compilation failed with code ${code}, no PDF generated`);
        reject(new Error(`Tectonic compilation failed: ${stderr || stdout}`));
      }
    });

    tectonicProc.on('error', (error) => {
      clearTimeout(timeout);
      console.log(`💥 Process error: ${error.message}`);
      reject(error);
    });
  });
}

// Routes
app.get('/', (req, res) => {
  const tectonicAvailable = checkTectonic();
  
  res.json({
    message: 'LaTeX Compiler Server (Tectonic Only)',
    version: '2.0.0',
    engine: 'Tectonic (Rust-based)',
    available: tectonicAvailable,
    endpoints: {
      'POST /compile': 'Compile LaTeX file to PDF (supports forceOutput query param)',
      'POST /compile-text': 'Compile LaTeX text to PDF (supports forceOutput in body)',
      'GET /': 'Health check'
    },
    options: {
      forceOutput: 'Enabled by default - generates PDF even with compilation warnings/errors when possible. Set to false to disable.'
    },
    examples: {
      fileUpload: 'POST /compile (forceOutput enabled by default)',
      textCompile: 'POST /compile-text with { "latex": "..." } (forceOutput enabled by default)',
      strictMode: 'Add ?forceOutput=false or {"forceOutput": false} for strict compilation'
    }
  });
});

// Compile LaTeX file upload
app.post('/compile', upload.single('latex'), async (req, res) => {
  console.log('📥 File upload request received');
  
  if (!checkTectonic()) {
    return res.status(500).json({ 
      error: 'Tectonic not available',
      message: 'Please ensure Tectonic is installed in the tectonic/ directory'
    });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No LaTeX file provided' });
  }

  const texFilePath = req.file.path;
  const uniqueId = path.basename(texFilePath, '.tex');
  const workingOutputDir = path.join(outputDir, uniqueId);
  
  // Check if force output is requested (default to true to ignore compilation errors)
  const forceOutput = req.body.forceOutput !== 'false' && req.query.forceOutput !== 'false';
  
  try {
    // Read and potentially fix the uploaded LaTeX file
    if (forceOutput) {
      const originalContent = await fs.readFile(texFilePath, 'utf8');
      const fixedContent = await fixCommonLatexIssues(originalContent, forceOutput);
      if (fixedContent !== originalContent) {
        await fs.writeFile(texFilePath, fixedContent, 'utf8');
        console.log(`🔧 Applied automatic LaTeX fixes to uploaded file`);
      }
    }
    
    // Create output directory
    fs.ensureDirSync(workingOutputDir);
    
    const startTime = Date.now();
    const result = await compileTectonic(texFilePath, workingOutputDir, forceOutput);
    const compilationTime = Date.now() - startTime;
    
    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${req.file.originalname.replace('.tex', '.pdf')}"`);
    res.setHeader('X-Compilation-Time', compilationTime.toString());
    res.setHeader('X-Engine-Used', 'tectonic');
    res.setHeader('X-Has-Warnings', result.hasWarnings ? 'true' : 'false');
    res.setHeader('X-Exit-Code', result.exitCode.toString());
    
    const pdfStream = fs.createReadStream(result.pdfPath);
    pdfStream.pipe(res);

    // Cleanup
    pdfStream.on('end', () => {
      setTimeout(() => {
        fs.remove(texFilePath).catch(console.error);
        fs.remove(workingOutputDir).catch(console.error);
      }, 1000);
    });

  } catch (error) {
    console.error('❌ Compilation error:', error.message);
    res.status(500).json({
      error: 'Compilation failed',
      details: error.message,
      suggestion: 'Try adding ?forceOutput=false to disable error tolerance, or check your LaTeX syntax'
    });
    
    // Cleanup on error
    fs.remove(texFilePath).catch(console.error);
    fs.remove(workingOutputDir).catch(console.error);
  }
});

// Compile LaTeX text
app.post('/compile-text', async (req, res) => {
  console.log('📥 Text compilation request received');
  
  if (!checkTectonic()) {
    return res.status(500).json({ 
      error: 'Tectonic not available',
      message: 'Please ensure Tectonic is installed in the tectonic/ directory'
    });
  }

  const { latex, filename, forceOutput } = req.body;
  
  if (!latex) {
    return res.status(400).json({ error: 'No LaTeX content provided' });
  }

  const uniqueId = uuidv4();
  const texFilePath = path.join(tempDir, `${uniqueId}.tex`);
  const workingOutputDir = path.join(outputDir, uniqueId);
  
  // Check if force output is requested (default to true to ignore compilation errors)
  const shouldForceOutput = forceOutput !== false && forceOutput !== 'false';
  
  try {
    // Write LaTeX content to file
    const fixedLatex = await fixCommonLatexIssues(latex, shouldForceOutput);
    await fs.writeFile(texFilePath, fixedLatex, 'utf8');
    console.log(`📝 LaTeX written to: ${texFilePath}`);
    if (fixedLatex !== latex) {
      console.log(`🔧 Applied automatic LaTeX fixes for common issues`);
    }
    
    // Create output directory
    fs.ensureDirSync(workingOutputDir);
    
    const startTime = Date.now();
    const result = await compileTectonic(texFilePath, workingOutputDir, shouldForceOutput);
    const compilationTime = Date.now() - startTime;
    
    console.log(`⏱️  Compilation time: ${compilationTime}ms`);
    
    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'document'}.pdf"`);
    res.setHeader('X-Compilation-Time', compilationTime.toString());
    res.setHeader('X-Engine-Used', 'tectonic');
    res.setHeader('X-Has-Warnings', result.hasWarnings ? 'true' : 'false');
    res.setHeader('X-Exit-Code', result.exitCode.toString());
    
    const pdfStream = fs.createReadStream(result.pdfPath);
    pdfStream.pipe(res);

    // Cleanup
    pdfStream.on('end', () => {
      setTimeout(() => {
        fs.remove(texFilePath).catch(console.error);
        fs.remove(workingOutputDir).catch(console.error);
      }, 1000);
    });

  } catch (error) {
    console.error('❌ Compilation error:', error.message);
    res.status(500).json({
      error: 'Compilation failed',
      details: error.message,
      suggestion: 'Try setting forceOutput=false in the request body to disable error tolerance, or check your LaTeX syntax'
    });
    
    // Cleanup on error
    fs.remove(texFilePath).catch(console.error);
    fs.remove(workingOutputDir).catch(console.error);
  }
});

// Error handling
app.use((error, req, res, next) => {
  console.error('💥 Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Tectonic LaTeX Server running on port ${PORT}`);
  console.log(`📍 Visit http://localhost:${PORT} for API info`);
  
  const tectonicAvailable = checkTectonic();
  if (tectonicAvailable) {
    console.log(`✅ Tectonic found at: ${TECTONIC_PATH}`);
  } else {
    console.log(`❌ Tectonic not found at: ${TECTONIC_PATH}`);
    console.log(`📥 Run install-tectonic.bat to install Tectonic`);
  }
});

module.exports = app;
