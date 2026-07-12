// ===============================
// AssetFlow Dashboard JS
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    console.log("Dashboard Loaded");

    setupSidebar();

    setupSearch();

    animateCards();

    setupNotification();

    setupQuickActions();

    setupCounter();

});

// ===============================
// Sidebar Active Link
// ===============================

function setupSidebar() {

    const links = document.querySelectorAll(".sidebar li");

    links.forEach(link => {

        link.addEventListener("click", () => {

            links.forEach(l => l.classList.remove("active"));

            link.classList.add("active");

        });

    });

}

// ===============================
// Search Assets
// ===============================

function setupSearch() {

    const search = document.querySelector(".search input");

    const rows = document.querySelectorAll("tbody tr");

    if (!search) return;

    search.addEventListener("keyup", function () {

        let value = this.value.toLowerCase();

        rows.forEach(row => {

            row.style.display =
                row.innerText.toLowerCase().includes(value)
                    ? ""
                    : "none";

        });

    });

}

// ===============================
// Notification Button
// ===============================

function setupNotification() {

    const bell = document.querySelector(".icon-btn");

    if (!bell) return;

    bell.addEventListener("click", () => {

        alert("No new notifications.");

    });

}

// ===============================
// Quick Action Buttons
// ===============================

function setupQuickActions() {

    const buttons = document.querySelectorAll(".action-grid button");

    buttons.forEach(btn => {

        btn.addEventListener("click", () => {

            alert(btn.innerText + " Clicked");

        });

    });

}

// ===============================
// Counter Animation
// ===============================

function animateValue(element, start, end, duration) {

    let startTime = null;

    function animation(currentTime) {

        if (!startTime) startTime = currentTime;

        const progress = Math.min((currentTime - startTime) / duration, 1);

        element.innerText = Math.floor(progress * (end - start) + start);

        if (progress < 1) {

            requestAnimationFrame(animation);

        }

    }

    requestAnimationFrame(animation);

}

function setupCounter() {

    const cards = document.querySelectorAll(".card h2");

    const values = [1248, 932, 37, 48];

    cards.forEach((card, index) => {

        animateValue(card, 0, values[index], 1000);

    });

}

// ===============================
// Card Hover Animation
// ===============================

function animateCards() {

    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {

        card.addEventListener("mouseenter", () => {

            card.style.transform = "translateY(-8px)";

        });

        card.addEventListener("mouseleave", () => {

            card.style.transform = "translateY(0px)";

        });

    });

}

// ===============================
// Optional Sidebar Toggle
// ===============================

const sidebar = document.querySelector(".sidebar");

const menuButton = document.createElement("button");

menuButton.innerHTML = '<i class="fa-solid fa-bars"></i>';

menuButton.className = "menu-toggle";

document.body.appendChild(menuButton);

menuButton.style.position = "fixed";
menuButton.style.top = "20px";
menuButton.style.left = "20px";
menuButton.style.zIndex = "999";
menuButton.style.padding = "10px 14px";
menuButton.style.border = "none";
menuButton.style.background = "#2563eb";
menuButton.style.color = "#fff";
menuButton.style.borderRadius = "8px";
menuButton.style.display = "none";

function mobileMenu() {

    if (window.innerWidth < 576) {

        menuButton.style.display = "block";

    } else {

        menuButton.style.display = "none";

        sidebar.classList.remove("active");

    }

}

window.addEventListener("resize", mobileMenu);

mobileMenu();

menuButton.addEventListener("click", () => {

    sidebar.classList.toggle("active");

});

// ===============================
// Dashboard Loaded
// ===============================

console.log("AssetFlow Dashboard Ready");