# To Run on Docker

docker compose -f docker-compose.dev.yml up --build

# Roadmap

# Find and kill on ports

% lsof -i :3000
kill -9 $(lsof -t -i:3000)

# NGINX

sudo brew services start nginx
sudo brew services start nginx-ui
sudo brew services stop nginx
sudo brew services stop nginx-ui

# PM2 install

app.pm2.io
pm2 link qilc0fxdc0gipun 4o561qhy9dhit55
pm2 start dist/index.js --name node-api
pm2 save

# PM2 Restart

git pull
pnpm install
pnpm run build
pm2 restart node-api

pm2 list
pm2 describe node-api

# Cloudflare

brew install cloudflared
Create Tunner through Network

# Github Runner

# Problems

n + 1 problem
db: push
idel timeout
login tabindex
.

# Workflow Docker Permission

nano ~/.docker/config.json

# K8s

## To Start

### 1. Delete the cluster that is missing the Postgres door

kind delete cluster

### 2. Create the new one with the updated config

kind create cluster --config k8s/kind-config.yaml

### 3. Re-install the Ingress Guard (Nginx)

kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

kubectl apply -f k8s/foundation.yaml
kubectl create secret generic cosmos-secrets --from-env-file=.env.prod -n cosmos-app
kubectl apply -f k8s/

## To Delete

kubectl delete -f k8s/

# To See Status of Pods

kubectl get pods -n cosmos-app

kind create cluster --config k8s/kind-config.yaml
kind delete cluster
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

kubectl wait --namespace ingress-nginx \
 --for=condition=ready pod \
 --selector=app.kubernetes.io/component=controller \
 --timeout=90s
