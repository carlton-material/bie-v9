#!/bin/bash

echo "=== OPACITY AND BACKGROUND CONSISTENCY CHECK ==="
echo ""
echo "Glass box background opacity levels:"
grep "bg-glass\|rgba.*0\." css/tokens.css | head -10
echo ""
echo "Card backgrounds in components.css:"
grep "\.card {" css/components.css -A3
grep "\.alert-card {" css/components.css -A3
echo ""
echo "Signal card backgrounds (signal-terminal.html):"
grep "background: var(--bg-" signal-terminal.html | sort -u | head -10
echo ""
echo "=== OVERFLOW PROTECTION CHECK ==="
echo ""
echo "Text overflow ellipsis on cards:"
grep -n "overflow.*hidden\|text-overflow.*ellipsis" global.css components.css | grep -i card
