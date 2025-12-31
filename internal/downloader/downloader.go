package downloader

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
)

type Downloader struct {
	ytDlpPath string
	cacheDir  string
	mutex     sync.Mutex
}

func New(ytDlpPath string, cacheDir string) (*Downloader, error) {
	if ytDlpPath == "" {
		ytDlpPath = "./yt-dlp"
	}
	
	// Ensure cache directory exists
	if err := os.MkdirAll(cacheDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create cache dir: %w", err)
	}

	return &Downloader{
		ytDlpPath: ytDlpPath,
		cacheDir:  cacheDir,
	}, nil
}

// Download downloads the video audio to the cache directory.
// It returns the path to the downloaded file.
// It is thread-safe and ensures sequential downloads if called concurrently (via mutex),
// but for a queue system, the caller should probably manage the queueing.
func (d *Downloader) Download(url string, id string) (string, error) {
	d.mutex.Lock()
	defer d.mutex.Unlock()

	// Pattern to find existing files: id.*
	// We use yt-dlp to determine extension, but we need to find it after.
	// Or we force an extension. M4A is usually safe and low CPU (AAC). 
	// WebM (Opus) is also good.
	// Let's force filename to be just ID and let yt-dlp pick extension.
	
	outputTemplate := filepath.Join(d.cacheDir, id+".%(ext)s")
	
	// Check if file already exists with common audio extensions
	commonExts := []string{".m4a", ".mp3", ".webm", ".opus", ".aac", ".wav"}
	for _, ext := range commonExts {
		path := filepath.Join(d.cacheDir, id+ext)
		if _, err := os.Stat(path); err == nil {
			log.Printf("File already cached: %s", path)
			return path, nil
		}
	}

	log.Printf("Starting download for %s (%s)", id, url)

	// Arguments for low CPU:
	// -f bestaudio: Get best audio
	// --no-mtime: Don't set file time to video time
	// --no-playlist: Just one video
	args := []string{
		"-f", "bestaudio[ext=m4a]/bestaudio", // Prefer m4a (AAC) for broad compatibility and low decode cost, fallback to best
		"--no-playlist",
		"--no-mtime",
		"-o", outputTemplate,
		url,
	}

	cmd := exec.Command(d.ytDlpPath, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("yt-dlp download failed: %w", err)
	}

	// Find the file that was created
	matches, err := filepath.Glob(filepath.Join(d.cacheDir, id+".*"))
	if err != nil {
		return "", fmt.Errorf("failed to glob downloaded file: %w", err)
	}
	if len(matches) == 0 {
		return "", fmt.Errorf("download finished but file not found for id %s", id)
	}

	log.Printf("Download finished: %s", matches[0])
	return matches[0], nil
}

// PruneOldFiles could be added later to clean up cache

