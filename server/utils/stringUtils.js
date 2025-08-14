// utils/stringUtils.js

const removeSpecChar = (inputString) => {
    const inputStringAsString = inputString.toString();
    const numberOnly = inputStringAsString.replace(/\D/g, '');
    return numberOnly;
};
  
const validateStrAlphaNumDot = (inputString) => {
    // Regular expression to allow a-z, A-Z, 0-9, ., and space
    const regex = /^[a-zA-Z0-9. ]*$/;
    return regex.test(inputString);
};

const generateSlug = (name) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .trim()
        .replace(/[\s/]+/g, '-') // Replace spaces with hyphens
        .replace(/-+$/g, ''); // Remove trailing hyphens
};
  

// Converts a string to Pascal Case (e.g., "web developer" => "Web Developer")
// Trims extra spaces and normalizes casing.
const toPascalCase = (str) => {
    return str
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
  
//Trims and converts string to lowercase for comparison.
const normalizeString = (str) => {
    return str.trim().toLowerCase();
};
  

module.exports = { removeSpecChar, validateStrAlphaNumDot, 
    generateSlug, toPascalCase, normalizeString };
  