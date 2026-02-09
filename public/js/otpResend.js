const timerEl = document.getElementById("timer");
const resendMsg = document.getElementById("resendMsg");
const resendBtn = document.getElementById("resendBtn");

if (timerEl && resendBtn && resendMsg) {
  let time = Number(timerEl.dataset.seconds) || 60;

  const countdown = setInterval(() => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    timerEl.textContent =
      minutes + ":" + (seconds < 10 ? "0" : "") + seconds;

    time--;

    if (time < 0) {
      clearInterval(countdown);
      resendMsg.textContent = "You can resend OTP now";
      resendBtn.disabled = false;
    }
  }, 1000);
}