# 1. Use a lightweight Node 20 image
FROM node:20-slim

# 2. Install pnpm using Corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# 3. Set the working directory
WORKDIR /app

# 4. Set Production Environment early
ENV NODE_ENV=production

# 5. Copy package files first for better caching
# 
COPY package.json pnpm-lock.yaml ./

# 6. Install dependencies (Frozen lockfile ensures exact versions)
RUN pnpm install --frozen-lockfile

# 7. Copy your source code
# Note: .dockerignore will keep node_modules and .env out of here
COPY . .

# 8. Build the project
RUN pnpm run build

# 9. Expose the internal port
EXPOSE 3000

# 10. Start the app
# Use the compiled version in the dist folder
CMD ["node", "dist/index.js"]