#!/bin/sh
# Remove existing containers and images to avoid docker-compose 'ContainerConfig' errors
set -e

docker-compose down --volumes --remove-orphans || true
# Remove images built previously with BuildKit missing ContainerConfig
if docker images | grep -q david_server; then
  docker image rm -f $(docker images -q "david_server") || true
fi
if docker images | grep -q david_client; then
  docker image rm -f $(docker images -q "david_client") || true
fi

docker-compose up --build
