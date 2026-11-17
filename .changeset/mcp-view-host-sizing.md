---
'@modern-js/mcp-apps': patch
---

Manage view sizing by Host display mode. Fullscreen views use the Host container height and scroll internally, while inline views observe content size. Stop size observers when switching modes or tearing down the view.
