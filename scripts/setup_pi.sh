#!/bin/bash

# Exit on error
set -e

echo "Kaboomer - Raspberry Pi Zero Setup Script"
echo "========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (sudo)"
  exit 1
fi

echo "1. Updating package lists..."
apt-get update

echo "2. Installing System Dependencies..."
# mpv: Media player
# python3: Required for yt-dlp
# ffmpeg: Required for stream processing
# ca-certificates: For HTTPS
# atomicparsley: Optional but good for metadata
apt-get install -y mpv python3 ffmpeg ca-certificates atomicparsley

echo "3. Installing/Updating yt-dlp..."
# We download the latest binary directly because apt repositories often have outdated versions
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
chmod a+rx /usr/local/bin/yt-dlp

echo "4. Verifying installations..."
echo "-----------------------------"
mpv --version | head -n 1
python3 --version
yt-dlp --version

echo "-----------------------------"
echo "Setup Complete!"
echo "To deploy the app:"
echo "1. On your PC: GOOS=linux GOARCH=arm GOARM=6 go build -o kaboomer cmd/kaboomer/main.go"
echo "2. Copy 'kaboomer' binary and 'web/' folder to this Pi."
echo "3. Run: ./kaboomer"



