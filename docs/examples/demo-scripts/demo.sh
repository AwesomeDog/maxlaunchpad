#!/bin/bash
# Cross-platform notification test script

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS: use osascript to show notification
    osascript -e 'display notification "Shell script executed successfully!" with title "Run Test"'
else
    # Linux: try notify-send first, fallback to zenity
    if command -v notify-send &> /dev/null; then
        notify-send "Run Test" "Shell script executed successfully!"
    elif command -v zenity &> /dev/null; then
        zenity --info --text="Shell script executed successfully!" --title="Run Test" &
    else
        echo "Shell script executed successfully!"
    fi
fi
