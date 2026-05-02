#!/bin/bash
# Create AppImage from existing squashfs

SQUASHFS="/home/ori/Documentos/pomodoro-timer/Pomodoro-Timer-0.1.0-x86_64.squashfs"
OUTPUT="/home/ori/Documentos/pomodoro-timer/Pomodoro-Timer-0.1.0-x86_64.AppImage"

# Read the runtime from appimagetool
RUNTIME="/tmp/appimagetool"

# Get offset where squashfs data starts in appimagetool
OFFSET=$(objdump -h /tmp/appimagetool 2>/dev/null | grep -E "elf|$" | head -1 | awk '{print $6}')
echo "Runtime offset: $OFFSET"

cat > "$OUTPUT" << HEADER
#!/bin/sh
# This software is part of the AppImage package project
# 
HEADER

echo "Created header, now embedding squashfs..."

# Simply copy runtime + embed our squashfs at the end
