# AWS CCP Practice Exam App

An interactive, serverless quiz application built with React, Tailwind CSS, and Framer Motion. 

## 🚀 Quick Start (Local)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run carefully in development mode**:
   ```bash
   npm run dev
   ```
   *Access at: http://localhost:3000*

## 📦 Building for Production

To create the optimized files for AWS hosting:
```bash
npm run build
```
This produces the `dist/` directory.

## ☁️ AWS Deployment

For a professional, cost-effective deployment using **S3 + CloudFront**, please see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

## 📄 Question Format

You can upload custom quiz files in Markdown. The app parses blocks in this format:

```markdown
1. Your question here?
- A. Option A
- B. Option B
- C. Option C
- D. Option D
Correct answer: A
```

## 🛠 Features
- **Markdown Parsing**: Supports standard `.md` and `README.md` formats.
- **Dynamic Upload**: Import your own study materials on the fly.
- **AWS Theme**: Professionally styled with AWS brand colors.
- **Responsive**: Works on desktop and mobile.
