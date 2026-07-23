import re

class IndianPlateValidator:
    @staticmethod
    def normalize_string(text: str) -> str:
        """Removes spaces, hyphens, and non-alphanumeric characters. Converts to uppercase."""
        return re.sub(r'[^A-Z0-9]', '', text.upper())

    @staticmethod
    def position_aware_correction(text: str) -> str:
        """
        Corrects common OCR mistakes based on positional expectation for Indian plates.
        Expects normalized string (e.g., MH08RS0714).
        Standard format: 2 Letters + 2 Digits + (1 or 2) Letters + 4 Digits
        """
        if len(text) < 8 or len(text) > 10:
            return text  # Cannot reliably correct if length is completely off

        chars = list(text)
        
        # Last 4 characters are always digits
        for i in range(len(chars) - 4, len(chars)):
            chars[i] = IndianPlateValidator._to_digit(chars[i])
            
        # First 2 characters are always letters
        for i in range(0, 2):
            chars[i] = IndianPlateValidator._to_letter(chars[i])
            
        # Characters 2 and 3 are always digits (District code)
        for i in range(2, 4):
            chars[i] = IndianPlateValidator._to_digit(chars[i])
            
        # The remaining middle characters are letters (Series)
        for i in range(4, len(chars) - 4):
            chars[i] = IndianPlateValidator._to_letter(chars[i])
            
        return "".join(chars)
        
    @staticmethod
    def _to_digit(c: str) -> str:
        corrections = {
            'O': '0',
            'I': '1',
            'L': '1',
            'Z': '2',
            'S': '5',
            'B': '8',
            'G': '6',
            'T': '7'
        }
        return corrections.get(c, c)
        
    @staticmethod
    def _to_letter(c: str) -> str:
        corrections = {
            '0': 'O',
            '1': 'I',
            '2': 'Z',
            '5': 'S',
            '8': 'B'
        }
        return corrections.get(c, c)
        
    @staticmethod
    def is_valid_format(text: str) -> bool:
        """
        Validates if the normalized text loosely fits an Indian plate format.
        """
        pattern = r'^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$'
        return bool(re.match(pattern, text))
