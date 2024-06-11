#!/bin/sh
# Start the Docker daemon in the background
dockerd &

# Wait until the Docker daemon is ready
until docker info > /dev/null 2>&1; do
  echo "Waiting for Docker to start..."
  sleep 1
done

# Start the Node.js application
exec "$@"
