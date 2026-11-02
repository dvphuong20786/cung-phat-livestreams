Add-Type -AssemblyName System.Drawing

function Describe-Cell($bmpPath) {
    $bmp = [System.Drawing.Bitmap]::FromFile($bmpPath)
    # Tinh ty le chieu cao / chieu rong cua vung nonAlpha
    $minY = $bmp.Height; $maxY = 0; $minX = $bmp.Width; $maxX = 0
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        for ($x = 0; $x -lt $bmp.Width; $x++) {
            if ($bmp.GetPixel($x, $y).A -gt 20) {
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
            }
        }
    }
    $h = $maxY - $minY
    $w = $maxX - $minX
    $bmp.Dispose()
    return "H=$h, W=$w, RatioH/W=" + [math]::Round($h/$w, 2)
}

Write-Host "Row 0: " (Describe-Cell "cell_0_0.png")
Write-Host "Row 1: " (Describe-Cell "cell_1_0.png")
Write-Host "Row 2: " (Describe-Cell "cell_2_0.png")

