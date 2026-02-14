const timerEl = document.getElementById("timer");
const resendMsg = document.getElementById("resendMsg");
const resendBtn = document.getElementById("resendBtn");

if (timerEl && resendBtn && resendMsg) {
  // Use backend expiry instead of hardcoded seconds
  const expiryTime = window.otpExpiry || 0;

  const countdown = setInterval(() => {
    const now = Date.now();
    const remaining = expiryTime - now;

    if (remaining <= 0) {
      clearInterval(countdown);
      timerEl.textContent = "0:00";
      resendMsg.textContent = "You Can Resend OTP Now";
      resendBtn.disabled = false;
      return;
    }

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    timerEl.textContent = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
  }, 1000);
}
