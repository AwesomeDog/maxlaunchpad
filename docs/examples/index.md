# Examples

Example configuration files for MaxLaunchpad.

## Profile Examples

- [full-featured.yaml](./full-featured.yaml) — A comprehensive example showcasing all supported features across Windows,
  macOS, and Linux

## Demo Scripts

The `demo-scripts/` folder contains sample scripts for testing different launch scenarios:

| Script     | Description                |
|------------|----------------------------|
| `demo.bat` | Windows batch script       |
| `demo.ps1` | PowerShell script          |
| `demo.sh`  | Shell script (macOS/Linux) |
| `demo.py`  | Python script              |
| `demo.rb`  | Ruby script                |
| `demo.lnk` | Windows shortcut file      |

### Setup

Copy demo scripts to the appropriate location before testing:

**Windows:**

```powershell
mkdir -Force C:\Users\Public\demo-scripts
Copy-Item docs\examples\demo-scripts\* C:\Users\Public\demo-scripts\ -Recurse -Force
```

**macOS/Linux:**

```bash
mkdir -p /tmp/demo-scripts && cp -rf ./docs/examples/demo-scripts/* /tmp/demo-scripts/
```
