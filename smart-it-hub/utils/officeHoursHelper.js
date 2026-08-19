

const OFFICIAL_END_TIME = 960; // الساعة 4:00 العصر  =  وقت انتهاء الدوام الرسمي

function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
}

function addOneHour(timeStr) {
    if (!timeStr) return "";
    let [h, m] = timeStr.split(":").map(Number);
    h = h + 1;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getLastClassPerDayGroup(results) {
    const lastOnes = {};
    results.forEach((row) => {
        lastOnes[row.days] = row;
    });
    return Object.values(lastOnes);
}

function calculateGaps(results) {
    let suggestions = [];
    if (!results || results.length === 0) return suggestions;

    for (let i = 0; i < results.length - 1; i++) {
        const current = results[i];
        const next = results[i + 1];

        if (current.days === next.days && current.end_time && next.start_time) {
            const endInMin = timeToMinutes(current.end_time);
            const startInMin = timeToMinutes(next.start_time);

            if (startInMin - endInMin >= 60) {
                suggestions.push({
                    day: current.days,
                    start: current.end_time.substring(0, 5),
                    end: addOneHour(current.end_time),
                    type: "فجوة بين محاضرات"
                });
            }
        }
    }

    const lastClasses = getLastClassPerDayGroup(results);

    lastClasses.forEach((lastClass) => {
        const classEndInMin = timeToMinutes(lastClass.end_time);

        // إذا الدكتور خلص قبل الساعة 4 بفرق ساعة أو أكثر
        if (OFFICIAL_END_TIME - classEndInMin >= 60) {
            suggestions.push({
                day: lastClass.days,
                start: lastClass.end_time.substring(0, 5),
                end: addOneHour(lastClass.end_time),
                type: "بعد انتهاء محاضراتك"
            });
        }
    });

    return suggestions;
}

module.exports = {
    calculateGaps,
    addOneHour,
    timeToMinutes,
    getLastClassPerDayGroup
};
