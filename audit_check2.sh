#!/bin/bash

echo "=== HOVER STATE CHECK ==="
echo ""
echo "Signal card (.st-signal) hover state:"
grep -A12 "\.st-signal {" signal-terminal.html | grep -A3 "st-signal:hover"
echo ""
echo "Anomaly card (.st-anomaly-card) hover state:"
grep "\.st-anomaly-card:hover" signal-terminal.html && echo "FOUND" || echo "MISSING"
echo ""
echo "Persona card (.persona-card) hover state:"
grep "\.persona-card:hover" day-in-the-life.html && echo "FOUND" || echo "MISSING"
echo ""
echo "Panel (.cc-panel) hover state:"
grep "\.cc-panel:hover" command-center.html -A2
echo ""
echo "Base card (.card) hover state:"
grep "\.card:hover" css/components.css -A2
