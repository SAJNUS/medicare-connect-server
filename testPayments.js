async function runTests() {
  const BASE_URL = 'http://localhost:5001/payments';
  
  try {
    console.log("=== 1. POST /payments (Create 1) ===");
    const res1 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientEmail: "alice.smith@example.com",
        doctorEmail: "sarah.jenkins@medicare.com",
        appointmentId: "APP123",
        amount: 150,
        status: "pending"
      })
    });
    const data1 = await res1.json();
    console.log(JSON.stringify(data1, null, 2));
    const PAY_ID = data1.data.insertedId;

    console.log("\n=== POST /payments (Create 2) ===");
    await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientEmail: "bob.jones@example.com",
        doctorEmail: "adam.driver@medicare.com",
        appointmentId: "APP456",
        amount: 200,
        status: "paid"
      })
    });

    console.log("\n=== 2. GET /payments (All) ===");
    const res2 = await fetch(BASE_URL);
    console.log("Count:", (await res2.json()).count);

    console.log("\n=== 3. GET /payments?patientEmail=... ===");
    const res3 = await fetch(`${BASE_URL}?patientEmail=alice.smith@example.com`);
    console.log("Count:", (await res3.json()).count);

    console.log("\n=== 4. GET /payments?doctorEmail=... ===");
    const res4 = await fetch(`${BASE_URL}?doctorEmail=adam.driver@medicare.com`);
    console.log("Count:", (await res4.json()).count);

    console.log("\n=== 5. GET /payments?appointmentId=... ===");
    const res5 = await fetch(`${BASE_URL}?appointmentId=APP123`);
    console.log("Count:", (await res5.json()).count);

    console.log("\n=== 6. GET /payments/:id (Valid) ===");
    const res6 = await fetch(`${BASE_URL}/${PAY_ID}`);
    console.log("Email:", (await res6.json()).data.patientEmail);

    console.log("\n=== 7. GET /payments/:id (Invalid Format) ===");
    const res7 = await fetch(`${BASE_URL}/invalid123`);
    console.log(JSON.stringify(await res7.json(), null, 2));

    console.log("\n=== 8. GET /payments/:id (Non-existing) ===");
    const res8 = await fetch(`${BASE_URL}/609a12345678901234567890`);
    console.log(JSON.stringify(await res8.json(), null, 2));

    console.log("\n=== 9. PATCH /payments/:id/status (pending) ===");
    const res9 = await fetch(`${BASE_URL}/${PAY_ID}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: "pending" })
    });
    console.log(JSON.stringify(await res9.json(), null, 2));

    console.log("\n=== 10. PATCH /payments/:id/status (paid) ===");
    const res10 = await fetch(`${BASE_URL}/${PAY_ID}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: "paid" })
    });
    console.log(JSON.stringify(await res10.json(), null, 2));

    console.log("\n=== 11. PATCH /payments/:id/status (failed) ===");
    const res11 = await fetch(`${BASE_URL}/${PAY_ID}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: "failed" })
    });
    console.log(JSON.stringify(await res11.json(), null, 2));

    console.log("\n=== 12. PATCH /payments/:id/status (refunded) ===");
    const res12 = await fetch(`${BASE_URL}/${PAY_ID}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: "refunded" })
    });
    console.log(JSON.stringify(await res12.json(), null, 2));

    console.log("\n=== 13. PATCH /payments/:id/status (invalid) ===");
    const res13 = await fetch(`${BASE_URL}/${PAY_ID}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: "success" })
    });
    console.log(JSON.stringify(await res13.json(), null, 2));

    console.log("\n=== 14. DELETE /payments/:id (existing) ===");
    const res14 = await fetch(`${BASE_URL}/${PAY_ID}`, { method: 'DELETE' });
    console.log(JSON.stringify(await res14.json(), null, 2));

    console.log("\n=== 15. DELETE /payments/:id (non-existing) ===");
    const res15 = await fetch(`${BASE_URL}/${PAY_ID}`, { method: 'DELETE' });
    console.log(JSON.stringify(await res15.json(), null, 2));

  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

runTests();
