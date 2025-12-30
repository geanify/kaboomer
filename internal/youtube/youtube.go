package youtube

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
)

type Service struct {
	cookiesPath string
	ytDlpPath   string
}

type SearchResult struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Uploader string `json:"uploader"`
	Duration int    `json:"duration"` // Duration in seconds (sometimes float, but int is easier)
	URL      string `json:"url"`
	Thumbnail string `json:"thumbnail"`
}

// yt-dlp JSON output structure (subset)
type ytdlpEntry struct {
	ID       string      `json:"id"`
	Title    string      `json:"title"`
	Uploader string      `json:"uploader"`
	Duration interface{} `json:"duration"` // Can be float or null
	Url      string      `json:"url"`      // Direct URL or page URL
	Webpage  string      `json:"webpage_url"`
}

func New(cookiesPath, ytDlpPath string) *Service {
	if ytDlpPath == "" {
		ytDlpPath = "yt-dlp"
	}
	return &Service{
		cookiesPath: cookiesPath,
		ytDlpPath:   ytDlpPath,
	}
}

// Search performs a search using yt-dlp
func (s *Service) Search(query string) ([]SearchResult, error) {
	// ytsearch5:query -> return top 5 results
	searchQuery := fmt.Sprintf("ytsearch10:%s", query)

	args := []string{
		searchQuery,
		"--dump-json",
		"--flat-playlist", // Don't resolve streams, just metadata
		"--no-warnings",
	}

	if s.cookiesPath != "" {
		if _, err := os.Stat(s.cookiesPath); err == nil {
			args = append(args, "--cookies", s.cookiesPath)
		}
	}

	cmd := exec.Command(s.ytDlpPath, args...)
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("yt-dlp search failed: %w", err)
	}

	// Output is line-delimited JSON
	var results []SearchResult
	scanner := bufio.NewScanner(bytes.NewReader(output))
	for scanner.Scan() {
		line := scanner.Bytes()
		var entry ytdlpEntry
		if err := json.Unmarshal(line, &entry); err != nil {
			continue // Skip malformed lines
		}

		// Calculate duration safely
		var duration int
		if d, ok := entry.Duration.(float64); ok {
			duration = int(d)
		}

		url := entry.Url
		if url == "" {
			url = entry.Webpage
		}
		// If still empty and we have ID, construct it
		if url == "" && entry.ID != "" {
			url = "https://www.youtube.com/watch?v=" + entry.ID
		}
		
		// Construct a thumbnail URL if possible
		thumb := ""
		if entry.ID != "" {
			thumb = fmt.Sprintf("https://i.ytimg.com/vi/%s/hqdefault.jpg", entry.ID)
		}

		results = append(results, SearchResult{
			ID:       entry.ID,
			Title:    entry.Title,
			Uploader: entry.Uploader,
			Duration: duration,
			URL:      url,
			Thumbnail: thumb,
		})
	}

	return results, nil
}

