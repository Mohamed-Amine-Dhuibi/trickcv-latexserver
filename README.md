# LaTeX Compiler Server

A simple HTTP server that compiles LaTeX files to PDF format.

## Features

- Upload LaTeX files and get PDF output
- Send LaTeX content as text and receive PDF
- **Multiple LaTeX engines**: Tectonic (fastest - Rust), LuaLaTeX (fast), XeLaTeX (fast), PDFLaTeX (standard)
- **Automatic engine selection** for optimal performance  
- **Tectonic integration** - Self-contained Rust engine with on-demand package downloads
- **Compilation timeouts** to prevent hanging
- Support for custom LaTeX packages
- Automatic cleanup of temporary files
- Error handling with detailed compilation logs
- **Performance metrics** and compilation time tracking

## Prerequisites

- Node.js (v14 or higher)
- LaTeX distribution (see installation options below)

### LaTeX Installation Options

#### Option 1: Manual Installation (Windows)
1. Download and install MiKTeX from https://miktex.org/download
2. During installation, choose "Install missing packages on-the-fly: Yes"
3. Make sure `pdflatex` is in your PATH
4. Restart your terminal after installation
5. Test with: `pdflatex --version`

#### Option 2: Docker (Recommended - No local LaTeX needed)
If you have Docker installed, you can run the server with LaTeX pre-installed:
```bash
docker-compose up --build
```
This creates a container with a full LaTeX installation.

#### Option 3: Using Package Managers
**With Chocolatey (requires admin privileges):**
```bash
choco install miktex -y
```

**With Scoop (no admin needed):**
```bash
scoop install latex
```

## Installation

1. Clone or download this project
2. Install dependencies:
```bash
npm install
```

## Usage

### Start the server
```bash
npm start
```

The server will start on port 3000 (or the port specified in PORT environment variable).

### API Endpoints

#### 1. Health Check
```
GET /
```
Returns server status and available endpoints.

#### 2. Compile LaTeX File
```
POST /compile
Content-Type: multipart/form-data
```

Upload a `.tex` file using the `latex` field name. Optionally specify engine and timeout.

**Form fields:**
- `latex`: The .tex file (required)
- `engine`: LaTeX engine to use (optional: lualatex, xelatex, pdflatex)
- `timeout`: Compilation timeout in milliseconds (optional, default: 30000)

**Example using curl:**
```bash
curl -X POST -F "latex=@document.tex" -F "engine=lualatex" http://localhost:3000/compile -o output.pdf
```

#### 3. Compile LaTeX Text
```
POST /compile-text
Content-Type: application/json
```

Send LaTeX content as JSON with optional engine selection.

**Request body:**
```json
{
  "latex": "\\documentclass{article}\\begin{document}Hello World!\\end{document}",
  "filename": "my-document",
  "engine": "lualatex",
  "timeout": 30000
}
```

**Example using curl:**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"latex":"\\documentclass{article}\\begin{document}Hello World!\\end{document}","filename":"hello","engine":"lualatex"}' \
  http://localhost:3000/compile-text -o hello.pdf
```

## Engine Performance

The server automatically detects available LaTeX engines and uses the fastest one by default:

1. **Tectonic** (fastest) - Rust-based engine with self-contained packages and faster compilation
2. **LuaLaTeX** (fast) - Modern Lua-based engine with better performance  
3. **XeLaTeX** (fast) - Unicode support and modern font handling
4. **PDFLaTeX** (standard) - Traditional and most compatible engine

**Speed comparison:** Tectonic > LuaLaTeX > XeLaTeX > PDFLaTeX

### Tectonic Advantages:
- **Fastest compilation** - Written in Rust for optimal performance
- **Self-contained** - Downloads packages on-demand, no full TeX installation needed
- **Modern architecture** - Better caching and dependency management
- **Reliable** - Fewer dependency issues compared to traditional engines

You can specify which engine to use by adding `engine` parameter to your requests.

## Adding LaTeX Packages

To use additional LaTeX packages, simply include them in your LaTeX document using `\usepackage{}`. The server will attempt to compile with whatever packages are available in your LaTeX installation.

**Example LaTeX with packages:**
```latex
\documentclass{article}
\usepackage{amsmath}
\usepackage{graphicx}
\usepackage{hyperref}

\begin{document}
\title{My Document}
\author{Your Name}
\maketitle

\section{Introduction}
This is a sample document with packages.

\begin{equation}
E = mc^2
\end{equation}

\end{document}
```

## Error Handling

If compilation fails, the server returns a JSON response with error details:

```json
{
  "error": "LaTeX compilation failed",
  "details": "Error description",
  "log": "Full compilation log",
  "stderr": "Error output"
}
```

## Development

Run in development mode with auto-restart:
```bash
npm run dev
```

## Directory Structure

```
latexServer/
├── server.js          # Main server file
├── package.json       # Dependencies
├── temp/              # Temporary LaTeX files (auto-created)
├── output/            # Temporary PDF outputs (auto-created)
└── README.md          # This file
```

## Environment Variables

- `PORT`: Server port (default: 3000)

## License

MIT License
