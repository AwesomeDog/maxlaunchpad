# Reliability, Errors & Diagnostics

## Q: Where are the log files located?

Log files are stored at:

```
~/.config/MaxLaunchpad/logs/maxlaunchpad.log
```

Or corresponding location in `XDG_CONFIG_HOME` if set.

The log file has a maximum size of 5MB and rotates automatically.

## Q: How can I see usage statistics for my shortcuts?

MaxLaunchpad logs every successful program launch. You can analyze these logs to see which shortcuts you use most frequently.

Run this command in your terminal:

```bash
cat ~/.config/MaxLaunchpad/logs/*.log 2>/dev/null | \
  grep "Program launched" | \
  grep -oE '"tabId":"[^"]*","id":"[^"]*","label":"[^"]*"' | \
  sed 's/"tabId":"\([^"]*\)","id":"\([^"]*\)","label":"\([^"]*\)"/\1\t\2\t\3/' | \
  sort | uniq -c | sort -rn | \
  awk 'BEGIN{printf "%-6s %-6s %-4s %s\n", "Count", "TabID", "Key", "Label"; print "--------------------------------------"} {printf "%-6s %-6s %-4s %s\n", $1, $2, $3, $4}'
```

Example output:

```
Count  TabID  Key  Label
--------------------------------------
15     1      Q    Calculator
8      1      W    Edge
5      F      F1   Help
3      2      A    VSCode
```

This scans all log files in the logs directory and shows a summary of how many times each shortcut was triggered, grouped by tab ID, key, and label.

**Note:** The script scans all log files in the logs directory, including rotated ones, so historical data is preserved as long as the files exist.
