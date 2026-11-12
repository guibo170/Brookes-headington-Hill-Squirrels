@echo off
REM Helper batch script to run update_images.py using standard python or bundled python
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    python update_images.py
    goto :done
)

if exist "C:\Program Files\LibreOffice\program\python.exe" (
    "C:\Program Files\LibreOffice\program\python.exe" update_images.py
    goto :done
)

echo Python was not found in your standard PATH. Please install Python or add it to PATH.
:done
