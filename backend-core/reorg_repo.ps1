$repoDir = "d:\TTTN\backend-core\src\main\java\com\tttn\backend_core\repository"
New-Item -ItemType Directory -Force -Path "$repoDir\custom"
New-Item -ItemType Directory -Force -Path "$repoDir\impl"

# Move Custom files
Get-ChildItem -Path $repoDir -Filter "*Custom.java" | Move-Item -Destination "$repoDir\custom"
# Move Impl files
Get-ChildItem -Path $repoDir -Filter "*Impl.java" | Move-Item -Destination "$repoDir\impl"

# Update package for Custom files
Get-ChildItem -Path "$repoDir\custom" -Filter "*.java" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "package com.tttn.backend_core.repository;", "package com.tttn.backend_core.repository.custom;"
    Set-Content $_.FullName -Value $content -NoNewline
}

# Update package and add import for Impl files
Get-ChildItem -Path "$repoDir\impl" -Filter "*.java" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "package com.tttn.backend_core.repository;", "package com.tttn.backend_core.repository.impl;"

    $customName = $_.Name -replace 'Impl.java', 'Custom'
    $content = $content -replace "(package com.tttn.backend_core.repository.impl;)", "`$1`r`n`r`nimport com.tttn.backend_core.repository.custom.$customName;"
    Set-Content $_.FullName -Value $content -NoNewline
}

# Update imports in standard repositories
Get-ChildItem -Path $repoDir -Filter "*.java" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $baseName = $_.BaseName
    $customName = $baseName + "Custom"
    if ($content -match $customName) {
        $content = $content -replace "(package com.tttn.backend_core.repository;)", "`$1`r`n`r`nimport com.tttn.backend_core.repository.custom.$customName;"
        Set-Content $_.FullName -Value $content -NoNewline
    }
}
