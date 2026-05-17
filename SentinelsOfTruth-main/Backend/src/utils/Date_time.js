export default function date_time() {
    const now = new Date();

    return {
        time: now.toLocaleTimeString(),
        date: now.toLocaleDateString()
    };
}

