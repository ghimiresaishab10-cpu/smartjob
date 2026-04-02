// ---------- LOGIN ----------
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const loginMessage = document.getElementById("loginMessage");

    loginMessage.className = "message";
    loginMessage.textContent = "";

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.success) {
        loginMessage.textContent = data.message || "Login successful";
        loginMessage.classList.add("success");

        localStorage.setItem("user", JSON.stringify(data));

        setTimeout(() => {
          window.location.href = "index.html";
        }, 1000);
      } else {
        loginMessage.textContent = data.message || "Login failed";
        loginMessage.classList.add("error");
      }
    } catch (error) {
      loginMessage.textContent = "Server error";
      loginMessage.classList.add("error");
      console.log(error);
    }
  });
}

// ---------- REGISTER ----------
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("registerFullName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const confirmPassword = document.getElementById("registerConfirmPassword").value.trim();
    const registerMessage = document.getElementById("registerMessage");

    registerMessage.className = "message";
    registerMessage.textContent = "";

    if (password !== confirmPassword) {
      registerMessage.textContent = "Passwords do not match";
      registerMessage.classList.add("error");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          confirmPassword
        })
      });

      const data = await res.json();

      if (data.success) {
        registerMessage.textContent = data.message || "Registration successful";
        registerMessage.classList.add("success");

        setTimeout(() => {
          window.location.href = "login.html";
        }, 1000);
      } else {
        registerMessage.textContent = data.message || "Registration failed";
        registerMessage.classList.add("error");
      }
    } catch (error) {
      registerMessage.textContent = "Server error";
      registerMessage.classList.add("error");
      console.log(error);
    }
  });
}