---
trigger: always_on
---

the following files are used:
- index.html is the main file.
  - in index.html, there is a info popup section, that is for a very simple and concise documentation of the README.md
- assets/icons folder has some icons for the manifest.
- assets/icons/interface-icons.svg file has svg definitions. 
- ALWAYS use the powershell command Select-String to view svg files.
- kmap-interface.js has the UI logic.
- kmap-solver.js has the K-map logic.
- styles.css has the styles
- /extras/pwa-check.html is a testing page.
- sw.js is the service worker file.
- README.md should be updated when a feature is added, changed, or removed.
- When updating buttons/elements, update all other files that use them.
- ignore /extras folder
