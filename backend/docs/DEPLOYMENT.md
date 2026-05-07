# Backend Deployment Guide

This document outlines the steps required to build and deploy the v-noted backend infrastructure using AWS SAM (Serverless Application Model).

## Prerequisites

Before proceeding, ensure you have the following tools installed and configured:

1.  **Node.js (v20.x or later)**: Required for building the Lambda functions.
2.  **AWS CLI**: Configured with appropriate credentials and region.
3.  **AWS SAM CLI**: Required for building and deploying the serverless stack.
4.  **npm**: Package manager for installing dependencies and running scripts.

## Project Structure

The backend is organized into modular functions and shared libraries:

- `backend/functions/`: Individual Lambda function handlers (Auth, Notes, Reports).
- `backend/lib/`: Shared services and utilities (Database, Auth, Export).
- `backend/template.yaml`: AWS SAM template defining the infrastructure.

## Deployment Process

### 1. Install Dependencies
Navigate to the backend directory and install the necessary npm packages:
```bash
cd backend
npm install
```

### 2. Build the Bundles
The project uses a bundled approach for Lambda functions. Each function must be bundled into the `dist/` directory before deployment. Use the provided build script or manual bundling for new functions:

```bash
# General TypeScript compilation
npm run build

# Manual bundling for the Reports function (example)
npx esbuild functions/reports/handler.ts --bundle --platform=node --target=node20 --outfile=dist/reports-bundle/index.js --external:@aws-sdk/*
```

### 3. Build the SAM Artifacts
Use the SAM CLI to prepare the deployment artifacts:
```bash
sam build
```

### 4. Deploy to AWS
Execute the deployment using the SAM CLI. For existing stacks, use the `--stack-name` and `--region` flags:

```bash
sam deploy --stack-name v-noted --region ap-south-1 --capabilities CAPABILITY_IAM --resolve-s3 --no-confirm-changeset
```

Note: If this is a first-time deployment, you may use `sam deploy --guided` to configure your environment.

## Environment Variables

The following parameters are required by the stack:

- `JwtSecret`: Secret key for signing and verifying JSON Web Tokens.
- `GoogleClientId`: Client ID for Google OAuth integration.

These should be provided as parameter overrides during deployment or configured in the AWS CloudFormation console.

## CORS Configuration

Cross-Origin Resource Sharing (CORS) is managed both at the API Gateway level (via `template.yaml`) and within the Lambda handlers. Ensure that any new endpoints include the `Access-Control-Allow-Origin` and `Access-Control-Allow-Headers` in their responses to support frontend integration.

## Troubleshooting

- **CORS Errors**: Verify that the `OPTIONS` method is allowed for the endpoint and that the Lambda is returning the correct headers.
- **Dependency Issues**: Ensure that all required libraries (e.g., `pdfkit`, `docx`) are included in the bundle and marked as external where appropriate (e.g., `@aws-sdk`).
- **S3 Upload Failures**: Use the `--resolve-s3` flag if no deployment bucket is explicitly configured.
