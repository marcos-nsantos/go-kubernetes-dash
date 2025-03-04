package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/marcos-nsantos/go-kubernetes-dash/k8s"
)

// Handler handles HTTP requests for Kubernetes resources
type Handler struct {
	client *k8s.Client
}

// NewHandler creates a new Handler with the given client
func NewHandler(client *k8s.Client) *Handler {
	return &Handler{
		client: client,
	}
}

// GetNodes returns all nodes in the cluster
func (h *Handler) GetNodes(w http.ResponseWriter, r *http.Request) {
	nodes, err := h.client.GetNodes()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(nodes)
}

// GetPods returns all pods in the given namespace, or all namespaces if no namespace is provided
func (h *Handler) GetPods(w http.ResponseWriter, r *http.Request) {
	namespace := r.URL.Query().Get("namespace")
	pods, err := h.client.GetPods(namespace)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pods)
}

// GetDeployments returns all deployments in the given namespace, or all namespaces if no namespace is provided
func (h *Handler) GetDeployments(w http.ResponseWriter, r *http.Request) {
	namespace := r.URL.Query().Get("namespace")
	deployments, err := h.client.GetDeployments(namespace)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(deployments)
}

// GetServices returns all services in the given namespace, or all namespaces if no namespace is provided
func (h *Handler) GetServices(w http.ResponseWriter, r *http.Request) {
	namespace := r.URL.Query().Get("namespace")
	services, err := h.client.GetServices(namespace)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(services)
}

// GetNamespaces returns all namespaces
func (h *Handler) GetNamespaces(w http.ResponseWriter, r *http.Request) {
	namespaces, err := h.client.GetNamespaces()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(namespaces)
}

// GetPodLogs returns the logs for a specific pod
func (h *Handler) GetPodLogs(w http.ResponseWriter, r *http.Request) {
	namespace := r.URL.Query().Get("namespace")
	podName := r.URL.Query().Get("pod")
	containerName := r.URL.Query().Get("container")
	tailLinesStr := r.URL.Query().Get("tailLines")

	if namespace == "" || podName == "" {
		http.Error(w, "namespace and pod name are required", http.StatusBadRequest)
		return
	}

	tailLines := 100 // default value
	if tailLinesStr != "" {
		if tl, err := strconv.Atoi(tailLinesStr); err == nil {
			tailLines = tl
		}
	}

	logs, err := h.client.GetPodLogs(namespace, podName, containerName, tailLines)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/plain")
	w.Write([]byte(logs))
}
