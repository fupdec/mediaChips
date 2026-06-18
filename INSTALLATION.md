# 🍎 Installing MediaChips on macOS

## 📦 Method 1: Easy Installation

1. **Download** `MediaChips-0.13.0.dmg`
2. **Open** the DMG file
3. **Drag** MediaChips to Applications folder
4. **Right-click** MediaChips in Applications
5. Select **"Open"**
6. Click **"Open"** in the security dialog

## ⚡ Method 2: Terminal (Quickest)

```bash
# After downloading and mounting the DMG
sudo xattr -rd com.apple.quarantine /Applications/MediaChips.app

# Then open normally
open /Applications/MediaChips.app
```
❓ Why self-signed?
MediaChips is 100% open source and free. Apple requires a $99/year developer fee for official signing. Instead of charging users, we use self-signing.

🔒 Security Note
You can verify the source code:

GitHub: https://github.com/mediachips/mediachips

All code is publicly auditable

No telemetry or data collection

🛠 Troubleshooting
"MediaChips is damaged"
bash
```
sudo xattr -rd com.apple.quarantine /Applications/MediaChips.app
sudo codesign --force --deep --sign - /Applications/MediaChips.app
```
Won't open
Go to System Settings → Privacy & Security

Scroll down to "Security"

Click "Open Anyway" next to MediaChips

Still having issues?
Completely remove:

bash
```
sudo rm -rf /Applications/MediaChips.app
```
Redownload from GitHub Releases

Follow Method 1 above

📞 Need Help?
GitHub Issues: https://github.com/mediachips/mediachips/issues

Discussions: https://github.com/mediachips/mediachips/discussions

text

### 9. **Финальный скрипт для релиза**

**scripts/release.sh:**
```bash
#!/bin/bash
# Полный релиз MediaChips

echo "🚀 Starting MediaChips release process..."
echo "=========================================="

# 1. Обновляем версию
read -p "Version [current: $(node -p "require('./package.json').version")]: " version
if [ ! -z "$version" ]; then
    npm version "$version" --no-git-tag-version
fi

# 2. Создаем сертификат
echo ""
echo "🔐 Step 1: Creating certificate..."
bash scripts/create-cert.sh

# 3. Собираем приложение
echo ""
echo "🔨 Step 2: Building application..."
npm run build

# 4. Подписываем
echo ""
echo "📝 Step 3: Signing application..."
bash scripts/sign-app.sh

# 5. Создаем DMG
echo ""
echo "📦 Step 4: Creating DMG..."
bash scripts/build-dmg.sh

# 6. Проверяем
echo ""
echo "🔍 Step 5: Verification..."
codesign -dv --verbose=4 "dist/MediaChips-$(node -p "require('./package.json').version").dmg"

echo ""
echo "=========================================="
echo "🎉 Release complete!"
echo ""
echo "📁 Files created in dist/:"
ls -lh dist/
echo ""
echo "📢 Next steps:"
echo "1. Upload DMG to GitHub Releases"
echo "2. Update INSTALLATION.md if needed"
echo "3. Share with your users!"