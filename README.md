# Mini PaaS

Mini PaaS is a lightweight, dynamic Platform as a Service (PaaS) implementation designed to route incoming web traffic to various target workloads based on domain names. It simulates the core routing layer of a cloud provider.

## Core Architecture

The system operates as a **dynamic reverse proxy**. It uses a centralized Redis store to manage routing rules and notify the data plane of any changes, allowing for zero-downtime hot-reloading of routes.

The architecture consists of three main pillars:
1. **Control Plane API**: A management interface to define routing rules.
2. **Gateway Proxy**: The data plane that routes traffic.
3. **State & Event Bus**: A Redis instance storing routes and broadcasting updates.

## Components

### 1. Control Plane API (`control-plane-api`)
- **Technology**: Node.js, Express, TypeScript.
- **Role**: Exposes a REST API (`POST /api/routes`) to register new mappings between a domain and an internal Kubernetes service. It saves these mappings to Redis and publishes a `reload` signal.

### 2. Gateway Proxy (`gateway-proxy`)
- **Technology**: C# .NET using **YARP (Yet Another Reverse Proxy)**.
- **Role**: Intercepts all incoming user traffic. It reads routing configurations from Redis on startup and subscribes to the Redis pub/sub channel. When a `reload` signal is received, it dynamically updates its routing table without restarting.

### 3. Redis (`redis-infrastructure.yaml`)
- **Role**: Acts as the single source of truth for routing state and provides the Pub/Sub mechanism for real-time configuration updates.

### 4. Target Workloads (`target-workloads`)
- **Role**: Sample applications (e.g., `AppOne`, `AppTwo`) deployed within the cluster to demonstrate the routing capabilities.

---

## Prerequisites

To run this project locally, you will need:
- [Docker](https://docs.docker.com/get-docker/)
- A local Kubernetes cluster (e.g., [Minikube](https://minikube.sigs.k8s.io/docs/start/), [Docker Desktop Kubernetes](https://docs.docker.com/desktop/kubernetes/))
- `kubectl` CLI tool
- .NET 8.0+ SDK (for local development)
- Node.js & npm (for local development)

---

## Deployment

The project contains Kubernetes manifests to deploy all necessary infrastructure. 

1. **Start your local Kubernetes cluster** (e.g., `minikube start`).
2. **Build your Docker images** (Ensure your Docker environment points to your Kubernetes cluster, e.g., `eval $(minikube docker-env)`):
   - Build Gateway: `cd gateway-proxy/MiniPaasGateway && docker build -t minipaas-gateway:latest .`
   - Build Control Plane: `cd control-plane-api && docker build -t minipaas-control-plane:latest .`
   - Build Workloads: `cd target-workloads/AppOne && docker build -t minipaas-app-one:latest .`
3. **Apply the Kubernetes Manifests**:
   ```bash
   kubectl apply -f redis-storage.yaml
   kubectl apply -f redis-infrastructure.yaml
   kubectl apply -f control-plane-infrastructure.yaml
   kubectl apply -f gateway-infrastructure.yaml
   kubectl apply -f app-one-infrastructure.yaml
   ```

---

## Usage

### 1. Register a Route

To register a new route, send a POST request to the Control Plane API. If you have port-forwarded the `control-plane-service` to your local machine (e.g., `kubectl port-forward svc/control-plane-service 3000:3000`):

```bash
curl -X POST http://localhost:3000/api/routes \
     -H "Content-Type: application/json" \
     -d '{
           "domain": "app1.local",
           "targetUrl": "http://app-one-service:80"
         }'
```

### 2. Test the Routing

Once registered, the Gateway Proxy will instantly reload its configuration. Assuming you port-forward the Gateway Service (e.g., `kubectl port-forward svc/gateway-service 8080:8080`):

```bash
curl -H "Host: app1.local" http://localhost:8080
```
This request will be intercepted by the Gateway and dynamically routed to `app-one-service`.
