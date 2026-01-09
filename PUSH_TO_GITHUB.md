
# GitHub Push Instructions for Wisconsin Hail Tracker

## After Creating Repository on GitHub.com:

### 1. Navigate to your project directory:
```powershell
cd wisconsin-hail-tracker
```

### 2. Add the remote repository (replace YOUR_USERNAME with your GitHub username):
```powershell
git remote add origin https://github.com/YOUR_USERNAME/wisconsin-hail-tracker.git
```

### 3. Verify the remote was added:
```powershell
git remote -v
```

### 4. Push to main branch:
```powershell
git branch -M main
git push -u origin main
```

## Alternative: Push with SSH (if you have SSH keys set up):
```powershell
git remote add origin git@github.com:YOUR_USERNAME/wisconsin-hail-tracker.git
git branch -M main
git push -u origin main
```

## What Gets Pushed:
- 30+ files (backend + frontend)
- Complete CRM with lead management
- Skip tracing functionality
- GoHighLevel integration
- Brutalist design system
- All documentation

## After Successful Push:
Your repository will be available at:
https://github.com/YOUR_USERNAME/wisconsin-hail-tracker
