# 🚨 Errors and Echoes

**Privacy-first anonymous error reporting for FoundryVTT modules**

[![Support on Patreon](https://img.shields.io/badge/Patreon-Support%20Development-ff424d?style=flat-square&logo=patreon)](https://patreon.com/rayners)

Help module authors identify and fix bugs faster with intelligent error reporting that respects your privacy.

---

## 🌟 What is Errors and Echoes?

Errors and Echoes is a privacy-focused error reporting module that helps Foundry VTT module authors identify and fix bugs faster. When enabled, it anonymously reports JavaScript errors to module authors, providing valuable debugging information while protecting your privacy.

**Key Features:**

- ✅ **Anonymous by design** - No personally identifiable information is ever collected
- ✅ **User-controlled privacy levels** - You choose what information to share
- ✅ **Transparent reporting** - See exactly what data would be sent
- ✅ **Author-specific endpoints** - Errors only go to the relevant module authors
- ✅ **Easy opt-out** - Disable at any time with one click

---

## 🔒 Privacy and Data Collection

**Your privacy is our top priority.** Here's exactly what we collect and what we don't:

### Privacy Levels

You control what information is included in error reports through three privacy levels:

#### 🔒 Minimal Level

- ✅ Error message and stack trace
- ✅ Error type (TypeError, ReferenceError, etc.)
- ✅ Timestamp when error occurred

#### 🔒 Standard Level (Recommended)

- ✅ Everything from Minimal level
- ✅ Foundry VTT version number
- ✅ Game system name and version
- ✅ List of active modules (names and versions only)
- ✅ Anonymous session ID (rotates daily)

#### 🔒 Detailed Level

- ✅ Everything from Standard level
- ✅ Browser name and version (e.g., "Chrome/120")
- ✅ Current scene name (if applicable)
- ✅ Enhanced error context (filename, line number)

### What is NEVER Collected

**We guarantee that the following information is never collected:**

- ❌ Your IP address or location
- ❌ World data, actors, items, or scene content
- ❌ Chat messages or journal entries
- ❌ Module settings or configurations
- ❌ User accounts or login information
- ❌ Any personally identifiable information

### How Data is Used

Error reports are used exclusively to:

- ✅ Help module authors identify and fix bugs
- ✅ Improve overall module quality and stability
- ✅ Provide context for debugging complex issues

**Data is never used for:**

- ❌ User tracking or profiling
- ❌ Marketing or advertising
- ❌ Data selling or sharing with third parties
- ❌ Individual user identification

---

## 📦 Installation

1. **Install via Foundry VTT:**

   - Open the Add-on Modules tab in your Foundry setup
   - Click "Install Module"
   - Search for "Errors and Echoes"
   - Click Install

2. **Enable the Module:**

   - In your world, go to Settings → Manage Modules
   - Enable "Errors and Echoes"
   - Save Module Settings

3. **Configure Privacy Settings:**
   - The module will show a welcome dialog on first run
   - Choose your preferred privacy level
   - Review the privacy details before enabling

---

## ⚙️ Configuration

### Initial Setup

When you first enable the module, you'll see a welcome dialog that explains:

- What information is collected at each privacy level
- How your data is used and protected
- Your rights and controls

**You must actively consent** before any error reporting begins.

### Privacy Settings

Access privacy settings through **Settings → Module Settings → Errors and Echoes**:

- **Enable Error Reporting:** Master on/off switch
- **Privacy Level:** Choose Minimal, Standard, or Detailed
- **Configure Endpoints:** Advanced settings for author endpoints

### Endpoint Configuration

**Advanced users only:** Configure which module authors receive error reports.

1. Go to **Settings → Module Settings → Errors and Echoes**
2. Click **"Configure Endpoints"**
3. Review or modify author endpoints
4. Test connections before saving

**Default Configuration:**

- Pre-configured to report errors from Rayners' modules to `https://errors.rayners.dev`
- Only errors from modules by that author are sent to their endpoint
- You can add, remove, or disable any endpoint

---

## 📊 Privacy Levels Explained

### When to Use Each Level

**Minimal Level** - Choose if you:

- Want maximum privacy
- Are concerned about information sharing
- Only want to help with basic error identification

**Standard Level** - Choose if you:

- Want to help authors fix bugs effectively (recommended)
- Are comfortable sharing technical system information
- Want to balance privacy with usefulness

**Detailed Level** - Choose if you:

- Want to provide maximum debugging help
- Are comfortable with additional browser context
- Help test beta versions or complex modules

### Example Reports

#### Minimal Level Report

```json
{
  "error": "Cannot read property 'update' of undefined",
  "stack": "TypeError: Cannot read property...",
  "type": "TypeError",
  "timestamp": "2024-12-06T15:30:00.000Z"
}
```

#### Standard Level Report

```json
{
  "error": "Cannot read property 'update' of undefined",
  "stack": "TypeError: Cannot read property...",
  "type": "TypeError",
  "timestamp": "2024-12-06T15:30:00.000Z",
  "foundry": {
    "version": "12.331"
  },
  "system": {
    "id": "dnd5e",
    "version": "3.3.1"
  },
  "modules": ["module-a@1.0.0", "module-b@2.1.3"],
  "sessionId": "anon_20241206"
}
```

---

## 💡 Real Example: How Error Reporting Helps

### **What You Might Experience**

You're running a D&D 5e game with the "Combat Helper" module. During combat, you click the "Apply Poison" button on a player's token, but instead of the poison effect appearing, you see an error message in the console:

```
Error: You do not have permission to create ActiveEffect
```

The button doesn't work, the effect isn't applied, and you're not sure why.

### **How Errors & Echoes Helps (If Enabled)**

**What Happens Automatically:**
1. The error is captured and analyzed
2. The system identifies it came from the "Combat Helper" module
3. Anonymous technical details are sent to the module author
4. **You still see the same error** - nothing is hidden from you

**What The Module Author Receives:**
- **Error Message**: "Permission denied for ActiveEffect creation"
- **When It Happened**: During combat, when clicking "Apply Poison"
- **Your Setup**: D&D 5e system, which other modules are active
- **Your Role**: You're a player (not GM), which explains the permission issue

**What Gets Fixed:**
The author realizes players can't create effects directly and releases an update that:
- Asks the GM to apply the effect instead
- Shows a helpful message: "Permission needed - asking GM to apply poison effect"
- Prevents the error from happening again

### **Your Privacy Protection**

**❌ NOT Included in the report:**
- Your username or any personal information
- The name of your game world or characters
- Chat messages or story content
- Your IP address or location
- Campaign-specific details

**✅ Only Technical Information:**
- The specific error that occurred
- Which module caused it
- Your system setup (D&D 5e, module versions)
- When it happened (for debugging patterns)

### **The Result**

- **Faster Fixes**: The author knows exactly what went wrong
- **Better Experience**: Future players won't hit the same bug
- **No Privacy Risk**: Your game content stays private
- **Community Benefit**: Everyone benefits from improved modules

This is why many users choose to enable error reporting - it creates a feedback loop that makes the entire Foundry ecosystem more stable and reliable.

**🔍 Want More Technical Details?** See the [complete technical documentation](https://github.com/rayners/fvtt-errors-and-echoes/blob/main/README.md) for developers, including exact data payloads and integration examples.

---

## 🧪 Testing and Verification

### Verify Your Privacy Settings

1. **Check Current Settings:**

   - Go to Settings → Module Settings → Errors and Echoes
   - Verify your privacy level is correct
   - Confirm error reporting is enabled only if desired

2. **Test Error Reporting:**

   - In the Configure Endpoints dialog, use the "Test" button
   - This sends a test report using your current privacy settings
   - Verify the test succeeds only if you want it to

3. **Review Data Being Sent:**
   - The privacy details dialog shows example reports
   - Click "Refresh Example" to see current data
   - Confirms exactly what would be included in reports

### Connection Testing

The module includes built-in endpoint testing:

- **Green checkmark:** Endpoint is working correctly
- **Red X:** Connection failed or endpoint unavailable
- **Testing...:** Connection test in progress

---

## 🔧 Troubleshooting

### Error Reporting Not Working

**Check these settings:**

1. Module is enabled in Manage Modules
2. "Enable Error Reporting" is checked in module settings
3. At least one endpoint is configured and enabled
4. Your network allows HTTPS connections to configured endpoints

### Privacy Concerns

**If you're unsure about privacy:**

1. Start with "Minimal" privacy level
2. Review the Privacy Details dialog carefully
3. Test with a single trusted endpoint first
4. Remember you can disable or change settings anytime

### Module Conflicts

**If experiencing issues:**

1. Check browser console for error messages
2. Temporarily disable other modules to isolate conflicts
3. Test with a fresh world to rule out world-specific issues
4. Report compatibility issues on GitHub

### Endpoint Connection Problems

**If endpoint tests fail:**

1. Verify the endpoint URL is correct and starts with `https://`
2. Check that the endpoint service is online
3. Ensure your network/firewall allows HTTPS connections
4. Try testing at a different time (may be temporary outage)

---

## 🛡️ Your Rights and Controls

### Complete Control Over Your Data

- **Opt-out anytime:** Disable error reporting with one click
- **Change privacy levels:** Adjust what information is shared
- **Selective reporting:** Enable/disable specific author endpoints
- **Transparent reporting:** See exactly what data would be sent

### Data Retention and Deletion

- **Automatic rotation:** Session IDs change daily
- **No permanent storage:** Error reports are processed, not stored long-term
- **Anonymous by design:** No way to link reports back to individual users
- **Author responsibility:** Each endpoint author manages their own data retention

### Contact Information

For privacy-related questions or concerns:

- **General Issues:** [GitHub Issues](https://github.com/rayners/fvtt-errors-and-echoes/issues)
- **Privacy Concerns:** privacy@rayners.dev
- **Security Issues:** security@rayners.dev

---

## 💖 Supporting Module Development

By enabling error reporting, you're helping:

- **Faster bug fixes:** Authors get detailed error information immediately
- **Better module quality:** Issues are identified before affecting all users
- **Improved compatibility:** Cross-module conflicts are easier to debug
- **Community growth:** Better modules attract more developers and users

### For Module Authors

If you're a module author interested in receiving error reports:

- Review the [Developer Documentation](README.md)
- Set up a compatible error reporting endpoint
- Follow privacy best practices for handling user data
- Consider contributing to the project

---

## 📞 Support

### Getting Help

- **Documentation:** [Complete Documentation](https://docs.rayners.dev/errors-and-echoes)
- **Issues:** [GitHub Issues](https://github.com/rayners/fvtt-errors-and-echoes/issues)
- **Discord:** Find @rayners78 in the Foundry VTT Discord

### Frequently Asked Questions

**Q: Is my personal information collected?**
A: No. The module is designed to never collect personally identifiable information.

**Q: Can I see what data would be sent before enabling?**
A: Yes. The Privacy Details dialog shows example reports for your current settings.

**Q: Can I enable reporting for some modules but not others?**
A: Yes. You can configure which author endpoints are enabled in the advanced settings.

**Q: What happens if I change my mind?**
A: You can disable error reporting or change privacy levels at any time in module settings.

**Q: Do I need to configure anything to help module authors?**
A: No. The default configuration works for most users. Just enable reporting and choose your privacy level.

---

**Last Updated:** June 2025  
**Module Version:** 0.1.2  
**Foundry Compatibility:** v12, v13+
