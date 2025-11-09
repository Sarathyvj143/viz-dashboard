"""
Custom exceptions for better error handling throughout the application
"""


class AuthenticationError(Exception):
    """Base exception for authentication errors"""
    pass


class InvalidTokenError(AuthenticationError):
    """Token is invalid or malformed"""
    pass


class ExpiredTokenError(AuthenticationError):
    """Token has expired"""
    pass


class BlacklistedTokenError(AuthenticationError):
    """Token has been blacklisted"""
    pass
