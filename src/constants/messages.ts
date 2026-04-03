export const MESSAGES = {
  AUTH: {
    ACCESS_TOKEN_MISSING: "Access Token is missing",
    ACCESS_TOKEN_INVALID: "Access Token is invalid or expired",
    INVALID_CREDENTIALS: "Invalid username or password",
    REFRESH_COOKIE_MISSING: "Refresh Token Cookie is missing",
    REFRESH_TOKEN_INVALID: "Refresh Token is invalid or expired",
    ALREADY_LOGGED_OUT: "Already logged out",
    LOGGED_OUT_SUCCESS: "Logged out successfully",
    TOKEN_NOT_FOUND: "Token not found",
    TOKEN_REUSE_DETECTED: "Token reuse detected! All sessions invalidated.",
    INVALID_OR_EXPIRED_TOKEN: "Invalid or expired token",
    INVALID_TOKEN_EXPIRY: "Invalid REFRESH_TOKEN_EXPIRY mathematically parsed: ",
    UNAUTHENTICATED: "UNAUTHENTICATED",
    NOT_AUTHORIZED: "Not authorized"
  },
  RATE_LIMIT: {
    TOO_MANY_REQUESTS: "Too many requests from this IP, please try again after 15 minutes"
  }
};

export const VALIDATION_MESSAGES = {
  USER: {
    USERNAME_MIN: "Username must be at least 3 characters long",
    EMAIL_INVALID: "Invalid email address completely blocked!",
    PASSWORD_MIN: "Password must be at least 6 characters physically!",
    DISPLAY_NAME_MIN: "Display name must be at least 3 characters long",
  },
  EXOPLANET: {
    NAME_MIN: "Exoplanet name must be at least 2 characters",
    URL_INVALID: "Image URL must be a valid web address",
    RESEARCHER_ID_INVALID: "Lead Researcher ID must be a valid continuous UUID",
    DISTANCE_INVALID: "Distance must be a valid positive numeric format",
  }
};
