const CryptoEngine = {
    async generateKeyPair() {
        return await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },
            true,
            ["encrypt", "decrypt"]
        );
    },

    async exportPublicKey(key) {
        const exported = await window.crypto.subtle.exportKey("spki", key);
        return btoa(String.fromCharCode(...new Uint8Array(exported)));
    },

    async importPublicKey(pemB64) {
        const binaryDerString = window.atob(pemB64);
        const binaryDer = new Uint8Array(binaryDerString.length);
        for (let i = 0; i < binaryDerString.length; i++) {
            binaryDer[i] = binaryDerString.charCodeAt(i);
        }
        return await window.crypto.subtle.importKey(
            "spki",
            binaryDer.buffer,
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["encrypt"]
        );
    },

    async encryptText(text, publicKey) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const encrypted = await window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            publicKey,
            data
        );
        return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    },

    async decryptText(encryptedB64, privateKey) {
        const binaryString = window.atob(encryptedB64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const decrypted = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            bytes.buffer
        );
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    }
};