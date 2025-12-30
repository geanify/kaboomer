package player

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"os"
	"os/exec"
	"runtime"
	"sync"
	"time"
)

// Player controls the MPV process
type Player struct {
	socketPath string
	ytDlpPath  string
	cmd        *exec.Cmd
	mutex      sync.Mutex
	currentTitle string // Simple status tracking
}

// New creates a new Player instance
func New(ytDlpPath string) *Player {
	// Create a unique socket path based on OS
	socketPath := "/tmp/kaboomer_mpv.sock"
	if runtime.GOOS == "windows" {
		socketPath = `\\.\pipe\kaboomer_mpv`
	}
	
	if ytDlpPath == "" {
		ytDlpPath = "yt-dlp" // assume in PATH
	}

	return &Player{
		socketPath: socketPath,
		ytDlpPath:  ytDlpPath,
		currentTitle: "Idle",
	}
}

// GetStatus returns the locally tracked status
func (p *Player) GetStatus() string {
	p.mutex.Lock()
	defer p.mutex.Unlock()
	return p.currentTitle
}

// Start launches the mpv process in idle mode
func (p *Player) Start() error {
	p.mutex.Lock()
	defer p.mutex.Unlock()

	// Check if socket exists and remove it (cleanup from previous runs)
	if runtime.GOOS != "windows" {
		if _, err := os.Stat(p.socketPath); err == nil {
			os.Remove(p.socketPath)
		}
	}

	// args: --idle keeps mpv open when playlist is empty
	// --vo=null discards video output but keeps video stream active (fixes stream selection)
	// --input-ipc-server allows us to control it
	// --ytdl-format=bestaudio/best ensures we get audio
	args := []string{
		"--idle",
		"--vo=null",
		"--ytdl-format=bestaudio/best",
		"--input-ipc-server=" + p.socketPath,
		"--script-opts=ytdl_hook-ytdl_path=" + p.ytDlpPath,
	}

	p.cmd = exec.Command("mpv", args...)
	p.cmd.Stdout = os.Stdout
	p.cmd.Stderr = os.Stderr
	
	// Start in background
	if err := p.cmd.Start(); err != nil {
		return fmt.Errorf("failed to start mpv: %w", err)
	}

	// Wait for socket to appear
	socketFound := false
	for i := 0; i < 50; i++ { // Increased wait to 5s
		time.Sleep(100 * time.Millisecond)
		if _, err := os.Stat(p.socketPath); err == nil {
			socketFound = true
			break
		}
		// Check if process died
		if p.cmd.ProcessState != nil && p.cmd.ProcessState.Exited() {
			return fmt.Errorf("mpv process exited unexpectedly")
		}
	}

	if !socketFound {
		return fmt.Errorf("timed out waiting for mpv socket at %s", p.socketPath)
	}

	log.Println("MPV started successfully")
	return nil
}

// Stop kills the mpv process
func (p *Player) Stop() {
	p.mutex.Lock()
	defer p.mutex.Unlock()
	if p.cmd != nil && p.cmd.Process != nil {
		p.cmd.Process.Kill()
	}
}

// sendCommand sends a JSON IPC command to mpv
func (p *Player) sendCommand(command []interface{}) error {
	// Format: { "command": ["cmd", "arg1", ...] }
	payload := map[string]interface{}{
		"command": command,
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	// Append newline as per line-based protocol
	data = append(data, '\n')

	var conn net.Conn
	
	// Retry connection logic
	for i := 0; i < 3; i++ {
		if runtime.GOOS == "windows" {
			// Windows named pipes handling would be needed here, 
			// usually via "github.com/Microsoft/go-winio" but keeping it simple for now as target is Linux
			return fmt.Errorf("windows named pipe support not fully implemented in this snippet")
		} else {
			conn, err = net.Dial("unix", p.socketPath)
		}
		
		if err == nil {
			break
		}
		time.Sleep(200 * time.Millisecond)
	}

	if err != nil {
		return fmt.Errorf("failed to connect to mpv socket: %w", err)
	}
	defer conn.Close()

	_, err = conn.Write(data)
	return err
}

// Play loads and plays a URL
func (p *Player) Play(url string, title string) error {
	p.mutex.Lock()
	p.currentTitle = title
	p.mutex.Unlock()
	// "loadfile", url, "replace" (replaces current track) or "append-play"
	return p.sendCommand([]interface{}{"loadfile", url, "replace"})
}

// Append adds a URL to the internal playlist
func (p *Player) Append(url string) error {
	return p.sendCommand([]interface{}{"loadfile", url, "append"})
}

// Pause toggles pause
func (p *Player) Pause() error {
	// "cycle", "pause"
	return p.sendCommand([]interface{}{"cycle", "pause"})
}

// Next skips to next track
func (p *Player) Next() error {
	return p.sendCommand([]interface{}{"playlist-next"})
}

// Prev skips to previous track
func (p *Player) Prev() error {
	return p.sendCommand([]interface{}{"playlist-prev"})
}

// GetProperty fetches a property from mpv
func (p *Player) GetProperty(prop string) (interface{}, error) {
    // Implementation would require reading the response from the socket
    // For now, we keep it write-only for simplicity unless needed
    return nil, nil
}

