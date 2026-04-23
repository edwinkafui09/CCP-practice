# AWS Deployment Guide: S3 + CloudFront (SPA)

This guide outlines the "Professional & Cost-Effective" way to host this AWS Practice Exam app on AWS. This architecture is serverless, highly available, and usually falls within the AWS Free Tier.

---

## 🚀 Option A: The "Pro" Way (Automated with Terraform)
This is the fastest and most secure method. It uses the `main.tf` file included in this project to build your infrastructure in seconds.

### 1. Prerequisites
- [Install Terraform](https://developer.hashicorp.com/terraform/downloads) on your computer.
- [Install AWS CLI](https://aws.amazon.com/cli/) and run `aws configure` to set up your credentials.

### 2. Deployment Steps
1. Download this project and extract the ZIP.
2. In your terminal, navigate to the project directory.
3. **Initialize & Deploy Infrastructure**:
   ```bash
   terraform init
   terraform apply
   ```
   *Type `yes` when prompted.*
4. **Build the App**:
   ```bash
   npm install
   npm run build
   ```
5. **Upload to S3**:
   The `terraform apply` command will output your **S3 Bucket Name**.
   ```bash
   aws s3 sync dist/ s3://YOUR_BUCKET_NAME_HERE --delete
   ```
6. **Access Your App**:
   The terminal will output your **CloudFront URL** (e.g. `d123.cloudfront.net`). Open it to start!

---

## 🛠 Option B: The Manual Way (Console)
If you prefer clicking through the AWS Console, follow these steps:

### 1. Prepare the Build
Run `npm run build` locally to generate the `dist/` folder.

### 2. Step 1: Create the Amazon S3 Bucket
1. Go to **S3** > **Create bucket**.
2. **Bucket name**: Unique name (e.g., `my-aws-quiz-2026`).
3. **Block Public Access**: Keep **"Block all public access"** checked (Safety First).
4. Click **Create bucket**.

### 3. Step 2: Create the CloudFront Distribution
1. Go to **CloudFront** > **Create distribution**.
2. **Origin domain**: Select your S3 bucket.
3. **Origin access**: Select **Origin access control settings (recommended)**.
   - Click **Create control setting** > Create.
4. **Viewer protocol policy**: **Redirect HTTP to HTTPS**.
5. **Default root object**: `index.html`.
6. Click **Create distribution**.

**CRITICAL**: Go to S3 > Permissions > Bucket Policy and paste the policy CloudFront generates for you (look for the yellow banner in CloudFront).

### 4. Step 3: Handle SPA Routes (Error Pages)
In your CloudFront distribution:
1. Go to **Error pages** > **Create custom error response**.
2. Error code: **403** (and 404).
3. Customize response: **Yes**.
4. Path: `/index.html`.
5. Status code: **200**.

### 5. Step 4: Upload Files
Upload the *contents* of your `dist/` folder to your S3 bucket.

---

## 💰 Cost Analysis (Free Tier)
- **S3**: 5GB free for 12 months.
- **CloudFront**: 1TB free data transfer out per month, **forever**.
- **Result**: For one person, your monthly bill will likely be **$0.00**.
