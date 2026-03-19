@echo off
echo Pushing to GitHub...
cd /d C:\code2
git add .
git commit -m "BloodLink Pro Update"
git push origin main
echo Done! Check https://sn0863110-creator.github.io/BloodLink-Pro/
pause
