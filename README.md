# Kubernetes Dashboard

A simple dashboard application built in Go for monitoring Kubernetes clusters by connecting to the Kubernetes API proxy.

## Features

- View node information
- Monitor pod status
- Check deployments
- View services

## Prerequisites

- Go 1.24 or higher
- A running Kubernetes cluster
- Kubernetes API proxy running (typically at 127.0.0.1:8001)

## Installation

1. Clone the repository
   ```
   git clone https://github.com/marcos-nsantos/go-kubernetes-dash.git
   cd go-kubernetes-dash
   ```

2. Build the application
   ```
   go build -o k8s-dash
   ```

3. Start the Kubernetes API proxy in a separate terminal
   ```
   kubectl proxy
   ```

4. Run the application
   ```
   ./k8s-dash
   ```

5. Access the dashboard at http://localhost:8080

## Configuration

By default, the application connects to the Kubernetes API proxy at http://127.0.0.1:8001. You can specify a different proxy URL using the `--proxy` flag:

```
./k8s-dash --proxy=http://custom-proxy:8001
```

You can also change the port that the dashboard listens on:

```
./k8s-dash --port=3000
``` 