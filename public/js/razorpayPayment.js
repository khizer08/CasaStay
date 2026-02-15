document.addEventListener("DOMContentLoaded", function () {
  const payBtn = document.getElementById("pay-btn");
  if (!payBtn) return;

  const options = {
    key: payBtn.dataset.key,
    amount: payBtn.dataset.amount,
    currency: "INR",
    name: "CasaStay",
    description: "Booking Payment",
    order_id: payBtn.dataset.order,

    handler: async function (response) {
      try {
        const res = await fetch("/bookings/verify-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            bookingId: payBtn.dataset.booking,
          }),
        });

        const data = await res.json();

        if (data.success) {
          window.location.href =
            "/bookings/" + payBtn.dataset.booking + "/confirmation";
        } else {
          alert("Payment Verification Failed");
        }
      } catch (err) {
        alert("Something Went Wrong");
      }
    },

    theme: {
      color: "#212529",
    },
  };

  const rzp = new Razorpay(options);

  payBtn.addEventListener("click", function (e) {
    e.preventDefault();
    rzp.open();
  });
});
