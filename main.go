package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"

	"github.com/marcos-nsantos/go-kubernetes-dash/handlers"
	"github.com/marcos-nsantos/go-kubernetes-dash/k8s"
)

func main() {
	// Parse command line flags
	proxyURL := flag.String("proxy", "http://127.0.0.1:8001", "URL of the Kubernetes API proxy")
	port := flag.Int("port", 8080, "port to run the server on")
	flag.Parse()

	// Initialize Kubernetes client
	client := k8s.NewClient(*proxyURL)

	// Create handlers
	h := handlers.NewHandler(client)

	// Set up routes
	http.Handle("/", http.FileServer(http.Dir("./static")))
	http.HandleFunc("/api/nodes", h.GetNodes)
	http.HandleFunc("/api/pods", h.GetPods)
	http.HandleFunc("/api/deployments", h.GetDeployments)
	http.HandleFunc("/api/services", h.GetServices)
	http.HandleFunc("/api/namespaces", h.GetNamespaces)
	http.HandleFunc("/api/logs", h.GetPodLogs)

	// Start server
	addr := fmt.Sprintf(":%d", *port)
	log.Printf("Starting server on %s", addr)
	log.Printf("Dashboard available at http://localhost:%d", *port)
	log.Printf("Connecting to Kubernetes API proxy at %s", *proxyURL)

	log.Fatal(http.ListenAndServe(addr, nil))
}
