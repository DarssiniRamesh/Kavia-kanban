#!/bin/bash
cd /home/kavia/workspace/code-generation/kavia-kanbansync-106823-fd4e91f2/kavia_kanbansync
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

