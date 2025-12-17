#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import subprocess
import platform
import time
import os


def show_dialog():
    system = platform.system()
    cwd = os.getcwd()
    message = f"Working directory:\\n{cwd}"

    if system == 'Darwin':
        # macOS: use AppleScript
        script = f'''
tell application "System Events"
    activate
    display dialog "{message}" buttons {{"OK"}} default button "OK" with title "Test Python"
end tell
'''
        subprocess.run(['osascript', '-e', script])

    elif system == 'Linux':
        # Linux: try zenity, kdialog, or xmessage
        try:
            subprocess.run(['zenity', '--info', '--title=Test Python', f'--text={message}'],
                           check=True)
        except FileNotFoundError:
            try:
                subprocess.run(
                    ['kdialog', '--msgbox', message, '--title', 'Test Python'],
                    check=True)
            except FileNotFoundError:
                try:
                    subprocess.run(['xmessage', '-center', message], check=True)
                except FileNotFoundError:
                    print(message)

    elif system == 'Windows':
        # Windows: use PowerShell
        subprocess.run(['powershell', '-Command',
                        'Add-Type -AssemblyName PresentationFramework; '
                        f'[System.Windows.MessageBox]::Show("{message}", "Test Python")'])

    else:
        print(message)


if __name__ == '__main__':
    show_dialog()
    time.sleep(2)
    print("This is a test Python script that does not exit with 0")
    input("Press Enter to exit")
