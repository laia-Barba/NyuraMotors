Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

Add-Type -Name System.Windows.Forms
Add-Type -AssemblyName System.Drawing

[System.Windows.Forms.Application]::ScreenCapture()
$screen = [System.Windows.Forms.ScreenCapture]::PrimaryScreen
$bitmap = New-Object System.Drawing.Bitmap($screen.Bounds.Width, $screen.Bounds.Height)
$bitmap.Save('c:\Users\e.luaces\Desktop\NyuraMotors\vista\configurador_antes.png', [System.Drawing.Imaging.ImageFormat]::Png)

Write-Host "Captura guardada como configurador_antes.png"
