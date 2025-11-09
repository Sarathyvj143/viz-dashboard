# MySQL Reinstallation Instructions

## Step 1: Uninstall MySQL

1. Navigate to: `C:\Users\91807\Documents\project`
2. Right-click `uninstall_mysql.bat`
3. Select **"Run as administrator"**
4. Wait for the uninstall to complete

## Step 2: Download MySQL Installer

**Option A: Manual Download**
1. Go to: https://dev.mysql.com/downloads/installer/
2. Download "MySQL Installer for Windows" (mysql-installer-community-x.x.xx.msi)
3. Choose the larger "mysql-installer-community" version (not the web version)

**Option B: Direct Download Link**
- Use this direct link: https://dev.mysql.com/downloads/file/?id=528360

## Step 3: Install MySQL

1. Run the downloaded MySQL Installer
2. Choose **"Custom"** or **"Server only"** installation type
3. Select **MySQL Server 8.0** (latest version)
4. Click **"Next"** through the installation
5. When prompted for **"Type and Networking"**, use defaults
6. When prompted for **"Authentication Method"**, choose **"Use Strong Password Encryption"**
7. **IMPORTANT**: When asked for root password, enter: `12345678`
8. Confirm password: `12345678`
9. Continue with default settings
10. Click **"Execute"** to install
11. Click **"Finish"** when complete

## Step 4: Verify Installation

After installation, I can test the connection for you with:
```
mysql -u root -p12345678 -e "SELECT VERSION();"
```

## Alternative: Silent Installation (Advanced)

If you want automated installation, you can use:
```batch
mysql-installer-community-x.x.xx.msi /quiet /norestart
```

Then configure via command line (requires manual setup).

---

**Password to use:** `12345678`
**Username:** `root`
