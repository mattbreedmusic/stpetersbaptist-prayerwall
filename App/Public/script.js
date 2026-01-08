function showForm(type) {
//highlight selected button//
console.log(1)
document.querySelector(".main-btn.selected")?.classList.remove("selected")
console.log(2)
document.querySelector("#"+type+"Btn")?.classList.add("selected")
console.log(3)
document.querySelector("#type").value=type
//show correct form//
document.querySelector("#entryForm").style.display="block"
}

async function submitForm(e) {
  e.preventDefault();
  const type = document.getElementById("type").value;
  const message = document.getElementById("message").value;
  const name = document.getElementById("name").value;

  await fetch("https://b5gzzagrol.execute-api.eu-west-2.amazonaws.com/prayers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, message, name })
  });

  alert("Thank you for sharing!");
  e.target.reset();
  document.getElementById("entryForm").style.display = "none";
}

async function sendToProjection() {
  const response = await fetch("/send-to-projection", { method: "POST" });
  if (response.ok) {
    alert("Projection email sent successfully!");
  } else {
    alert("Something went wrong while sending the projection.");
  }
}

