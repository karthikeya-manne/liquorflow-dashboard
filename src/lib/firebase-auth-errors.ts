/**
 * Maps Firebase Auth error codes to short, actionable copy for the login form.
 */
export function firebaseAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
      ? (error as { code: string }).code
      : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Wrong email or password. If you are new here, use Create Account. Otherwise try Forgot password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Sign in instead.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes or reset your password.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is disabled in Firebase. Enable it in Firebase Console → Authentication → Sign-in method.";
    default: {
      if (error instanceof Error && error.message) {
        return error.message;
      }
      return "Sign-in failed. Please try again.";
    }
  }
}
