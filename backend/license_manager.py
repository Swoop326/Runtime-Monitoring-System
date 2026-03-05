# License Management Module
# Responsible for validating software license keys

valid_licenses = ["ABC123", "XYZ999"]

def validate_license(key):
    """
    Checks if the given license key is valid.
    """
    
    if key in valid_licenses:
        return True
    
    return False