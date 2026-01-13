# Build stage
FROM node:20 AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set build arguments
ARG DATABASE_URL
ARG DIRECT_URL

# Set environment variables for build time
ENV DATABASE_URL=$DATABASE_URL
ENV DIRECT_URL=$DIRECT_URL

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy prisma directory
COPY prisma ./prisma

# Generate Prisma client
RUN pnpm db:generate

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM public.ecr.aws/lambda/nodejs:20 AS runner

# Set build arguments
ARG DATABASE_URL
ARG DIRECT_URL

# Set environment variables for build/runtime
ENV DATABASE_URL=$DATABASE_URL
ENV DIRECT_URL=$DIRECT_URL

# Lambda uses /var/task as the working directory
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy package files (we use npm here as it's built-in to the AWS image)
COPY package.json pnpm-lock.yaml ./

# Install production dependencies
# Note: Since the base image is Amazon Linux, we use npm to install from the lockfile if possible, 
# or just copy node_modules from a stage that matches the architecture.
# To keep it simple and reliable for Lambda, we'll install pnpm and use it.
RUN npm install -g pnpm@latest
RUN pnpm install --prod --frozen-lockfile

# Copy prisma directory & generate client
COPY prisma ./prisma
RUN pnpm db:generate

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Set the handler for Lambda
CMD ["dist/lambda.handler"]
