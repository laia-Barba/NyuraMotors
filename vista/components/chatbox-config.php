<?php
// Leer archivo .env
$envFile = __DIR__ . '/../../.env';
$apiKey = '';

if (file_exists($envFile)) {
    $envContent = file_get_contents($envFile);
    $lines = explode("\n", $envContent);
    
    foreach ($lines as $line) {
        $line = trim($line);
        if (strpos($line, 'GROQ_API_KEY=') === 0) {
            $apiKey = substr($line, strlen('GROQ_API_KEY='));
            break;
        }
    }
}

// Devolver como variable JavaScript
header('Content-Type: application/javascript');
echo "window.GROQ_API_KEY = '" . addslashes($apiKey) . "';";
?>
