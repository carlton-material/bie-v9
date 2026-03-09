#!/bin/bash

echo "=== FINAL AUDIT CHECKS ==="
echo ""
echo "1. Missing min-width/max-width on cards that need it:"
echo "   Checking .st-signal, .st-anomaly-card, .persona-card..."
grep -n "\.st-signal {" signal-terminal.html -A8 | grep -E "min-width|max-width"
echo ""
echo "2. Hardcoded width issues on .st-pill:"
grep -n "\.st-pill {" signal-terminal.html -A10 | grep width
echo ""
echo "3. Card border colors on dark backgrounds:"
echo "   - .st-signal border-left color: varies by layer"
grep "border-left-color" signal-terminal.html | head -5
echo ""
echo "4. Checking for missing border-radius on glass-box tier:"
grep "glass-box-tier {" css/glass-box.css -A4 | grep border-radius
echo ""
echo "5. Onboarding card styling:"
grep "\.onboarding-card {" css/global.css -A8
