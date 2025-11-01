<?php
/**
 * Contact Form Handler for Stone OnePoint Solutions
 * Handles both regular form submissions and AJAX requests
 * Implements security measures, validation, and email functionality
 */

// Start session for CSRF protection
session_start();

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

class ContactFormHandler {
    
    private $config;
    private $errors = [];
    private $rateLimitFile;
    
    public function __construct() {
        $this->config = [
            'max_submissions_per_ip' => 5,
            'rate_limit_window' => 3600, // 1 hour
            'max_message_length' => 1000,
            'min_message_length' => 10,
            'email_to' => 'hr@stoneonepointsolutions.in',
            'email_from' => 'noreply@stoneonepointsolutions.in',
            'email_subject' => 'New Contact Form Submission - Stone OnePoint Solutions',
            'success_redirect' => 'contact-success.html',
            'error_redirect' => 'contact-error.html'
        ];
        
        $this->rateLimitFile = sys_get_temp_dir() . '/contact_form_rate_limit.json';
    }
    
    /**
     * Main handler method
     */
    public function handle() {
        try {
            // Check if this is an AJAX request
            $isAjax = isset($_SERVER['HTTP_X_REQUESTED_WITH']) && 
                     $_SERVER['HTTP_X_REQUESTED_WITH'] === 'XMLHttpRequest';
            
            // Security checks
            if (!$this->validateRequest()) {
                return $this->sendResponse('Invalid request', false, 400, $isAjax);
            }
            
            if (!$this->checkRateLimit()) {
                return $this->sendResponse('Rate limit exceeded. Please try again later.', false, 429, $isAjax);
            }
            
            // Get and validate input
            $input = $this->getInput();
            if (!$this->validateInput($input)) {
                return $this->sendResponse('Validation failed: ' . implode(', ', $this->errors), false, 400, $isAjax);
            }
            
            // Sanitize input
            $sanitizedInput = $this->sanitizeInput($input);
            
            // Send email
            if ($this->sendEmail($sanitizedInput)) {
                $this->logSubmission($sanitizedInput);
                return $this->sendResponse('Thank you! Your message has been sent successfully. We will get back to you soon.', true, 200, $isAjax);
            } else {
                return $this->sendResponse('Failed to send message. Please try again or contact us directly.', false, 500, $isAjax);
            }
            
        } catch (Exception $e) {
            error_log('Contact form error: ' . $e->getMessage());
            return $this->sendResponse('An unexpected error occurred. Please try again.', false, 500, $isAjax ?? false);
        }
    }
    
    /**
     * Validate the request
     */
    private function validateRequest() {
        // Check request method
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            return false;
        }
        
        // Basic security checks
        if (empty($_POST) && empty(file_get_contents('php://input'))) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Check rate limiting
     */
    private function checkRateLimit() {
        $clientIP = $this->getClientIP();
        $now = time();
        
        // Load existing rate limit data
        $rateLimitData = [];
        if (file_exists($this->rateLimitFile)) {
            $content = file_get_contents($this->rateLimitFile);
            $rateLimitData = json_decode($content, true) ?: [];
        }
        
        // Clean old entries
        foreach ($rateLimitData as $ip => $data) {
            if ($now - $data['first_attempt'] > $this->config['rate_limit_window']) {
                unset($rateLimitData[$ip]);
            }
        }
        
        // Check current IP
        if (!isset($rateLimitData[$clientIP])) {
            $rateLimitData[$clientIP] = [
                'count' => 1,
                'first_attempt' => $now
            ];
        } else {
            $rateLimitData[$clientIP]['count']++;
            
            if ($rateLimitData[$clientIP]['count'] > $this->config['max_submissions_per_ip']) {
                return false;
            }
        }
        
        // Save updated rate limit data
        file_put_contents($this->rateLimitFile, json_encode($rateLimitData), LOCK_EX);
        
        return true;
    }
    
    /**
     * Get client IP address
     */
    private function getClientIP() {
        $ipKeys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
        
        foreach ($ipKeys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = $_SERVER[$key];
                // Handle comma-separated IPs (from proxies)
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    /**
     * Get input data from POST or JSON
     */
    private function getInput() {
        // Check if it's JSON input (AJAX)
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (strpos($contentType, 'application/json') !== false) {
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Invalid JSON input');
            }
            
            return $input;
        }
        
        // Regular form submission
        return $_POST;
    }
    
    /**
     * Validate input data
     */
    private function validateInput($input) {
        $this->errors = [];
        
        // Required fields
        $requiredFields = ['name', 'email', 'phone', 'message'];
        foreach ($requiredFields as $field) {
            if (empty($input[$field]) || trim($input[$field]) === '') {
                $this->errors[] = ucfirst($field) . ' is required';
            }
        }
        
        // Name validation
        if (!empty($input['name'])) {
            $name = trim($input['name']);
            if (strlen($name) < 2 || strlen($name) > 50) {
                $this->errors[] = 'Name must be between 2 and 50 characters';
            }
            if (!preg_match('/^[a-zA-Z\s\.\-\']+$/', $name)) {
                $this->errors[] = 'Name contains invalid characters';
            }
        }
        
        // Email validation
        if (!empty($input['email'])) {
            $email = trim($input['email']);
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $this->errors[] = 'Please enter a valid email address';
            }
            if (strlen($email) > 100) {
                $this->errors[] = 'Email address is too long';
            }
        }
        
        // Phone validation
        if (!empty($input['phone'])) {
            $phone = trim($input['phone']);
            // Remove all non-digit characters for validation
            $phoneDigits = preg_replace('/[^0-9]/', '', $phone);
            if (strlen($phoneDigits) < 10 || strlen($phoneDigits) > 15) {
                $this->errors[] = 'Please enter a valid phone number';
            }
        }
        
        // Message validation
        if (!empty($input['message'])) {
            $message = trim($input['message']);
            if (strlen($message) < $this->config['min_message_length']) {
                $this->errors[] = 'Message must be at least ' . $this->config['min_message_length'] . ' characters long';
            }
            if (strlen($message) > $this->config['max_message_length']) {
                $this->errors[] = 'Message is too long (maximum ' . $this->config['max_message_length'] . ' characters)';
            }
        }
        
        return empty($this->errors);
    }
    
    /**
     * Sanitize input data
     */
    private function sanitizeInput($input) {
        $sanitized = [];
        
        foreach ($input as $key => $value) {
            if (is_string($value)) {
                // Basic sanitization
                $value = trim($value);
                $value = stripslashes($value);
                
                // Field-specific sanitization
                switch ($key) {
                    case 'name':
                        $value = preg_replace('/[^a-zA-Z\s\.\-\']/', '', $value);
                        $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
                        break;
                    case 'email':
                        $value = filter_var($value, FILTER_SANITIZE_EMAIL);
                        break;
                    case 'phone':
                        // Keep only numbers, spaces, hyphens, parentheses, and plus sign
                        $value = preg_replace('/[^0-9+\-\s\(\)]/', '', $value);
                        break;
                    case 'message':
                        $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
                        break;
                    default:
                        $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
                }
            }
            
            $sanitized[$key] = $value;
        }
        
        return $sanitized;
    }
    
    /**
     * Send email notification
     */
    private function sendEmail($data) {
        $to = $this->config['email_to'];
        $subject = $this->config['email_subject'];
        
        // Create HTML email body
        $htmlBody = $this->createEmailTemplate($data);
        
        // Create plain text version
        $textBody = "New Contact Form Submission\n\n";
        $textBody .= "Name: " . $data['name'] . "\n";
        $textBody .= "Email: " . $data['email'] . "\n";
        $textBody .= "Phone: " . $data['phone'] . "\n";
        $textBody .= "Message:\n" . $data['message'] . "\n\n";
        $textBody .= "Submitted: " . date('Y-m-d H:i:s') . "\n";
        $textBody .= "IP Address: " . $this->getClientIP() . "\n";
        
        // Email headers for HTML email
        $headers = [
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . $this->config['email_from'],
            'Reply-To: ' . $data['email'],
            'X-Mailer: PHP/' . phpversion(),
            'X-Priority: 3'
        ];
        
        // Send HTML email
        $success = mail($to, $subject, $htmlBody, implode("\r\n", $headers));
        
        // If HTML email fails, try plain text
        if (!$success) {
            $headers = [
                'Content-Type: text/plain; charset=UTF-8',
                'From: ' . $this->config['email_from'],
                'Reply-To: ' . $data['email'],
                'X-Mailer: PHP/' . phpversion()
            ];
            
            $success = mail($to, $subject, $textBody, implode("\r\n", $headers));
        }
        
        return $success;
    }
    
    /**
     * Create HTML email template
     */
    private function createEmailTemplate($data) {
        $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>New Contact Form Submission</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4a90e2; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #555; }
        .value { margin-top: 5px; padding: 10px; background-color: white; border-left: 3px solid #4a90e2; }
        .footer { background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Contact Form Submission</h1>
            <p>Stone OnePoint Solutions Pvt. Ltd.</p>
        </div>
        
        <div class="content">
            <div class="field">
                <div class="label">Name:</div>
                <div class="value">' . htmlspecialchars($data['name']) . '</div>
            </div>
            
            <div class="field">
                <div class="label">Email:</div>
                <div class="value"><a href="mailto:' . htmlspecialchars($data['email']) . '">' . htmlspecialchars($data['email']) . '</a></div>
            </div>
            
            <div class="field">
                <div class="label">Phone:</div>
                <div class="value"><a href="tel:' . htmlspecialchars($data['phone']) . '">' . htmlspecialchars($data['phone']) . '</a></div>
            </div>
            
            <div class="field">
                <div class="label">Message:</div>
                <div class="value">' . nl2br(htmlspecialchars($data['message'])) . '</div>
            </div>
        </div>
        
        <div class="footer">
            <p>Submitted on: ' . date('F j, Y \a\t g:i A') . '</p>
            <p>IP Address: ' . $this->getClientIP() . '</p>
            <p>This email was sent from the contact form on www.stoneonepointsolutions.in</p>
        </div>
    </div>
</body>
</html>';
        
        return $html;
    }
    
    /**
     * Log submission for monitoring
     */
    private function logSubmission($data) {
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'ip' => $this->getClientIP(),
            'email' => $data['email'],
            'name' => $data['name'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
        ];
        
        $logFile = sys_get_temp_dir() . '/contact_form_submissions.log';
        file_put_contents($logFile, json_encode($logEntry) . "\n", FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Send response (JSON for AJAX, redirect for regular form)
     */
    private function sendResponse($message, $success, $code, $isAjax) {
        if ($isAjax) {
            header('Content-Type: application/json');
            http_response_code($code);
            echo json_encode([
                'success' => $success,
                'message' => $message
            ]);
        } else {
            // For regular form submissions, redirect with message in session
            $_SESSION['form_message'] = $message;
            $_SESSION['form_success'] = $success;
            
            if ($success) {
                header('Location: contact-success.html');
            } else {
                header('Location: contact-error.html');
            }
        }
        exit;
    }
}

// Handle the request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $handler = new ContactFormHandler();
    $handler->handle();
} else {
    // Method not allowed
    header('HTTP/1.1 405 Method Not Allowed');
    header('Allow: POST');
    echo 'Method not allowed';
    exit;
}
?>