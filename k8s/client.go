package k8s

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// Client provides access to the Kubernetes API through a proxy
type Client struct {
	baseURL string
}

// NewClient creates a new client that connects to the given Kubernetes API proxy
func NewClient(proxyURL string) *Client {
	if proxyURL == "" {
		proxyURL = "http://127.0.0.1:8001"
	}
	return &Client{
		baseURL: proxyURL,
	}
}

// GetNodes returns all nodes in the cluster
func (c *Client) GetNodes() (map[string]interface{}, error) {
	return c.get("/api/v1/nodes")
}

// GetPods returns all pods in the given namespace, or all namespaces if namespace is empty
func (c *Client) GetPods(namespace string) (map[string]interface{}, error) {
	if namespace == "" {
		return c.get("/api/v1/pods")
	}
	return c.get(fmt.Sprintf("/api/v1/namespaces/%s/pods", namespace))
}

// GetDeployments returns all deployments in the given namespace, or all namespaces if namespace is empty
func (c *Client) GetDeployments(namespace string) (map[string]interface{}, error) {
	if namespace == "" {
		return c.get("/apis/apps/v1/deployments")
	}
	return c.get(fmt.Sprintf("/apis/apps/v1/namespaces/%s/deployments", namespace))
}

// GetServices returns all services in the given namespace, or all namespaces if namespace is empty
func (c *Client) GetServices(namespace string) (map[string]interface{}, error) {
	if namespace == "" {
		return c.get("/api/v1/services")
	}
	return c.get(fmt.Sprintf("/api/v1/namespaces/%s/services", namespace))
}

// get performs a GET request to the Kubernetes API proxy
func (c *Client) get(path string) (map[string]interface{}, error) {
	url := c.baseURL + path

	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("error making request to %s: %v", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("received non-200 status code: %d, body: %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("error decoding response: %v", err)
	}

	return result, nil
}

// GetNamespaces returns all namespaces in the cluster
func (c *Client) GetNamespaces() (map[string]interface{}, error) {
	return c.get("/api/v1/namespaces")
}
