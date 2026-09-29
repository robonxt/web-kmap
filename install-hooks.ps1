# Git pre-commit hook installer
# Copies .githooks/pre-commit to .git/hooks/pre-commit
New-Item -ItemType Directory -Force -Path ".git/hooks" | Out-Null
Copy-Item -Path ".githooks/pre-commit" -Destination ".git/hooks/pre-commit" -Force
Write-Host "Pre-commit hook installed successfully."
