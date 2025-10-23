#!/bin/bash

# Manual test for Module Federation infrastructure with fixed ports
# This ensures remotes are available before hosts start

echo "=== Module Federation Manual Test ==="
echo "Testing with fixed ports to avoid publicPath mismatch"
echo ""

# Fixed ports for consistency
SSR_REMOTE_PORT=4001
SSR_HOST_PORT=4002
CSR_REMOTE_PORT=4003
CSR_HOST_PORT=4004

# Function to wait for server
wait_for_server() {
    local url=$1
    local name=$2
    local max_attempts=60
    local attempt=0

    echo "Waiting for $name at $url..."
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|404"; then
            echo "✅ $name is ready!"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    echo "❌ Timeout waiting for $name"
    return 1
}

# Step 1: Build SSR Remote with fixed port
echo "=== Building SSR Remote (port $SSR_REMOTE_PORT) ==="
cd rsc-ssr-mf
BUNDLER=webpack ASSET_PREFIX="http://localhost:$SSR_REMOTE_PORT" pnpm run build

# Step 2: Start SSR Remote server
echo "=== Starting SSR Remote Server ==="
PORT=$SSR_REMOTE_PORT ASSET_PREFIX="http://localhost:$SSR_REMOTE_PORT" pnpm run serve &
SSR_REMOTE_PID=$!
wait_for_server "http://localhost:$SSR_REMOTE_PORT/static/mf-manifest.json" "SSR Remote"

# Step 3: Build SSR Host with remote URL
echo "=== Building SSR Host (port $SSR_HOST_PORT) ==="
cd ../rsc-ssr-mf-host
BUNDLER=webpack REMOTE_URL="http://localhost:$SSR_REMOTE_PORT" ASSET_PREFIX="http://localhost:$SSR_HOST_PORT" pnpm run build

# Step 4: Start SSR Host server
echo "=== Starting SSR Host Server ==="
PORT=$SSR_HOST_PORT REMOTE_URL="http://localhost:$SSR_REMOTE_PORT" ASSET_PREFIX="http://localhost:$SSR_HOST_PORT" pnpm run serve &
SSR_HOST_PID=$!
wait_for_server "http://localhost:$SSR_HOST_PORT" "SSR Host"

# Step 5: Build CSR Remote with fixed port
echo "=== Building CSR Remote (port $CSR_REMOTE_PORT) ==="
cd ../rsc-csr-mf
BUNDLER=webpack ASSET_PREFIX="http://localhost:$CSR_REMOTE_PORT" pnpm run build

# Step 6: Start CSR Remote server
echo "=== Starting CSR Remote Server ==="
PORT=$CSR_REMOTE_PORT ASSET_PREFIX="http://localhost:$CSR_REMOTE_PORT" pnpm run serve &
CSR_REMOTE_PID=$!
wait_for_server "http://localhost:$CSR_REMOTE_PORT/static/mf-manifest.json" "CSR Remote"

# Step 7: Build CSR Host with remote URL
echo "=== Building CSR Host (port $CSR_HOST_PORT) ==="
cd ../rsc-csr-mf-host
BUNDLER=webpack REMOTE_URL="http://localhost:$CSR_REMOTE_PORT" ASSET_PREFIX="http://localhost:$CSR_HOST_PORT" pnpm run build

# Step 8: Start CSR Host server
echo "=== Starting CSR Host Server ==="
PORT=$CSR_HOST_PORT REMOTE_URL="http://localhost:$CSR_REMOTE_PORT" ASSET_PREFIX="http://localhost:$CSR_HOST_PORT" pnpm run serve &
CSR_HOST_PID=$!
wait_for_server "http://localhost:$CSR_HOST_PORT" "CSR Host"

echo ""
echo "=== All servers running ==="
echo "SSR Remote: http://localhost:$SSR_REMOTE_PORT"
echo "SSR Host:   http://localhost:$SSR_HOST_PORT"
echo "CSR Remote: http://localhost:$CSR_REMOTE_PORT"
echo "CSR Host:   http://localhost:$CSR_HOST_PORT"
echo ""

# Step 9: Test the endpoints
echo "=== Testing endpoints ==="
echo "Testing SSR Host..."
curl -s -o /dev/null -w "SSR Host Response: %{http_code}\n" "http://localhost:$SSR_HOST_PORT/server-component-root"

echo "Testing CSR Host..."
curl -s -o /dev/null -w "CSR Host Response: %{http_code}\n" "http://localhost:$CSR_HOST_PORT"

echo ""
echo "Press Enter to stop all servers..."
read

# Cleanup
echo "=== Stopping servers ==="
kill $SSR_REMOTE_PID $SSR_HOST_PID $CSR_REMOTE_PID $CSR_HOST_PID 2>/dev/null
echo "Done!"