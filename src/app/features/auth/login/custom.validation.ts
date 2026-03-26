import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function emailOrPhoneValidator(countryCode: string | number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value?.trim();
        
        if (!value) {
            return null; // Let required validator handle empty
        }

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        
        if (isEmail) {
            return null; // Valid email
        }

        // Check for phone number
        const phoneDigits = value.replace(/\D/g, '');
        const code = String(countryCode);
        
        // For Indian numbers (91)
        if (code === '91') {
            if (phoneDigits.length === 10) {
                return null; // Valid 10-digit Indian number
            }
            if (phoneDigits.length < 10) {
                return { phone: 'Phone number must be 10 digits' };
            }
            if (phoneDigits.length > 10) {
                return { phone: 'Phone number should not exceed 10 digits' };
            }
        }
        
        // For other country codes - minimum 5 digits
        if (phoneDigits.length >= 5 && phoneDigits.length <= 15) {
            return null;
        }

        return { 
            invalidFormat: 'Please enter a valid email or 10-digit phone number' 
        };
    };
}

