#!/bin/bash

echo "=== BORDER-RADIUS CONSISTENCY CHECK ==="
echo ""
echo "Glass Box panel border-radius:"
grep "glass-box-panel" css/glass-box.css -A3 | grep border-radius
echo ""
echo "Card border-radius (base):"
grep "^\.card {" css/components.css -A5 | grep border-radius
echo ""
echo "Alert card border-radius:"
grep "^\.alert-card {" css/components.css -A5 | grep border-radius
echo ""
echo "Signal Terminal anomaly card border-radius:"
grep "\.st-anomaly-card {" signal-terminal.html -A5 | grep border-radius
echo ""
echo "Signal Terminal signal card border-radius:"
grep "\.st-signal {" signal-terminal.html -A5 | grep border-radius
echo ""
echo "Day in Life persona card border-radius:"
grep "\.persona-card {" day-in-the-life.html -A5 | grep border-radius
echo ""
echo "Command Center composite border-radius:"
grep "\.cc-composite {" command-center.html -A5 | grep border-radius
echo ""
echo "Command Center panel border-radius:"
grep "\.cc-panel {" command-center.html -A5 | grep border-radius
