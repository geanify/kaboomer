package main

import (
	"flag"
	"kaboomer/internal/downloader"
	"kaboomer/internal/manager"
	"kaboomer/internal/player"
	"kaboomer/internal/server"
	"kaboomer/internal/youtube"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
)

func main() {
	port := flag.String("port", ":8080", "Port to run the server on")
	cookies := flag.String("cookies", "cookies.txt", "Path to cookies.txt for YouTube auth")
	flag.Parse()

	// Get absolute path for static files (assuming running from project root or binary location)
	cwd, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}
	staticDir := filepath.Join(cwd, "web", "static")
	cacheDir := filepath.Join(cwd, "cache")

	// Resolve yt-dlp path
	ytDlpPath := "yt-dlp"
	localYtDlp := filepath.Join(cwd, "yt-dlp")
	if _, err := os.Stat(localYtDlp); err == nil {
		ytDlpPath = localYtDlp
		log.Printf("Using local yt-dlp: %s", ytDlpPath)
	} else {
		log.Println("Using system yt-dlp")
	}

	// Initialize Player
	p := player.New(ytDlpPath)
	if err := p.Start(); err != nil {
		log.Fatalf("Failed to start player: %v. Make sure 'mpv' is installed.", err)
	}
	defer p.Stop()

	// Initialize YouTube Service
	yt := youtube.New(*cookies, ytDlpPath)
	
	// Initialize Downloader
	dl, err := downloader.New(ytDlpPath, cacheDir)
	if err != nil {
		log.Fatalf("Failed to initialize downloader: %v", err)
	}
	
	// Initialize Manager
	mgr := manager.New(p, dl, yt)

	// Initialize Server
	srv := server.New(mgr, yt, staticDir)

	// Channel to listen for interrupt signals
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("Starting server on %s", *port)
		if err := srv.Start(*port); err != nil {
			log.Printf("Server error: %v", err)
			stop <- os.Interrupt
		}
	}()

	<-stop
	log.Println("Shutting down...")
	p.Stop()
}
