---
'@modern-js/builder': patch
---

perf: only inline the runtime chunk into the HTML when it is 10 kB or smaller, so large apps no longer download the chunk id map with every uncached HTML response
