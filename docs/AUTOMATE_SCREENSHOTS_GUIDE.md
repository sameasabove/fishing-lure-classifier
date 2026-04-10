# 🤖 Automated Screenshot Generation Guide

## Tools for Automating App Store Screenshots

---

## Option 1: Fastlane (Recommended for iOS) ⭐

**Best for:** Automated screenshot generation using simulators

### Setup:
```bash
# Install Fastlane
sudo gem install fastlane

# Navigate to your iOS folder (if you have one)
cd ios
fastlane init
```

### Create Screenshot Lane:
Create `fastlane/Snapfile`:
```ruby
# Device types to generate screenshots for
devices([
  "iPhone 15 Pro Max",      # 6.7" - 1290 x 2796
  "iPhone 11 Pro Max",      # 6.5" - 1242 x 2688
  "iPhone 8 Plus"           # 5.5" - 1242 x 2208
])

languages([
  "en-US"
])

scheme("FishingLureApp")  # Your app scheme

# Navigate to each screen and take screenshot
clear_previous_screenshots(true)
```

### Create Screenshot Script:
Create `fastlane/ScreenshotHelper.swift`:
```swift
import XCTest

class ScreenshotHelper: XCTestCase {
    func navigateAndScreenshot(_ screenName: String) {
        // Navigate to screen
        // Wait for UI to load
        // Take screenshot
    }
}
```

**Pros:** 
- ✅ Fully automated
- ✅ Works with simulators
- ✅ Can generate all sizes at once
- ✅ Can integrate into CI/CD

**Cons:**
- ❌ Requires iOS native project setup
- ❌ More complex setup

---

## Option 2: Expo Screenshot Tool

**Best for:** Quick screenshot generation from Expo

### Using Expo CLI:
```bash
# Generate screenshots using Expo
npx expo export --platform ios --output-dir screenshots
```

**Note:** This requires your app to be built and runnable in simulator.

---

## Option 3: Third-Party Tools (Easiest) 🎨

### A. Appshot (Free/Open Source)
**Website:** https://www.appshot.sh/

**How it works:**
1. Take screenshots on one device size
2. Upload to Appshot
3. It generates all required sizes automatically
4. Download ready-to-upload screenshots

**Steps:**
1. Take screenshots on your iPhone (any size)
2. Go to https://www.appshot.sh/
3. Upload your screenshots
4. Select device frames
5. Download all sizes

**Pros:**
- ✅ Free and easy
- ✅ No coding required
- ✅ Generates all sizes
- ✅ Adds device frames

### B. Rotato (Paid - $99/year)
**Website:** https://rotato.app/

**Features:**
- Generate full App Store screenshot packages
- Professional device frames
- All sizes automatically
- App preview videos

**Pros:**
- ✅ Very professional results
- ✅ All sizes included
- ✅ Device frames and styling

**Cons:**
- ❌ Paid subscription

### C. App Store Screenshot Generator (Free Online)
**Website:** Various online tools available

**Search for:** "App Store Screenshot Generator"

**How it works:**
1. Upload your screenshot
2. Select device sizes
3. Download resized versions

---

## Option 4: Simple Resize Script (Quick & Dirty)

If you have one set of screenshots, resize them:

### Using ImageMagick:
```bash
# Install ImageMagick
# Windows: https://imagemagick.org/script/download.php#windows
# Mac: brew install imagemagick

# Resize to 6.7" (1290 x 2796)
magick input.png -resize 1290x2796 output_6.7.png

# Resize to 6.5" (1242 x 2688)
magick input.png -resize 1242x2688 output_6.5.png

# Resize to 5.5" (1242 x 2208)
magick input.png -resize 1242x2208 output_5.5.png
```

### Using Python Script:
```python
from PIL import Image
import os

def resize_screenshot(input_path, output_path, width, height):
    img = Image.open(input_path)
    # Resize maintaining aspect ratio, then crop
    img_resized = img.resize((width, height), Image.LANCZOS)
    img_resized.save(output_path)
    print(f"Created: {output_path}")

# Sizes needed
sizes = {
    "6.7": (1290, 2796),
    "6.5": (1242, 2688),
    "5.5": (1242, 2208)
}

# Resize all screenshots
for filename in os.listdir("screenshots"):
    if filename.endswith(".png"):
        for size_name, (width, height) in sizes.items():
            output = f"screenshots/{size_name}/{filename}"
            resize_screenshot(f"screenshots/{filename}", output, width, height)
```

---

## Option 5: Manual but Faster Approach

### Use iOS Simulator:
1. **Open iOS Simulator** (Xcode → Open Developer Tool → Simulator)
2. **Run your app** in the simulator
3. **Change device sizes:**
   - Device → iPhone 15 Pro Max (6.7")
   - Device → iPhone 11 Pro Max (6.5")
   - Device → iPhone 8 Plus (5.5")
4. **Take screenshots:**
   - File → New Screen Recording (or Cmd+S)
   - Or: Device → Screenshot
5. **Save all sizes at once**

### Use Android Emulator:
1. Open Android Studio Emulator
2. Run your app
3. Change device sizes
4. Take screenshots (Extended Controls → Screenshot)

---

## Recommended Workflow

### For Quick Results (Easiest):
1. **Take screenshots** on one device (your iPhone)
2. **Use Appshot** (https://www.appshot.sh/) to generate all sizes
3. **Download and upload** to App Store Connect

### For Professional Results:
1. **Use Rotato** to create professional screenshots with frames
2. **Generate all sizes** automatically
3. **Upload to stores**

### For Automation:
1. **Set up Fastlane** if you have iOS native project
2. **Automate** screenshot generation in CI/CD
3. **Auto-upload** to App Store Connect

---

## Quick Start (Recommended)

### Step 1: Take Screenshots
- Take screenshots on your iPhone (one size is fine)
- Navigate through all key screens:
  1. Home screen
  2. Camera/scan
  3. Analysis results
  4. Tackle box
  5. Catch tracking
  6. Settings

### Step 2: Generate All Sizes
- Go to: https://www.appshot.sh/
- Upload your screenshots
- Select device frames (optional)
- Download all sizes

### Step 3: Upload to App Store Connect
- Go to App Store Connect
- Upload each size to corresponding device section

---

## Tools Comparison

| Tool | Cost | Ease | Automation | Quality |
|------|------|------|------------|---------|
| **Appshot** | Free | ⭐⭐⭐⭐⭐ | Manual | ⭐⭐⭐⭐ |
| **Rotato** | $99/year | ⭐⭐⭐⭐ | Manual | ⭐⭐⭐⭐⭐ |
| **Fastlane** | Free | ⭐⭐ | Full | ⭐⭐⭐⭐ |
| **Manual Resize** | Free | ⭐⭐⭐ | Manual | ⭐⭐⭐ |

---

## Next Steps

**Quickest:** Use Appshot (free, no setup)
1. Take screenshots on your device
2. Upload to appshot.sh
3. Download all sizes
4. Upload to App Store Connect

**Professional:** Use Rotato (paid, best quality)
1. Sign up for Rotato
2. Create screenshot package
3. Download all sizes
4. Upload to stores

**Automated:** Set up Fastlane (free, but complex)
1. Install Fastlane
2. Configure screenshot lanes
3. Run automation
4. Auto-upload

---

**Recommendation:** Start with **Appshot** (free and easy), then consider Rotato if you want more professional results later.



