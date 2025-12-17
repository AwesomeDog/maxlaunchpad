#!/usr/bin/env ruby
# -*- coding: utf-8 -*-

require 'rbconfig'

def show_dialog
  system = RbConfig::CONFIG['host_os']

  case system
  when /darwin/i
    # macOS: use AppleScript
    script = <<~APPLESCRIPT
      tell application "System Events"
        activate
        display dialog "Ruby script launched successfully!" buttons {"OK"} default button "OK" with title "Test Ruby"
      end tell
    APPLESCRIPT
    system('osascript', '-e', script)

  when /linux/i
    # Linux: try zenity, kdialog, or xmessage
    if system('which zenity > /dev/null 2>&1')
      system('zenity', '--info', '--title=Test Ruby', '--text=Ruby script launched successfully!')
    elsif system('which kdialog > /dev/null 2>&1')
      system('kdialog', '--msgbox', 'Ruby script launched successfully!', '--title', 'Test Ruby')
    elsif system('which xmessage > /dev/null 2>&1')
      system('xmessage', '-center', 'Ruby script launched successfully!')
    else
      puts "Ruby script launched successfully!"
    end

  when /mswin|mingw|cygwin/i
    # Windows: use PowerShell
    system('powershell', '-Command',
           'Add-Type -AssemblyName PresentationFramework; ' \
           '[System.Windows.MessageBox]::Show("Ruby script launched successfully!", "Test Ruby")')

  else
    puts "Ruby script launched successfully!"
  end
end

show_dialog
sleep(2)
puts "This is a test Ruby script that does not exit with 0"
puts "Press Enter to exit"
gets
