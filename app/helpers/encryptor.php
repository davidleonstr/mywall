<?php

class Encryptor {
    private static $cipher = 'aes-256-cbc';

    public static function encrypt(string $text, string $key) {
        $secureKey = hash('sha256', $key, true);

        $ivLength = openssl_cipher_iv_length(self::$cipher);
        $iv = openssl_random_pseudo_bytes($ivLength);

        $encryptedText = openssl_encrypt($text, self::$cipher, $secureKey, OPENSSL_RAW_DATA, $iv);

        return base64_encode($iv . $encryptedText);
    }

    public static function decrypt(string $base64CipherText, string $key) {
        $data = base64_decode($base64CipherText);
        
        $ivLength = openssl_cipher_iv_length(self::$cipher);

        $iv = substr($data, 0, $ivLength);
        $encryptedText = substr($data, $ivLength);

        $secureKey = hash('sha256', $key, true);

        return openssl_decrypt($encryptedText, self::$cipher, $secureKey, OPENSSL_RAW_DATA, $iv);
    }
}
