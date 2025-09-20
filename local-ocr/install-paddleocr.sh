#!/bin/bash

# PaddleOCR Installation Script for macOS/Linux
# This script installs PaddleOCR and its dependencies

echo "🚀 Installing PaddleOCR and Dependencies"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
echo_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
echo_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo_error "Python 3 not found. Please install Python 3.7+ first."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo_info "Python version: $PYTHON_VERSION"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo_error "pip3 not found. Please install pip first."
    exit 1
fi

# Upgrade pip
echo_info "Upgrading pip..."
pip3 install --upgrade pip

# Install system dependencies (macOS with Homebrew)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo_info "Detected macOS - checking for Homebrew..."
    if command -v brew &> /dev/null; then
        echo_info "Installing system dependencies with Homebrew..."
        # These are often needed for OpenCV
        brew install cmake
        brew install pkg-config
        brew install jpeg libpng libtiff openexr
        brew install eigen tbb
    else
        echo_warn "Homebrew not found. Some dependencies might be missing."
        echo_warn "Install Homebrew from: https://brew.sh/"
    fi
fi

# Install Python packages
echo_info "Installing Python packages..."

# Core dependencies
echo_info "Installing core dependencies..."
pip3 install --upgrade setuptools wheel

# OpenCV (computer vision library)
echo_info "Installing OpenCV..."
pip3 install opencv-python

# NumPy (numerical computing)
echo_info "Installing NumPy..."
pip3 install numpy

# Pillow (image processing)
echo_info "Installing Pillow..."
pip3 install Pillow

# PyMuPDF (PDF processing)
echo_info "Installing PyMuPDF..."
pip3 install PyMuPDF

# PaddleOCR (main OCR library)
echo_info "Installing PaddleOCR..."
pip3 install paddleocr

# Additional useful packages
echo_info "Installing additional packages..."
pip3 install matplotlib  # For image visualization if needed

# boto3 (AWS SDK for Python, useful for S3 interactions)
echo_info "Installing boto3 for AWS interactions"
pip3 install boto3

echo ""
echo_info "Installation completed!"
echo ""
echo "🧪 Testing installation..."

# Test installation
python3 -c "
try:
    import cv2
    print('✅ OpenCV imported successfully')
except ImportError as e:
    print(f'❌ OpenCV import failed: {e}')

try:
    import numpy
    print('✅ NumPy imported successfully')
except ImportError as e:
    print(f'❌ NumPy import failed: {e}')

try:
    from PIL import Image
    print('✅ Pillow imported successfully')
except ImportError as e:
    print(f'❌ Pillow import failed: {e}')

try:
    import fitz
    print('✅ PyMuPDF imported successfully')
except ImportError as e:
    print(f'❌ PyMuPDF import failed: {e}')

try:
    from paddleocr import PaddleOCR
    print('✅ PaddleOCR imported successfully')
    print('🎉 All packages installed correctly!')
except ImportError as e:
    print(f'❌ PaddleOCR import failed: {e}')
"

echo ""
echo_info "🎯 Next Steps:"
echo "1. Place a PDF file named 'example.pdf' in your directory"
echo "2. Run the test: python3 test-paddleocr.py"
echo ""
echo_warn "📝 Notes:"
echo "- First run will download OCR models (~100MB)"
echo "- Make sure you have good internet connection"
echo "- Process might take a few minutes for first-time setup"
echo ""
echo "🆘 If you encounter issues:"
echo "- Try: pip3 install --upgrade paddleocr"
echo "- Check: https://github.com/PaddlePaddle/PaddleOCR"
echo ""