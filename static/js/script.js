document.addEventListener("DOMContentLoaded", () => {
  // Initialize tabs with smooth transitions
  const tabs = document.querySelectorAll("nav a");
  const sections = document.querySelectorAll("section");

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      const targetSection = tab.getAttribute("data-section");

      // Add transition class to sections
      sections.forEach((s) => (s.style.opacity = "0"));

      // Remove active class from all tabs and sections
      tabs.forEach((t) => t.classList.remove("active"));
      sections.forEach((s) => s.classList.remove("active"));

      // Add active class to clicked tab and corresponding section
      tab.classList.add("active");

      // Delay the section activation for smooth transition
      setTimeout(() => {
        document.getElementById(targetSection).classList.add("active");
        document.getElementById(targetSection).style.opacity = "1";
        // Load data for the selected section
        loadData(targetSection);
      }, 150);
    });
  });

  // Namespace selector with loading state
  const namespaceSelector = document.getElementById("namespace");
  namespaceSelector.addEventListener("change", () => {
    const activeSection = document.querySelector("section.active").id;
    // Add loading state to the active section
    const container = document.getElementById(`${activeSection}-container`);
    container.innerHTML = '<div class="loading">Loading data...</div>';
    loadData(activeSection);
  });

  // Load namespaces with loading state
  loadNamespaces();

  // Load initial data for the active section
  loadData("nodes");
});

// Load namespaces to populate the dropdown
async function loadNamespaces() {
  try {
    const response = await fetch("/api/namespaces");
    const data = await response.json();

    // Extract namespace names from the items array
    const namespaceSelector = document.getElementById("namespace");
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((ns) => {
        const name = ns.metadata?.name;
        if (name) {
          const option = document.createElement("option");
          option.value = name;
          option.textContent = name;
          namespaceSelector.appendChild(option);
        }
      });
    }
  } catch (error) {
    console.error("Error loading namespaces:", error);
  }
}

// Add loading animation to containers
function showLoading(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = `
      <div class="loading">
          <svg class="loading-spinner" viewBox="0 0 50 50">
              <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
          </svg>
          <p>Loading data...</p>
      </div>
  `;
}

// Add error state to containers
function showError(containerId, error) {
  const container = document.getElementById(containerId);
  container.innerHTML = `
      <div class="error-state">
          <svg viewBox="0 0 24 24" width="48" height="48">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <p>Error loading data</p>
          <p class="error-message">${error}</p>
          <button onclick="retryLoad('${containerId}')">Try Again</button>
      </div>
  `;
}

// Add retry functionality
function retryLoad(containerId) {
  const section = containerId.replace("-container", "");
  loadData(section);
}

// Update loadData function with loading states
async function loadData(section) {
  const container = document.getElementById(`${section}-container`);
  const namespace = document.getElementById("namespace").value;

  showLoading(`${section}-container`);

  try {
    let url = `/api/${section}`;
    if (namespace) {
      url += `?namespace=${namespace}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Clear container
    container.innerHTML = "";

    // Render data with fade-in animation
    container.style.opacity = "0";

    // Call appropriate render function
    switch (section) {
      case "nodes":
        renderNodes(data, container);
        break;
      case "pods":
        renderPods(data, container);
        break;
      case "deployments":
        renderDeployments(data, container);
        break;
      case "services":
        renderServices(data, container);
        break;
    }

    // Fade in the content
    setTimeout(() => {
      container.style.opacity = "1";
    }, 50);
  } catch (error) {
    console.error(`Error loading ${section}:`, error);
    showError(`${section}-container`, error.message);
  }
}

// Render nodes in the container
function renderNodes(data, container) {
  if (!data.items || data.items.length === 0) {
    container.innerHTML = '<div class="no-data">No nodes found.</div>';
    return;
  }

  data.items.forEach((node) => {
    const nodeReady = node.status?.conditions?.find(
      (condition) => condition.type === "Ready"
    );
    const isReady = nodeReady && nodeReady.status === "True";

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
            <h3>${node.metadata?.name || "Unknown"}</h3>
            <div class="card-status ${
              isReady ? "status-ready" : "status-error"
            }">
                ${isReady ? "Ready" : "Not Ready"}
            </div>
            <div class="card-details">
                <p>
                    OS: <span>${
                      node.status?.nodeInfo?.osImage || "Unknown"
                    }</span>
                </p>
                <p>
                    Kernel: <span>${
                      node.status?.nodeInfo?.kernelVersion || "Unknown"
                    }</span>
                </p>
                <p>
                    Container Runtime: <span>${
                      node.status?.nodeInfo?.containerRuntimeVersion ||
                      "Unknown"
                    }</span>
                </p>
                <p>
                    Kubelet: <span>${
                      node.status?.nodeInfo?.kubeletVersion || "Unknown"
                    }</span>
                </p>
            </div>
        `;
    container.appendChild(card);
  });
}

// Render pods in the container
function renderPods(data, container) {
  if (!data.items || data.items.length === 0) {
    container.innerHTML = '<div class="no-data">No pods found.</div>';
    return;
  }

  data.items.forEach((pod) => {
    const card = document.createElement("div");
    card.className = "card";

    // Determine pod status
    const phase = pod.status?.phase || "Unknown";
    let statusClass = "status-pending";
    if (phase === "Running") {
      statusClass = "status-running";
    } else if (phase === "Failed") {
      statusClass = "status-failed";
    }

    card.innerHTML = `
            <h3>${pod.metadata?.name || "Unknown"}</h3>
            <div class="card-status ${statusClass}">
                ${phase}
            </div>
            <div class="card-details">
                <p>
                    Namespace: <span>${
                      pod.metadata?.namespace || "Unknown"
                    }</span>
                </p>
                <p>
                    Node: <span>${pod.spec?.nodeName || "N/A"}</span>
                </p>
                <p>
                    IP: <span>${pod.status?.podIP || "N/A"}</span>
                </p>
                <p>
                    Created: <span>${
                      pod.metadata?.creationTimestamp
                        ? new Date(
                            pod.metadata.creationTimestamp
                          ).toLocaleString()
                        : "Unknown"
                    }</span>
                </p>
            </div>
            <button class="view-logs-button" data-pod="${
              pod.metadata?.name
            }" data-namespace="${pod.metadata?.namespace}">View Logs</button>
        `;

    // Add click handler for the logs button
    const logsButton = card.querySelector(".view-logs-button");
    logsButton.addEventListener("click", () => {
      showLogs(pod);
    });

    container.appendChild(card);
  });
}

// Logs modal functionality
const modal = document.getElementById("logsModal");
const closeButton = modal.querySelector(".close-button");
const containerSelect = document.getElementById("containerSelect");
const tailLinesSelect = document.getElementById("tailLines");
const refreshButton = document.getElementById("refreshLogs");
const logsContent = document.getElementById("logsContent");

let currentPod = null;

closeButton.addEventListener("click", () => {
  modal.classList.remove("show");
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("show");
  }
});

refreshButton.addEventListener("click", () => {
  if (currentPod) {
    loadPodLogs(currentPod);
  }
});

containerSelect.addEventListener("change", () => {
  if (currentPod) {
    loadPodLogs(currentPod);
  }
});

tailLinesSelect.addEventListener("change", () => {
  if (currentPod) {
    loadPodLogs(currentPod);
  }
});

function showLogs(pod) {
  currentPod = pod;
  modal.classList.add("show");

  // Update container select options
  containerSelect.innerHTML = '<option value="">Loading containers...</option>';

  const containers = [];
  if (pod.spec?.containers) {
    containers.push(...pod.spec.containers.map((c) => c.name));
  }
  if (pod.spec?.initContainers) {
    containers.push(...pod.spec.initContainers.map((c) => c.name));
  }

  containerSelect.innerHTML = containers
    .map((name) => `<option value="${name}">${name}</option>`)
    .join("");

  // Load initial logs
  loadPodLogs(pod);
}

async function loadPodLogs(pod) {
  const namespace = pod.metadata?.namespace;
  const podName = pod.metadata?.name;
  const container = containerSelect.value;
  const tailLines = tailLinesSelect.value;

  if (!namespace || !podName) {
    logsContent.textContent = "Error: Pod information is missing";
    return;
  }

  logsContent.textContent = "Loading logs...";

  try {
    const params = new URLSearchParams({
      namespace,
      pod: podName,
      tailLines,
    });
    if (container) {
      params.append("container", container);
    }

    const response = await fetch(`/api/logs?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const logs = await response.text();
    logsContent.textContent = logs || "No logs available";
  } catch (error) {
    console.error("Error loading logs:", error);
    logsContent.textContent = `Error loading logs: ${error.message}`;
  }
}

// Render deployments in the container
function renderDeployments(data, container) {
  if (!data.items || data.items.length === 0) {
    container.innerHTML = '<div class="no-data">No deployments found.</div>';
    return;
  }

  data.items.forEach((deployment) => {
    const card = document.createElement("div");
    card.className = "card";

    const readyReplicas = deployment.status?.readyReplicas || 0;
    const desiredReplicas = deployment.spec?.replicas || 0;
    const isReady = readyReplicas === desiredReplicas && desiredReplicas > 0;

    card.innerHTML = `
            <h3>${deployment.metadata?.name || "Unknown"}</h3>
            <div class="card-status ${
              isReady ? "status-ready" : "status-pending"
            }">
                ${readyReplicas}/${desiredReplicas} Ready
            </div>
            <div class="card-details">
                <p>
                    Namespace: <span>${
                      deployment.metadata?.namespace || "Unknown"
                    }</span>
                </p>
                <p>
                    Created: <span>${
                      deployment.metadata?.creationTimestamp
                        ? new Date(
                            deployment.metadata.creationTimestamp
                          ).toLocaleString()
                        : "Unknown"
                    }</span>
                </p>
                <p>
                    Selector: <span>${
                      deployment.spec?.selector?.matchLabels
                        ? Object.entries(deployment.spec.selector.matchLabels)
                            .map(([k, v]) => `${k}=${v}`)
                            .join(", ")
                        : "N/A"
                    }</span>
                </p>
            </div>
        `;
    container.appendChild(card);
  });
}

// Render services in the container
function renderServices(data, container) {
  if (!data.items || data.items.length === 0) {
    container.innerHTML = '<div class="no-data">No services found.</div>';
    return;
  }

  data.items.forEach((service) => {
    const card = document.createElement("div");
    card.className = "card";

    const ports = service.spec?.ports
      ? service.spec.ports.map((port) => {
          return `${port.port}${port.targetPort ? ":" + port.targetPort : ""}/${
            port.protocol
          }`;
        })
      : "N/A";

    card.innerHTML = `
            <h3>${service.metadata?.name || "Unknown"}</h3>
            <div class="card-status status-ready">
                ${service.spec?.type || "Unknown"}
            </div>
            <div class="card-details">
                <p>
                    Namespace: <span>${
                      service.metadata?.namespace || "Unknown"
                    }</span>
                </p>
                <p>
                    Cluster IP: <span>${service.spec?.clusterIP || "N/A"}</span>
                </p>
                <p>
                    Ports: <span>${ports}</span>
                </p>
                <p>
                    Selector: <span>${
                      service.spec?.selector
                        ? Object.entries(service.spec.selector)
                            .map(([k, v]) => `${k}=${v}`)
                            .join(", ")
                        : "N/A"
                    }</span>
                </p>
            </div>
        `;
    container.appendChild(card);
  });
}
