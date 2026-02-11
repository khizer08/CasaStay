function openBookingModal() {
    document.getElementById("bookingModal").style.display = "flex";
}

function closeBookingModal() {
    document.getElementById("bookingModal").style.display = "none";
}

const pricePerNight = Number(
    document.querySelector(".price")
        .innerText
        .match(/\d+/g)
        .join("")
);

const checkIn = document.getElementById("checkIn");
const checkOut = document.getElementById("checkOut");

function calculatePrice() {
    if (!checkIn.value || !checkOut.value) return;

    const start = new Date(checkIn.value);
    const end = new Date(checkOut.value);

    if (start >= end) return;

    const diff = end - start;
    const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));

    const subtotal = nights * pricePerNight;
    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst;

    document.getElementById("nights").innerText = nights;
    document.getElementById("subtotal").innerText = subtotal;
    document.getElementById("gst").innerText = gst;
    document.getElementById("total").innerText = total;
}

checkIn?.addEventListener("change", calculatePrice);
checkOut?.addEventListener("change", calculatePrice);