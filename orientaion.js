let wsc = new WebSocket("ws://localhost:8080")
window.addEventListener('deviceorientation', (event) => {
    const { gamma, alpha } = event;
    wsc.send(Math.round(alpha))
});
