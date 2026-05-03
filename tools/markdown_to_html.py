from __future__ import annotations

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "report.md"
TARGET = ROOT / "report.html"

lines = SOURCE.read_text(encoding="utf-8").splitlines()

html_lines: list[str] = []

in_ul = False
in_ol = False

heading_re = re.compile(r"^(#+)\s+(.*)$")
ol_re = re.compile(r"^(\d+)\)\s+(.*)$")


def close_lists() -> None:
    global in_ul, in_ol
    if in_ul:
        html_lines.append("</ul>")
        in_ul = False
    if in_ol:
        html_lines.append("</ol>")
        in_ol = False


for raw in lines:
    line = raw.rstrip()
    if not line:
        close_lists()
        continue

    heading_match = heading_re.match(line)
    if heading_match:
        close_lists()
        level = len(heading_match.group(1))
        text = heading_match.group(2)
        html_lines.append(f"<h{level}>{text}</h{level}>")
        continue

    if line.startswith("- "):
        if in_ol:
            html_lines.append("</ol>")
            in_ol = False
        if not in_ul:
            html_lines.append("<ul>")
            in_ul = True
        html_lines.append(f"<li>{line[2:]}</li>")
        continue

    ol_match = ol_re.match(line)
    if ol_match:
        if in_ul:
            html_lines.append("</ul>")
            in_ul = False
        if not in_ol:
            html_lines.append("<ol>")
            in_ol = True
        html_lines.append(f"<li>{ol_match.group(2)}</li>")
        continue

    close_lists()
    html_lines.append(f"<p>{line}</p>")

close_lists()

html_doc = """
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Project Report</title>
    <style>
      body { font-family: "Times New Roman", serif; line-height: 1.5; padding: 32px; color: #111; }
      h1, h2, h3 { margin: 18px 0 8px; }
      p, li { font-size: 14px; }
      ul, ol { margin: 6px 0 12px 24px; }
    </style>
  </head>
  <body>
"""

html_doc += "\n".join(html_lines)
html_doc += "\n  </body>\n</html>\n"

TARGET.write_text(html_doc, encoding="utf-8")
print(f"Wrote {TARGET}")
