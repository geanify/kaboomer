# Kaboomer

A simple, private, self-hosted music player for Raspberry Pi Zero.

## Features
- **Privacy First**: No listening in, no tracking.
- **Web Interface**: Clean, responsive UI for mobile and desktop.
- **PWA Support**: Add to home screen as an app.
- **YouTube Integration**: Plays audio from YouTube and YouTube Music.
- **Lightweight**: Optimized for Raspberry Pi Zero (audio only).

## Installation on Raspberry Pi

### 1. Prepare the Pi
Run the setup script on your Raspberry Pi to install dependencies (`mpv`, `yt-dlp`, etc.):

```bash
# Copy script to Pi or create it there
sudo ./scripts/setup_pi.sh
```

### 2. Build for Pi Zero (ARMv6)
From your development machine (PC/Mac/Linux):

```bash
# Build the binary
GOOS=linux GOARCH=arm GOARM=6 go build -o kaboomer cmd/kaboomer/main.go
```

### 3. Deploy
Copy the files to your Pi (e.g., to `/home/pi/kaboomer`):
- `kaboomer` (the binary you just built)
- `web/` (directory containing static assets)
- `cookies.txt` (optional, for authenticated YouTube access)

### 4. Run
On the Pi:

```bash
cd /home/pi/kaboomer
./kaboomer
```

Access via browser at `http://<pi-ip-address>:8080`

### 5. Run as Service (Optional)
To start automatically on boot:

1. Edit `scripts/kaboomer.service` to match your paths/user.
2. Copy to systemd: `sudo cp scripts/kaboomer.service /etc/systemd/system/`
3. Enable and start:
   ```bash
   sudo systemctl enable kaboomer
   sudo systemctl start kaboomer
   ```

