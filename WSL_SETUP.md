# WSL Ubuntu Setup Guide

Follow these steps to prepare a fresh WSL Ubuntu environment for running this React application.

## 1. System Preparation
```bash
sudo apt update && sudo apt upgrade -y
```

## 2. Install Node.js using NVM (Recommended)
This avoids version conflicts and permission issues.

```bash
# 1. Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 2. Reload profile
source ~/.bashrc

# 3. Install Node LTS
nvm install --lts
nvm use --lts
```

Check versions:
- `node -v` (Should be v18, v20, or v22+)
- `npm -v`

## 3. Extracting the Project
**Tip:** Always keep your files in the Linux filesystem (e.g., `/home/username/`) rather than the Windows mount (`/mnt/c/`) for 10x faster performance.

```bash
cd ~
mkdir projects
cd projects

# (After moving your project zip to this directory)
sudo apt install unzip
unzip source-code.zip -d aws-quiz-app
cd aws-quiz-app
```

## 4. Launching
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 5. Working with VS Code
Install the **"WSL"** extension in VS Code on Windows. Then, in your WSL terminal, type:
```bash
code .
```
This will link your Windows VS Code directly to the files inside Ubuntu. 
