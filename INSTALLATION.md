# Installing MediaChips

Pre-built installers are published on [GitHub Releases](https://github.com/fupdec/mediaChips/releases/latest).

| Platform | File |
|----------|------|
| macOS | `MediaChips-<version>.dmg` |
| Windows | `MediaChips-<version>-win.exe` (installer) or portable build |
| Linux | `MediaChips-<version>.AppImage` |

To build from source, see [README.md](./README.md).

---

## macOS

### Method 1: Standard installation

1. Download `MediaChips-<version>.dmg` from [Releases](https://github.com/fupdec/mediaChips/releases/latest).
2. Open the DMG file.
3. Drag **MediaChips** to the **Applications** folder.
4. **Right-click** MediaChips in Applications and choose **Open**.
5. Click **Open** in the security dialog.

### Method 2: Terminal (fastest)

After downloading and installing the app:

```bash
sudo xattr -rd com.apple.quarantine /Applications/MediaChips.app
open /Applications/MediaChips.app
```

### Why is the app self-signed?

MediaChips is free and open source. Apple charges a yearly fee for notarized distribution, so community builds are self-signed instead of passing that cost on to users.

### Security

You can verify the application yourself:

- Source code: [github.com/fupdec/mediaChips](https://github.com/fupdec/mediaChips)
- All code is publicly auditable
- No telemetry or data collection

---

## Windows

1. Download the installer or portable build from [Releases](https://github.com/fupdec/mediaChips/releases/latest).
2. Run the installer and follow the setup wizard, **or** extract/run the portable executable.
3. If SmartScreen warns about an unknown publisher, choose **More info** → **Run anyway** (the build is not code-signed with a commercial certificate).

---

## Linux

1. Download the `.AppImage` from [Releases](https://github.com/fupdec/mediaChips/releases/latest).
2. Make it executable:

```bash
chmod +x MediaChips-*.AppImage
./MediaChips-*.AppImage
```

---

## Troubleshooting (macOS)

### "MediaChips is damaged and can't be opened"

```bash
sudo xattr -rd com.apple.quarantine /Applications/MediaChips.app
sudo codesign --force --deep --sign - /Applications/MediaChips.app
```

### App won't open

1. Open **System Settings** → **Privacy & Security**.
2. Scroll to **Security**.
3. Click **Open Anyway** next to MediaChips.

### Still not working

Remove the app and install again:

```bash
sudo rm -rf /Applications/MediaChips.app
```

Then redownload from [GitHub Releases](https://github.com/fupdec/mediaChips/releases/latest) and follow the installation steps above.

---

## Need help?

- [GitHub Issues](https://github.com/fupdec/mediaChips/issues)
- [GitHub Discussions](https://github.com/fupdec/mediaChips/discussions)
- [Discord](https://discord.gg/dEQPper2yu)
- [Reddit](https://reddit.com/r/mediachips/)
