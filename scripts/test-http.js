async function check() {
    const res = await fetch('http://localhost:4321/', { redirect: 'manual' });
    console.log('Status:', res.status);
    console.log('Headers:', Object.fromEntries(res.headers.entries()));
}
check();
